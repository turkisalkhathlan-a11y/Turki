// محرك تنقيح البيانات الشخصية من الأحكام القضائية
// Arabic Personal Data Redaction Engine - v2 (Fixed)

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
// Arabic Name Detection
// ============================================================

// Words that are NOT part of a person's name - stop matching when we hit these
const STOP_WORDS = new Set([
  'بدعوى', 'ضد', 'يطالب', 'فيها', 'بمبلغ', 'ريال', 'قيمة', 'بموجب',
  'وقدم', 'صورة', 'من', 'العقد', 'وفواتير', 'وأقر', 'بالعقد', 'لكنه',
  'دفع', 'بأن', 'كانت', 'في', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه',
  'التي', 'الذي', 'التوريد', 'البضائع', 'معيبة', 'الدعوى', 'الحكم',
  'بدفع', 'مبلغ', 'للمدعي', 'رفض', 'باقي', 'الطلبات', 'حكمت', 'الدائرة',
  'بإلزام', 'تقدم', 'حضر', 'وكيل', 'كما', 'وقد', 'بناءً', 'تقدم',
  'رقم', 'الهوية', 'الجوال', 'العنوان', 'البريد', 'الإلكتروني',
  'الوكيل', 'الحساب', 'البنكي', 'للمدعي', 'وقائع',
])

// Check if a word looks like part of an Arabic name (not a stop word, not a common verb/preposition)
function isNameWord(word: string): boolean {
  if (word.length < 2) return false
  if (STOP_WORDS.has(word)) return false
  // Must be Arabic characters only
  if (!/^[\u0600-\u06FF]+$/.test(word)) return false
  return true
}

// Name connectors
const NAME_CONNECTOR_SET = new Set(['بن', 'بنت', 'ابن', 'ابنة', 'آل'])

// Extract a person name starting at a given position in a line
function extractNameFromPosition(line: string, startIdx: number): string | null {
  const rest = line.substring(startIdx).trim()
  const words = rest.split(/\s+/)

  const nameParts: string[] = []

  for (let i = 0; i < words.length && i < 10; i++) {
    const word = words[i]

    // Name connectors are always okay
    if (NAME_CONNECTOR_SET.has(word)) {
      nameParts.push(word)
      continue
    }

    // Check if it's a valid name word
    if (isNameWord(word)) {
      nameParts.push(word)
    } else {
      break
    }
  }

  // A name must have at least 2 parts (first name + family or first + بن + second)
  if (nameParts.length < 2) return null

  // Don't end on a connector
  while (nameParts.length > 0 && NAME_CONNECTOR_SET.has(nameParts[nameParts.length - 1])) {
    nameParts.pop()
  }

  if (nameParts.length < 2) return null

  return nameParts.join(' ')
}

// Legal role prefixes that precede person names
const NAME_PREFIXES = [
  'المدعى عليه',
  'المدعى عليها',
  'المدعية',
  'المدعي',
  'المتهم',
  'المتهمة',
  'الشاهد',
  'الشاهدة',
  'المحامي',
  'المحامية',
  'الوكيل',
  'الوكيلة',
  'المستأنف ضده',
  'المستأنف ضدها',
  'المستأنفة',
  'المستأنف',
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
]

// Common Arabic first names
const COMMON_FIRST_NAMES = new Set([
  'محمد', 'أحمد', 'عبدالله', 'عبدالرحمن', 'عبدالعزيز', 'عبدالملك',
  'خالد', 'سعد', 'سعود', 'فهد', 'تركي', 'سلطان', 'بندر', 'فيصل',
  'ناصر', 'نايف', 'مشعل', 'عمر', 'علي', 'حسن', 'حسين', 'إبراهيم',
  'صالح', 'يوسف', 'ياسر', 'ماجد', 'سامي', 'طارق', 'وليد', 'هاني',
  'بدر', 'مساعد', 'منصور', 'مشاري', 'عادل', 'سليمان', 'داود',
  'نورة', 'فاطمة', 'عائشة', 'مريم', 'سارة', 'هند', 'منيرة', 'لطيفة',
  'موضي', 'نوف', 'ريم', 'دلال', 'أمل', 'هيا', 'جواهر', 'العنود',
])

function findNames(text: string): RedactedEntity[] {
  const entities: RedactedEntity[] = []
  const lines = text.split('\n')
  let offset = 0

  for (const line of lines) {
    // Strategy 1: Find names after legal prefixes
    for (const prefix of NAME_PREFIXES) {
      let searchFrom = 0
      while (true) {
        const prefixIdx = line.indexOf(prefix, searchFrom)
        if (prefixIdx === -1) break

        const afterPrefix = prefixIdx + prefix.length
        // Skip optional colon/slash and whitespace
        const afterPrefixStr = line.substring(afterPrefix)
        const skipMatch = afterPrefixStr.match(/^[\s/:]*/)
        const nameStartInLine = afterPrefix + (skipMatch ? skipMatch[0].length : 0)

        const name = extractNameFromPosition(line, nameStartInLine)
        if (name) {
          const nameActualStart = line.indexOf(name, nameStartInLine)
          if (nameActualStart >= 0) {
            entities.push({
              type: 'اسم شخص',
              original: name,
              start: offset + nameActualStart,
              end: offset + nameActualStart + name.length,
              replacement: '[اسم شخص]',
            })
          }
        }

        searchFrom = afterPrefix
      }
    }

    // Strategy 2: Find "FirstName بن SecondName" patterns anywhere in the line
    const words = line.split(/\s+/)
    let wordStart = 0
    for (let i = 0; i < words.length; i++) {
      const wordPos = line.indexOf(words[i], wordStart)

      if (
        COMMON_FIRST_NAMES.has(words[i]) &&
        i + 1 < words.length &&
        NAME_CONNECTOR_SET.has(words[i + 1])
      ) {
        const name = extractNameFromPosition(line, wordPos)
        if (name) {
          const nameStart = offset + wordPos
          // Check we haven't already captured this exact span
          const alreadyCaptured = entities.some(
            e => e.start === nameStart && e.end === nameStart + name.length
          )
          if (!alreadyCaptured) {
            entities.push({
              type: 'اسم شخص',
              original: name,
              start: nameStart,
              end: nameStart + name.length,
              replacement: '[اسم شخص]',
            })
          }
        }
      }

      wordStart = wordPos + words[i].length
    }

    offset += line.length + 1 // +1 for the \n
  }

  return entities
}

// ============================================================
// ID Number Patterns
// ============================================================

function findIds(text: string): RedactedEntity[] {
  const entities: RedactedEntity[] = []

  // Pattern 1: ID with context keyword
  const contextPattern = /(?:هوية|هويته|هويتها|رقم الهوية|بطاقة الأحوال|الأحوال المدنية|إقامة|رقم الإقامة|سجل مدني|الهوية الوطنية)\s*[:/]?\s*(\d{10})/g
  let match
  while ((match = contextPattern.exec(text)) !== null) {
    const num = match[1]
    const numStart = text.indexOf(num, match.index)
    entities.push({
      type: 'رقم هوية',
      original: num,
      start: numStart,
      end: numStart + num.length,
      replacement: '[رقم هوية]',
    })
  }

  // Pattern 2: Standalone 10-digit starting with 1 or 2 (only if not already captured)
  const standalonePattern = /(?<!\d)([12]\d{9})(?!\d)/g
  while ((match = standalonePattern.exec(text)) !== null) {
    const num = match[1]
    const start = match.index
    const alreadyCaptured = entities.some(e => e.start === start && e.end === start + num.length)
    if (!alreadyCaptured) {
      entities.push({
        type: 'رقم هوية',
        original: num,
        start,
        end: start + num.length,
        replacement: '[رقم هوية]',
      })
    }
  }

  return entities
}

// ============================================================
// Phone Number Patterns
// ============================================================

function findPhones(text: string): RedactedEntity[] {
  const entities: RedactedEntity[] = []
  const patterns: RegExp[] = [
    /(?:هاتف|جوال|رقم الجوال|رقم الهاتف|موبايل|تلفون|اتصال|للتواصل)\s*[:/]?\s*((?:\+966|00966|0)5\d{8})/g,
    /(?<![/\d])((?:\+966|00966)[\s-]?5\d{8})(?!\d)/g,
    /(?<![/\d])(05\d{8})(?!\d)/g,
  ]

  for (const pattern of patterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(text)) !== null) {
      const phone = match[1]
      const phoneStart = text.indexOf(phone, match.index)
      const already = entities.some(
        e => Math.abs(e.start - phoneStart) < 3
      )
      if (!already) {
        entities.push({
          type: 'رقم هاتف',
          original: phone,
          start: phoneStart,
          end: phoneStart + phone.length,
          replacement: '[رقم هاتف]',
        })
      }
    }
  }

  return entities
}

// ============================================================
// Bank Account Patterns
// ============================================================

function findBankAccounts(text: string): RedactedEntity[] {
  const entities: RedactedEntity[] = []
  const patterns: RegExp[] = [
    /(?:آيبان|حساب بنكي|رقم الحساب|الحساب البنكي|IBAN)\s*[:/]?\s*(SA\d{22})/gi,
    /\b(SA\d{22})\b/g,
  ]

  for (const pattern of patterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(text)) !== null) {
      const account = match[1]
      const start = text.indexOf(account, match.index)
      const already = entities.some(e => e.start === start)
      if (!already) {
        entities.push({
          type: 'رقم حساب بنكي',
          original: account,
          start,
          end: start + account.length,
          replacement: '[رقم حساب بنكي]',
        })
      }
    }
  }

  return entities
}

// ============================================================
// Address Patterns
// ============================================================

function findAddresses(text: string): RedactedEntity[] {
  const entities: RedactedEntity[] = []

  // Capture the full address line after address keywords until end of line or next comma section
  const pattern = /(?:عنوان|العنوان|يقيم في|يسكن في|مقيم في|الكائن في|عنوانه|عنوانها)\s*[:/]?\s*([^\n]+)/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    const address = match[1].trim()
    if (address.length < 3) continue
    const start = text.indexOf(address, match.index)
    entities.push({
      type: 'عنوان',
      original: address,
      start,
      end: start + address.length,
      replacement: '[عنوان]',
    })
  }

  // Postal codes
  const postalPattern = /(?:رمز بريدي|الرمز البريدي|صندوق بريد)\s*[:/]?\s*(\d{4,6})/g
  while ((match = postalPattern.exec(text)) !== null) {
    const code = match[1]
    const start = text.indexOf(code, match.index)
    entities.push({
      type: 'عنوان',
      original: code,
      start,
      end: start + code.length,
      replacement: '[عنوان]',
    })
  }

  return entities
}

// ============================================================
// Email Patterns
// ============================================================

function findEmails(text: string): RedactedEntity[] {
  const entities: RedactedEntity[] = []
  const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    entities.push({
      type: 'بريد إلكتروني',
      original: match[0],
      start: match.index,
      end: match.index + match[0].length,
      replacement: '[بريد إلكتروني]',
    })
  }
  return entities
}

// ============================================================
// Commercial Registration Patterns
// ============================================================

function findCommercialReg(text: string): RedactedEntity[] {
  const entities: RedactedEntity[] = []
  const pattern = /(?:سجل تجاري|رقم السجل التجاري|السجل التجاري)\s*[:/]?\s*(\d{7,10})/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    const num = match[1]
    const start = text.indexOf(num, match.index)
    entities.push({
      type: 'رقم سجل تجاري',
      original: num,
      start,
      end: start + num.length,
      replacement: '[رقم سجل تجاري]',
    })
  }
  return entities
}

// ============================================================
// Passport Patterns
// ============================================================

function findPassports(text: string): RedactedEntity[] {
  const entities: RedactedEntity[] = []
  const pattern = /(?:جواز سفر|رقم الجواز|جواز)\s*[:/]?\s*([A-Z]\d{6,9})/gi
  let match
  while ((match = pattern.exec(text)) !== null) {
    const num = match[1]
    const start = text.indexOf(num, match.index)
    entities.push({
      type: 'رقم جواز سفر',
      original: num,
      start,
      end: start + num.length,
      replacement: '[رقم جواز سفر]',
    })
  }
  return entities
}

// ============================================================
// Overlap Resolution
// ============================================================

function resolveOverlaps(entities: RedactedEntity[]): RedactedEntity[] {
  if (entities.length === 0) return []

  // Sort by start position, then by length (longer first)
  const sorted = [...entities].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start
    return (b.end - b.start) - (a.end - a.start)
  })

  const result: RedactedEntity[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = result[result.length - 1]

    // If current is completely inside the last one, skip it
    if (current.start >= last.start && current.end <= last.end) {
      continue
    }

    // If there's overlap, keep the one that started first (already in result)
    if (current.start < last.end) {
      continue
    }

    // No overlap
    result.push(current)
  }

  return result
}

// ============================================================
// Main Redaction Function
// ============================================================

export function redactDocument(
  text: string,
  options: RedactionOptions = defaultRedactionOptions
): RedactionResult {
  let allEntities: RedactedEntity[] = []

  // Collect entities from each detector
  if (options.redactEmails) allEntities.push(...findEmails(text))
  if (options.redactBankAccounts) allEntities.push(...findBankAccounts(text))
  if (options.redactPassports) allEntities.push(...findPassports(text))
  if (options.redactCommercialReg) allEntities.push(...findCommercialReg(text))
  if (options.redactPhones) allEntities.push(...findPhones(text))
  if (options.redactIds) allEntities.push(...findIds(text))
  if (options.redactAddresses) allEntities.push(...findAddresses(text))
  if (options.redactNames) allEntities.push(...findNames(text))

  // Resolve overlaps (prefer more specific types over names when they overlap)
  // Priority: specific types first, then names
  const specificEntities = allEntities.filter(e => e.type !== 'اسم شخص')
  const nameEntities = allEntities.filter(e => e.type === 'اسم شخص')

  // Remove names that overlap with specific entities
  const filteredNames = nameEntities.filter(name => {
    return !specificEntities.some(
      specific =>
        (name.start >= specific.start && name.start < specific.end) ||
        (name.end > specific.start && name.end <= specific.end) ||
        (name.start <= specific.start && name.end >= specific.end)
    )
  })

  const combined = [...specificEntities, ...filteredNames]
  const resolved = resolveOverlaps(combined)

  // Apply redactions from end to start
  const sortedDesc = [...resolved].sort((a, b) => b.start - a.start)
  let redactedText = text
  for (const entity of sortedDesc) {
    redactedText =
      redactedText.substring(0, entity.start) +
      entity.replacement +
      redactedText.substring(entity.end)
  }

  // Calculate stats
  const allTypes: EntityType[] = [
    'اسم شخص', 'رقم هوية', 'رقم هاتف', 'رقم حساب بنكي',
    'عنوان', 'بريد إلكتروني', 'رقم سجل تجاري', 'رقم جواز سفر',
  ]
  const stats = {} as Record<EntityType, number>
  for (const type of allTypes) {
    stats[type] = resolved.filter(e => e.type === type).length
  }

  return {
    redactedText,
    entities: resolved.sort((a, b) => a.start - b.start),
    stats,
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
