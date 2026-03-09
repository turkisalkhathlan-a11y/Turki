// محرك تنقيح البيانات الشخصية من الأحكام القضائية
// Arabic Personal Data Redaction Engine

export interface RedactedEntity {
  type: EntityType
  original: string
  start: number
  end: number
  replacement: string
}

export type EntityType =
  | 'اسم شخص'
  | 'رقم هوية'
  | 'رقم هاتف'
  | 'رقم حساب بنكي'
  | 'عنوان'
  | 'بريد إلكتروني'
  | 'رقم سجل تجاري'
  | 'رقم جواز سفر'

export interface RedactionResult {
  redactedText: string
  entities: RedactedEntity[]
  stats: Record<EntityType, number>
}

export interface RedactionOptions {
  redactNames: boolean
  redactIds: boolean
  redactPhones: boolean
  redactBankAccounts: boolean
  redactAddresses: boolean
  redactEmails: boolean
  redactCommercialReg: boolean
  redactPassports: boolean
}

export const defaultRedactionOptions: RedactionOptions = {
  redactNames: true,
  redactIds: true,
  redactPhones: true,
  redactBankAccounts: true,
  redactAddresses: true,
  redactEmails: true,
  redactCommercialReg: true,
  redactPassports: true,
}

// ============================================================
// Arabic Name Detection Patterns
// ============================================================

// Common Arabic name prefixes that appear before person names in legal texts
const NAME_PREFIXES = [
  'المدعي',
  'المدعى عليه',
  'المدعى عليها',
  'المدعية',
  'المتهم',
  'المتهمة',
  'الشاهد',
  'الشاهدة',
  'المحامي',
  'المحامية',
  'الوكيل',
  'الوكيلة',
  'المستأنف',
  'المستأنفة',
  'المستأنف ضده',
  'المستأنف ضدها',
  'الطاعن',
  'الطاعنة',
  'المطعون ضده',
  'المطعون ضدها',
  'القاضي',
  'صاحب الفضيلة',
  'فضيلة الشيخ',
  'السيد',
  'السيدة',
  'الأستاذ',
  'الأستاذة',
  'المواطن',
  'المواطنة',
  'المقيم',
  'المقيمة',
  'الموظف',
  'الموظفة',
  'العامل',
  'العاملة',
  'صاحب',
  'صاحبة',
]

// Common Arabic first names for detection
const COMMON_FIRST_NAMES = [
  'محمد', 'أحمد', 'عبدالله', 'عبدالرحمن', 'عبدالعزيز', 'عبدالملك',
  'خالد', 'سعد', 'سعود', 'فهد', 'تركي', 'سلطان', 'بندر', 'فيصل',
  'ناصر', 'نايف', 'مشعل', 'عمر', 'علي', 'حسن', 'حسين', 'إبراهيم',
  'صالح', 'يوسف', 'ياسر', 'ماجد', 'سامي', 'طارق', 'وليد', 'هاني',
  'بدر', 'مساعد', 'منصور', 'مشاري', 'عادل', 'سليمان', 'داود',
  'نورة', 'فاطمة', 'عائشة', 'مريم', 'سارة', 'هند', 'منيرة', 'لطيفة',
  'موضي', 'نوف', 'ريم', 'دلال', 'أمل', 'هيا', 'جواهر', 'العنود',
]

// "bin/bint" connectors in Arabic names
const NAME_CONNECTORS = ['بن', 'بنت', 'ابن', 'ابنة', 'آل', 'ال']

// Build regex for Arabic person names following prefixes
function buildNamePatterns(): RegExp[] {
  const patterns: RegExp[] = []

  // Pattern 1: prefix + name (e.g., "المدعي محمد بن عبدالله بن سعود")
  const prefixGroup = NAME_PREFIXES.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  // Match prefix followed by a slash or colon then a name, or just a space then a name
  patterns.push(
    new RegExp(
      `(?:${prefixGroup})\\s*[/:]?\\s*((?:[\\u0600-\\u06FF]+\\s+(?:بن|بنت|ابن|ابنة)?\\s*){1,6}[\\u0600-\\u06FF]+)`,
      'g'
    )
  )

  // Pattern 2: Common first names followed by "بن" chain
  const firstNameGroup = COMMON_FIRST_NAMES.join('|')
  patterns.push(
    new RegExp(
      `(?:^|\\s)((?:${firstNameGroup})(?:\\s+(?:بن|بنت)\\s+[\\u0600-\\u06FF]+){1,4})(?:\\s|\\.|،|$)`,
      'gm'
    )
  )

  return patterns
}

// ============================================================
// ID Number Patterns (Saudi and Gulf)
// ============================================================

function buildIdPatterns(): RegExp[] {
  return [
    // Saudi National ID (10 digits starting with 1) or Iqama (10 digits starting with 2)
    /(?:هوية|هويته|هويتها|رقم الهوية|بطاقة الأحوال|الأحوال المدنية|إقامة|رقم الإقامة|سجل مدني|الهوية الوطنية|هوية وطنية)\s*[:/]?\s*(\d{10})/g,
    // Standalone 10-digit numbers that look like IDs (starting with 1 or 2)
    /\b([12]\d{9})\b/g,
  ]
}

// ============================================================
// Phone Number Patterns
// ============================================================

function buildPhonePatterns(): RegExp[] {
  return [
    // Saudi phone: 05xxxxxxxx or +966 5xxxxxxxx
    /(?:هاتف|جوال|رقم الجوال|رقم الهاتف|موبايل|تلفون|اتصال|للتواصل)\s*[:/]?\s*((?:\+966|00966|0)?\s*5\d[\d\s-]{7,10})/g,
    // Standalone Saudi mobile numbers
    /\b((?:\+966|00966)[\s-]?5\d{8})\b/g,
    /\b(05\d[\s-]?\d{3}[\s-]?\d{4})\b/g,
    // Landline numbers
    /\b((?:\+966|00966)[\s-]?1[1-9]\d{7})\b/g,
    /\b(01[1-9][\s-]?\d{3}[\s-]?\d{4})\b/g,
  ]
}

// ============================================================
// Bank Account Patterns
// ============================================================

function buildBankPatterns(): RegExp[] {
  return [
    // IBAN (SA followed by 22 digits)
    /(?:آيبان|حساب بنكي|رقم الحساب|الحساب البنكي|حساب|IBAN)\s*[:/]?\s*(SA\d{22})/gi,
    /\b(SA\d{22})\b/g,
    // Generic bank account numbers (long digit sequences near banking context)
    /(?:حساب|رقم الحساب|الحساب البنكي)\s*[:/]?\s*(\d{10,24})/g,
  ]
}

// ============================================================
// Address Patterns
// ============================================================

function buildAddressPatterns(): RegExp[] {
  return [
    // Street addresses
    /(?:عنوان|العنوان|يقيم في|يسكن في|مقيم في|الكائن في|عنوانه|عنوانها)\s*[:/]?\s*([^،.]+(?:شارع|حي|طريق|منطقة|مدينة|محافظة|قرية)[^،.]*)/g,
    // Postal codes
    /(?:رمز بريدي|الرمز البريدي|صندوق بريد)\s*[:/]?\s*(\d{4,6})/g,
  ]
}

// ============================================================
// Email Patterns
// ============================================================

function buildEmailPatterns(): RegExp[] {
  return [
    /(?:بريد إلكتروني|إيميل|البريد|بريد)\s*[:/]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
  ]
}

// ============================================================
// Commercial Registration Patterns
// ============================================================

function buildCommercialRegPatterns(): RegExp[] {
  return [
    /(?:سجل تجاري|رقم السجل التجاري|السجل التجاري)\s*[:/]?\s*(\d{7,10})/g,
  ]
}

// ============================================================
// Passport Patterns
// ============================================================

function buildPassportPatterns(): RegExp[] {
  return [
    /(?:جواز سفر|رقم الجواز|جواز)\s*[:/]?\s*([A-Z]?\d{6,9})/gi,
  ]
}

// ============================================================
// Main Redaction Function
// ============================================================

export function redactDocument(
  text: string,
  options: RedactionOptions = defaultRedactionOptions
): RedactionResult {
  const entities: RedactedEntity[] = []

  // Collect all matches with their positions
  const addMatches = (
    patterns: RegExp[],
    type: EntityType,
    groupIndex: number = 1
  ) => {
    for (const pattern of patterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = pattern.exec(text)) !== null) {
        const captured = match[groupIndex] || match[0]
        const trimmed = captured.trim()
        if (trimmed.length < 2) continue

        // Calculate the actual position of the captured group
        const fullMatchStart = match.index
        const capturedStart = text.indexOf(trimmed, fullMatchStart)
        const start = capturedStart >= 0 ? capturedStart : fullMatchStart
        const end = start + trimmed.length

        // Check for duplicates
        const isDuplicate = entities.some(
          e => e.start === start && e.end === end
        )
        if (!isDuplicate) {
          entities.push({
            type,
            original: trimmed,
            start,
            end,
            replacement: `[${type}]`,
          })
        }
      }
    }
  }

  // Apply patterns based on options
  if (options.redactEmails) addMatches(buildEmailPatterns(), 'بريد إلكتروني')
  if (options.redactBankAccounts) addMatches(buildBankPatterns(), 'رقم حساب بنكي')
  if (options.redactPassports) addMatches(buildPassportPatterns(), 'رقم جواز سفر')
  if (options.redactCommercialReg) addMatches(buildCommercialRegPatterns(), 'رقم سجل تجاري')
  if (options.redactPhones) addMatches(buildPhonePatterns(), 'رقم هاتف')
  if (options.redactIds) addMatches(buildIdPatterns(), 'رقم هوية')
  if (options.redactAddresses) addMatches(buildAddressPatterns(), 'عنوان')
  if (options.redactNames) addMatches(buildNamePatterns(), 'اسم شخص')

  // Sort entities by start position (descending) so we can replace from end to start
  entities.sort((a, b) => b.start - a.start)

  // Remove overlapping entities (keep the one that starts first / is longer)
  const filtered: RedactedEntity[] = []
  for (const entity of entities) {
    const overlaps = filtered.some(
      e =>
        (entity.start >= e.start && entity.start < e.end) ||
        (entity.end > e.start && entity.end <= e.end)
    )
    if (!overlaps) {
      filtered.push(entity)
    }
  }

  // Apply redactions (from end to start to preserve positions)
  let redactedText = text
  for (const entity of filtered) {
    redactedText =
      redactedText.substring(0, entity.start) +
      entity.replacement +
      redactedText.substring(entity.end)
  }

  // Calculate stats
  const stats: Record<string, number> = {}
  const allTypes: EntityType[] = [
    'اسم شخص', 'رقم هوية', 'رقم هاتف', 'رقم حساب بنكي',
    'عنوان', 'بريد إلكتروني', 'رقم سجل تجاري', 'رقم جواز سفر',
  ]
  for (const type of allTypes) {
    stats[type] = filtered.filter(e => e.type === type).length
  }

  return {
    redactedText,
    entities: filtered.sort((a, b) => a.start - b.start),
    stats: stats as Record<EntityType, number>,
  }
}

// ============================================================
// Sample text for demonstration
// ============================================================

export const SAMPLE_LEGAL_TEXT = `بسم الله الرحمن الرحيم

المحكمة التجارية بالرياض
الدائرة التجارية الثالثة

القضية رقم: 4521/1445

المدعي: محمد بن عبدالله بن سعود آل فهد
رقم الهوية: 1087654321
الجوال: 0551234567
العنوان: حي النزهة، شارع الملك فهد، الرياض
البريد الإلكتروني: mohammed.fahd@email.com
الوكيل: الأستاذ خالد بن إبراهيم العتيبي

المدعى عليه: أحمد بن سعد بن ناصر القحطاني
رقم الهوية: 1023456789
الجوال: 0559876543
العنوان: حي الورود، شارع العليا، جدة
رقم السجل التجاري: 4030012345

الحساب البنكي للمدعي:
IBAN: SA0380000000608010167519

وقائع الدعوى:
تقدم المدعي محمد بن عبدالله بن سعود بدعوى ضد المدعى عليه أحمد بن سعد القحطاني يطالب فيها بمبلغ (500,000) ريال قيمة بضائع تم توريدها بموجب العقد المبرم بينهما بتاريخ 1445/03/15هـ.

وقد حضر وكيل المدعي الأستاذ خالد بن إبراهيم وقدم صورة من العقد وفواتير التوريد. كما حضر المدعى عليه أحمد بن سعد وأقر بالعقد لكنه دفع بأن البضائع كانت معيبة.

الحكم:
بناءً على ما تقدم، حكمت الدائرة بإلزام المدعى عليه بدفع مبلغ (400,000) ريال للمدعي، مع رفض باقي الطلبات.

صدر هذا الحكم في 1445/07/20هـ الموافق 2024/02/01م.
القاضي: فضيلة الشيخ عبدالرحمن بن صالح المنصور`
