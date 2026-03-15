// محرك التحقق من الصكوك القضائية
// يفحص الصك القضائي وفقاً لمحددات مضبوطة ويكتشف الأخطاء

export type ErrorSeverity = 'critical' | 'major' | 'minor' | 'warning'

export interface ValidationError {
  id: string
  category: string
  message: string
  severity: ErrorSeverity
  suggestion: string
  location?: string
}

export interface ValidationResult {
  documentText: string
  errors: ValidationError[]
  score: number // 0-100
  summary: string
  sections: SectionAnalysis[]
}

export interface SectionAnalysis {
  name: string
  found: boolean
  status: 'valid' | 'invalid' | 'missing' | 'incomplete'
  notes: string
}

// الأقسام الأساسية المطلوبة في الصك القضائي
const REQUIRED_SECTIONS = [
  { name: 'بسملة', keywords: ['بسم الله الرحمن الرحيم', 'بسم الله'] },
  { name: 'اسم المحكمة', keywords: ['محكمة', 'المحكمة', 'الدائرة'] },
  { name: 'رقم القضية', keywords: ['رقم القضية', 'رقم الدعوى', 'قضية رقم', 'دعوى رقم'] },
  { name: 'التاريخ', keywords: ['تاريخ', 'هـ', '14', '15'] },
  { name: 'بيانات الأطراف', keywords: ['المدعي', 'المدعى عليه', 'الطرف الأول', 'الطرف الثاني', 'المتهم'] },
  { name: 'وقائع الدعوى', keywords: ['الوقائع', 'تتلخص', 'تتحصل', 'ملخص الدعوى', 'موضوع الدعوى'] },
  { name: 'الأسباب والحيثيات', keywords: ['حيث أن', 'لما كان', 'الأسباب', 'التسبيب', 'بناءً على'] },
  { name: 'المنطوق / الحكم', keywords: ['حكمت', 'قررت', 'المنطوق', 'فلهذه الأسباب', 'بناءً عليه'] },
  { name: 'التوقيع', keywords: ['القاضي', 'رئيس الدائرة', 'عضو', 'كاتب الضبط'] },
]

// أنماط التاريخ الهجري
const HIJRI_DATE_PATTERN = /\d{1,2}[\s/\-\.]\d{1,2}[\s/\-\.](14|15)\d{2}/
const GREGORIAN_DATE_PATTERN = /\d{1,2}[\s/\-\.]\d{1,2}[\s/\-\.](19|20)\d{2}/

// أنماط أرقام القضايا
const CASE_NUMBER_PATTERN = /\d{3,}/

// المواد النظامية الشائعة
const COMMON_LEGAL_REFS = [
  'نظام المرافعات الشرعية',
  'نظام الإجراءات الجزائية',
  'نظام العمل',
  'نظام المعاملات المدنية',
  'نظام التنفيذ',
  'نظام المحاكم التجارية',
  'نظام الأحوال الشخصية',
  'نظام الإثبات',
]

// الأخطاء الشائعة في المصطلحات القانونية
const TERMINOLOGY_ERRORS: Array<{ wrong: string; correct: string; note: string }> = [
  { wrong: 'المحامى', correct: 'المحامي', note: 'خطأ إملائي في كلمة المحامي' },
  { wrong: 'القاضى', correct: 'القاضي', note: 'خطأ إملائي في كلمة القاضي' },
  { wrong: 'المدعى', correct: 'المدعي', note: 'المدعى تُستخدم فقط في المدعى عليه' },
  { wrong: 'الدعوة القضائية', correct: 'الدعوى القضائية', note: 'الدعوى وليس الدعوة في السياق القضائي' },
  { wrong: 'حكم نهائى', correct: 'حكم نهائي', note: 'خطأ إملائي في كلمة نهائي' },
  { wrong: 'الشهادة الشهود', correct: 'شهادة الشهود', note: 'خطأ نحوي في التعريف' },
  { wrong: 'مبلغ وقدرة', correct: 'مبلغ وقدره', note: 'خطأ في ضمير الإشارة' },
  { wrong: 'اتعاب', correct: 'أتعاب', note: 'خطأ في همزة القطع' },
  { wrong: 'اثبات', correct: 'إثبات', note: 'خطأ في همزة القطع' },
  { wrong: 'استأناف', correct: 'استئناف', note: 'خطأ إملائي في كلمة استئناف' },
  { wrong: 'اختصامات', correct: 'خصومات', note: 'مصطلح غير دقيق' },
  { wrong: 'تعويظ', correct: 'تعويض', note: 'خطأ إملائي' },
  { wrong: 'الزام', correct: 'إلزام', note: 'خطأ في همزة القطع' },
  { wrong: 'امتناع', correct: 'إمتناع', note: 'خطأ في همزة القطع' },
]

// عبارات يجب تجنبها في الصكوك الرسمية
const INFORMAL_PHRASES = [
  'أعتقد أن',
  'ربما',
  'يمكن أن',
  'في رأيي',
  'حسب ما أظن',
  'على ما يبدو',
  'بصراحة',
  'الحقيقة أن',
  'المهم أن',
]

let errorCounter = 0
function generateErrorId(): string {
  return `err_${++errorCounter}`
}

function checkRequiredSections(text: string): { errors: ValidationError[]; sections: SectionAnalysis[] } {
  const errors: ValidationError[] = []
  const sections: SectionAnalysis[] = []

  for (const section of REQUIRED_SECTIONS) {
    const found = section.keywords.some(kw => text.includes(kw))
    sections.push({
      name: section.name,
      found,
      status: found ? 'valid' : 'missing',
      notes: found ? 'موجود' : `القسم مفقود: ${section.name}`,
    })

    if (!found) {
      errors.push({
        id: generateErrorId(),
        category: 'أقسام مفقودة',
        message: `لم يتم العثور على قسم "${section.name}" في الصك`,
        severity: section.name === 'المنطوق / الحكم' || section.name === 'بيانات الأطراف' ? 'critical' : 'major',
        suggestion: `يجب إضافة ${section.name} باستخدام إحدى العبارات: ${section.keywords.join('، ')}`,
      })
    }
  }

  return { errors, sections }
}

function checkDates(text: string): ValidationError[] {
  const errors: ValidationError[] = []
  const hasHijri = HIJRI_DATE_PATTERN.test(text)
  const hasGregorian = GREGORIAN_DATE_PATTERN.test(text)

  if (!hasHijri && !hasGregorian) {
    errors.push({
      id: generateErrorId(),
      category: 'التاريخ',
      message: 'لم يتم العثور على تاريخ واضح في الصك',
      severity: 'critical',
      suggestion: 'يجب تضمين التاريخ الهجري بصيغة يوم/شهر/سنة هجرية (مثال: 15/06/1445)',
    })
  } else if (!hasHijri && hasGregorian) {
    errors.push({
      id: generateErrorId(),
      category: 'التاريخ',
      message: 'الصك يحتوي على تاريخ ميلادي فقط بدون تاريخ هجري',
      severity: 'major',
      suggestion: 'يجب أن يتضمن الصك القضائي التاريخ الهجري كتاريخ رسمي',
    })
  }

  return errors
}

function checkCaseNumber(text: string): ValidationError[] {
  const errors: ValidationError[] = []
  const hasCaseRef = /رقم (القضية|الدعوى)/.test(text) || /(قضية|دعوى) رقم/.test(text)

  if (!hasCaseRef) {
    errors.push({
      id: generateErrorId(),
      category: 'رقم القضية',
      message: 'لم يتم العثور على رقم قضية واضح',
      severity: 'critical',
      suggestion: 'يجب ذكر رقم القضية بوضوح (مثال: قضية رقم 1234/1445)',
    })
  } else if (!CASE_NUMBER_PATTERN.test(text)) {
    errors.push({
      id: generateErrorId(),
      category: 'رقم القضية',
      message: 'رقم القضية غير واضح أو غير مكتمل',
      severity: 'major',
      suggestion: 'تأكد من كتابة رقم القضية كاملاً مع السنة',
    })
  }

  return errors
}

function checkTerminology(text: string): ValidationError[] {
  const errors: ValidationError[] = []

  for (const term of TERMINOLOGY_ERRORS) {
    if (text.includes(term.wrong)) {
      // تأكد من أن الكلمة ليست جزءاً من كلمة أخرى صحيحة
      const isPartOfCorrect = term.wrong === 'المدعى' && text.includes('المدعى عليه')
      if (!isPartOfCorrect) {
        errors.push({
          id: generateErrorId(),
          category: 'أخطاء مصطلحات',
          message: `خطأ في المصطلح: "${term.wrong}" - ${term.note}`,
          severity: 'minor',
          suggestion: `الصواب: "${term.correct}"`,
          location: term.wrong,
        })
      }
    }
  }

  return errors
}

function checkInformalLanguage(text: string): ValidationError[] {
  const errors: ValidationError[] = []

  for (const phrase of INFORMAL_PHRASES) {
    if (text.includes(phrase)) {
      errors.push({
        id: generateErrorId(),
        category: 'لغة غير رسمية',
        message: `عبارة غير مناسبة في الصك الرسمي: "${phrase}"`,
        severity: 'warning',
        suggestion: 'يجب استخدام لغة قانونية رسمية في الصكوك القضائية',
        location: phrase,
      })
    }
  }

  return errors
}

function checkLegalReferences(text: string): ValidationError[] {
  const errors: ValidationError[] = []
  const hasMadde = /الماد[ةه]/.test(text) || /مادة/.test(text)
  const hasNizam = COMMON_LEGAL_REFS.some(ref => text.includes(ref)) || /نظام/.test(text)

  if (!hasMadde && !hasNizam) {
    errors.push({
      id: generateErrorId(),
      category: 'المراجع النظامية',
      message: 'لم يتم الإشارة إلى أي مادة نظامية في الصك',
      severity: 'major',
      suggestion: 'يُستحسن الإشارة إلى المواد النظامية ذات الصلة لتعزيز التسبيب القانوني',
    })
  }

  // التحقق من وجود رقم مادة بعد كلمة "المادة"
  const maddaMatches = text.match(/الماد[ةه]\s+(?!\d)/g)
  if (maddaMatches && maddaMatches.length > 0) {
    errors.push({
      id: generateErrorId(),
      category: 'المراجع النظامية',
      message: 'يوجد إشارة إلى "المادة" بدون ذكر رقمها',
      severity: 'minor',
      suggestion: 'يجب ذكر رقم المادة بعد كلمة المادة (مثال: المادة 77 من نظام العمل)',
    })
  }

  return errors
}

function checkDocumentLength(text: string): ValidationError[] {
  const errors: ValidationError[] = []
  const wordCount = text.trim().split(/\s+/).length

  if (wordCount < 50) {
    errors.push({
      id: generateErrorId(),
      category: 'طول المستند',
      message: `الصك قصير جداً (${wordCount} كلمة). الصكوك القضائية عادةً أطول من ذلك`,
      severity: 'warning',
      suggestion: 'تأكد من أن الصك يحتوي على جميع الأقسام المطلوبة بشكل كافٍ',
    })
  }

  return errors
}

function checkPartiesInfo(text: string): ValidationError[] {
  const errors: ValidationError[] = []

  const hasParties = /المدعي|المدعى عليه|الطرف الأول|الطرف الثاني|المتهم/.test(text)
  if (hasParties) {
    // التحقق من وجود رقم هوية أو سجل
    const hasId = /هوية|سجل|رقم.*وطني|هوي[ةه].*وطني[ةه]|رقم الهوية/.test(text)
    if (!hasId) {
      errors.push({
        id: generateErrorId(),
        category: 'بيانات الأطراف',
        message: 'لم يتم ذكر أرقام هوية الأطراف',
        severity: 'major',
        suggestion: 'يجب تضمين رقم الهوية الوطنية أو رقم السجل التجاري لكل طرف',
      })
    }

    // التحقق من وجود الوكيل أو المحامي
    const hasRepresentative = /وكيل|محام|ممثل/.test(text)
    if (!hasRepresentative) {
      errors.push({
        id: generateErrorId(),
        category: 'بيانات الأطراف',
        message: 'لم يُذكر وكيل أو محامٍ لأي من الأطراف',
        severity: 'warning',
        suggestion: 'يُفضّل ذكر بيانات الوكلاء أو المحامين إن وُجدوا',
      })
    }
  }

  return errors
}

function checkRulingClarity(text: string): ValidationError[] {
  const errors: ValidationError[] = []

  const rulingKeywords = ['حكمت', 'قررت', 'المنطوق']
  const hasRuling = rulingKeywords.some(kw => text.includes(kw))

  if (hasRuling) {
    // التحقق من وضوح المنطوق
    const rulingIndex = Math.max(
      ...rulingKeywords.map(kw => text.indexOf(kw)).filter(i => i >= 0)
    )
    const rulingText = text.substring(rulingIndex)

    // التحقق من وجود أرقام مالية إن كان الحكم مالياً
    const isFinancial = /مبلغ|ريال|تعويض|غرامة|أجر/.test(rulingText)
    if (isFinancial && !/\d/.test(rulingText)) {
      errors.push({
        id: generateErrorId(),
        category: 'وضوح المنطوق',
        message: 'المنطوق يتضمن حكماً مالياً بدون تحديد رقمي للمبلغ',
        severity: 'critical',
        suggestion: 'يجب تحديد المبالغ المالية بالأرقام والحروف في المنطوق',
      })
    }

    // التحقق من ذكر قابلية الاستئناف
    const hasAppealInfo = /استئناف|نهائي|قطعي|قابل للطعن|غير قابل/.test(text)
    if (!hasAppealInfo) {
      errors.push({
        id: generateErrorId(),
        category: 'قابلية الطعن',
        message: 'لم يُذكر ما إذا كان الحكم قابلاً للاستئناف أم نهائياً',
        severity: 'major',
        suggestion: 'يجب الإشارة إلى قابلية الحكم للاستئناف أو كونه نهائياً',
      })
    }
  }

  return errors
}

function calculateScore(errors: ValidationError[]): number {
  let score = 100
  for (const error of errors) {
    switch (error.severity) {
      case 'critical': score -= 15; break
      case 'major': score -= 8; break
      case 'minor': score -= 3; break
      case 'warning': score -= 1; break
    }
  }
  return Math.max(0, Math.min(100, score))
}

function generateSummary(errors: ValidationError[], score: number): string {
  const critical = errors.filter(e => e.severity === 'critical').length
  const major = errors.filter(e => e.severity === 'major').length
  const minor = errors.filter(e => e.severity === 'minor').length
  const warnings = errors.filter(e => e.severity === 'warning').length

  if (score >= 90) return `الصك القضائي بحالة ممتازة. تم اكتشاف ${errors.length} ملاحظة بسيطة فقط.`
  if (score >= 70) return `الصك القضائي بحالة جيدة مع بعض الملاحظات: ${critical} حرجة، ${major} رئيسية، ${minor} ثانوية، ${warnings} تنبيهات.`
  if (score >= 50) return `الصك القضائي يحتاج إلى مراجعة. تم اكتشاف ${critical} أخطاء حرجة و ${major} أخطاء رئيسية.`
  return `الصك القضائي يحتاج إلى إعادة صياغة شاملة. تم اكتشاف ${errors.length} خطأ منها ${critical} حرجة.`
}

export function validateDocument(text: string): ValidationResult {
  errorCounter = 0
  const allErrors: ValidationError[] = []

  // 1. فحص الأقسام المطلوبة
  const { errors: sectionErrors, sections } = checkRequiredSections(text)
  allErrors.push(...sectionErrors)

  // 2. فحص التاريخ
  allErrors.push(...checkDates(text))

  // 3. فحص رقم القضية
  allErrors.push(...checkCaseNumber(text))

  // 4. فحص المصطلحات
  allErrors.push(...checkTerminology(text))

  // 5. فحص اللغة غير الرسمية
  allErrors.push(...checkInformalLanguage(text))

  // 6. فحص المراجع النظامية
  allErrors.push(...checkLegalReferences(text))

  // 7. فحص طول المستند
  allErrors.push(...checkDocumentLength(text))

  // 8. فحص بيانات الأطراف
  allErrors.push(...checkPartiesInfo(text))

  // 9. فحص وضوح المنطوق
  allErrors.push(...checkRulingClarity(text))

  const score = calculateScore(allErrors)
  const summary = generateSummary(allErrors, score)

  return {
    documentText: text,
    errors: allErrors,
    score,
    summary,
    sections,
  }
}

// نص نموذجي لصك قضائي به أخطاء (للتجربة)
export const SAMPLE_DOCUMENT_WITH_ERRORS = `بسم الله الرحمن الرحيم

المحكمة التجارية بمنطقة الرياض
الدائرة الثالثة

في الدعوة القضائية رقم 4523 لعام 1445هـ

المدعي: شركة الأمل للتجارة
المدعى عليه: مؤسسة النور التجارية

الوقائع:
تتلخص وقائع هذه الدعوى في أن المدعى تقدم بدعوى ضد المدعى عليه يطالب فيها بمبلغ وقدرة مائتان ألف ريال سعودي، وذلك نتيجة إخلال المدعى عليه بالعقد المبرم بين الطرفين.

أعتقد أن المدعى عليه أخل بالتزاماته التعاقدية.

وحيث أن الدائرة اطلعت على المستندات المقدمة من الطرفين، وبناءً على المادة من نظام المحاكم التجارية.

حكمت الدائرة بإلزام المدعى عليه بدفع مبلغ التعويض للمدعي، مع تحمل المدعى عليه اتعاب المحاماة.

القاضي: عبدالله محمد الأحمد`

// نص نموذجي لصك قضائي صحيح (للتجربة)
export const SAMPLE_DOCUMENT_CORRECT = `بسم الله الرحمن الرحيم

المملكة العربية السعودية
وزارة العدل
المحكمة التجارية بمنطقة الرياض
الدائرة التجارية الثالثة

الحكم في القضية رقم 4523/1445
تاريخ الجلسة: 15/06/1445هـ الموافق 28/12/2023م

المدعي: شركة الأمل للتجارة - سجل تجاري رقم 1010234567
وكيلها: المحامي أحمد بن خالد السعيد - رخصة محاماة رقم 1234

المدعى عليه: مؤسسة النور التجارية - سجل تجاري رقم 1010765432
وكيله: المحامي سعد بن فهد العتيبي - رخصة محاماة رقم 5678

الوقائع:
تتلخص وقائع هذه الدعوى في أن المدعي تقدم بدعوى ضد المدعى عليه يطالب فيها بمبلغ وقدره (200,000) مائتا ألف ريال سعودي، وذلك نتيجة إخلال المدعى عليه بالعقد المبرم بين الطرفين بتاريخ 01/02/1445هـ.

الأسباب:
حيث أن الدائرة اطلعت على المستندات المقدمة من الطرفين، وبعد دراسة العقد المبرم وبنوده، وبناءً على المادة 77 من نظام المحاكم التجارية، والمادة 15 من نظام الإثبات، تبين للدائرة ثبوت إخلال المدعى عليه بالتزاماته التعاقدية.

المنطوق:
فلهذه الأسباب حكمت الدائرة بما يلي:
أولاً: إلزام المدعى عليه بدفع مبلغ وقدره (200,000) مائتا ألف ريال سعودي للمدعي.
ثانياً: تحمل المدعى عليه أتعاب المحاماة البالغة (10,000) عشرة آلاف ريال.
ثالثاً: هذا الحكم قابل للاستئناف خلال ثلاثين يوماً من تاريخ إبلاغه.

رئيس الدائرة: القاضي عبدالله بن محمد الأحمد
العضو: القاضي فهد بن سعيد القحطاني
كاتب الضبط: محمد بن علي السالم`
