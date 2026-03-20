export interface EvaluationCriterion {
  id: string
  name: string
  description: string
  weight: number
  maxScore: number
}

export interface CriterionResult {
  criterionId: string
  criterionName: string
  score: number
  maxScore: number
  percentage: number
  issues: string[]
  strengths: string[]
}

export interface EvaluationResult {
  overallScore: number
  overallPercentage: number
  grade: string
  gradeColor: string
  criteria: CriterionResult[]
  totalIssues: number
  criticalIssues: string[]
  recommendations: string[]
  summary: string
}

export const EVALUATION_CRITERIA: EvaluationCriterion[] = [
  {
    id: 'reasoning_quality',
    name: 'جودة التسبيب',
    description: 'مدى وضوح وقوة الحيثيات والأسباب التي بُني عليها الحكم',
    weight: 20,
    maxScore: 20,
  },
  {
    id: 'legal_foundation',
    name: 'الاستناد النظامي',
    description: 'الإشارة الصحيحة للمواد النظامية والأحكام الشرعية ذات العلاقة',
    weight: 15,
    maxScore: 15,
  },
  {
    id: 'logical_consistency',
    name: 'المنطق القانوني والاتساق',
    description: 'عدم وجود تناقض بين أجزاء الحكم وسلامة الاستنتاج',
    weight: 15,
    maxScore: 15,
  },
  {
    id: 'formal_procedures',
    name: 'الأركان الشكلية',
    description: 'استيفاء البيانات الإلزامية: البسملة، المحكمة، الأطراف، التاريخ، رقم القضية',
    weight: 10,
    maxScore: 10,
  },
  {
    id: 'party_rights',
    name: 'ضمان حقوق الأطراف',
    description: 'التحقق من سماع الأطراف وتمكينهم من الدفاع وذكر طلباتهم ودفوعهم',
    weight: 15,
    maxScore: 15,
  },
  {
    id: 'clarity_precision',
    name: 'الوضوح والدقة',
    description: 'وضوح المنطوق والمصطلحات القانونية ودقة تحديد الحقوق والالتزامات',
    weight: 10,
    maxScore: 10,
  },
  {
    id: 'completeness',
    name: 'الاكتمال والشمولية',
    description: 'معالجة جميع الطلبات والدفوع المقدمة والرد عليها',
    weight: 10,
    maxScore: 10,
  },
  {
    id: 'proportionality',
    name: 'التناسب',
    description: 'تناسب العقوبة أو التعويض مع حجم الضرر أو المخالفة',
    weight: 5,
    maxScore: 5,
  },
]

const REASONING_KEYWORDS = [
  'حيث إن', 'حيث أن', 'لما كان', 'ولما كان', 'بناءً على', 'بناء على',
  'استناداً', 'تأسيساً على', 'وحيث', 'ثبت للدائرة', 'ثبت للمحكمة',
  'يتضح', 'يتبين', 'الأمر الذي', 'مما يعني', 'مما يدل', 'مما يترتب',
  'على اعتبار', 'بالنظر إلى', 'لذلك', 'وعليه', 'ترتب على ذلك',
]

const LEGAL_REFERENCES = [
  'نظام', 'المادة', 'الفقرة', 'البند', 'المرسوم', 'القرار الوزاري',
  'اللائحة', 'نظام المرافعات', 'نظام العمل', 'نظام الشركات',
  'نظام المحكمة التجارية', 'نظام الإجراءات الجزائية',
  'نظام الأحوال الشخصية', 'مبدأ قضائي', 'قرار مجلس القضاء',
]

const FORMAL_ELEMENTS = [
  { pattern: /بسم الله الرحمن الرحيم/, name: 'البسملة' },
  { pattern: /المحكمة|الدائرة/, name: 'اسم المحكمة/الدائرة' },
  { pattern: /رقم القضية|قضية رقم|الدعوى رقم/, name: 'رقم القضية' },
  { pattern: /\d{4}\/\d|١٤\d{2}/, name: 'التاريخ' },
  { pattern: /المدعي|المدعى عليه|الطرف الأول|الطرف الثاني|المتهم/, name: 'بيانات الأطراف' },
  { pattern: /حكمت|قررت|أمرت/, name: 'المنطوق' },
]

const PARTY_RIGHTS_KEYWORDS = [
  'طلبات المدعي', 'طلبات المدعى عليه', 'دفوع', 'حضر', 'أجاب',
  'قدم', 'أفاد', 'ادعى', 'رد المدعى عليه', 'دفع بـ', 'سُمع',
  'تمكين', 'حق الدفاع', 'مذكرة', 'جلسة', 'التمس',
]

const APPEAL_KEYWORDS = [
  'قابل للاستئناف', 'نهائي', 'غير قابل', 'يحق', 'الطعن',
  'مدة الاستئناف', 'ثلاثين يوماً', 'خلال',
]

export function evaluateRulingLocally(text: string): EvaluationResult {
  const criteria: CriterionResult[] = []
  const normalizedText = text.trim()

  // 1. Reasoning Quality
  const reasoningMatches = REASONING_KEYWORDS.filter(k => normalizedText.includes(k))
  const reasoningScore = Math.min(20, Math.round((reasoningMatches.length / 8) * 20))
  const reasoningIssues: string[] = []
  const reasoningStrengths: string[] = []
  if (reasoningMatches.length < 3) reasoningIssues.push('ضعف في التسبيب - لا توجد حيثيات كافية تربط الوقائع بالحكم')
  if (reasoningMatches.length < 5) reasoningIssues.push('يُوصى بتعزيز الربط بين الوقائع والأسباب والمنطوق')
  if (reasoningMatches.length >= 5) reasoningStrengths.push('تسبيب جيد مع ربط واضح بين الوقائع والحكم')
  if (reasoningMatches.length >= 8) reasoningStrengths.push('تسبيب ممتاز وشامل')
  criteria.push({
    criterionId: 'reasoning_quality',
    criterionName: 'جودة التسبيب',
    score: reasoningScore,
    maxScore: 20,
    percentage: Math.round((reasoningScore / 20) * 100),
    issues: reasoningIssues,
    strengths: reasoningStrengths,
  })

  // 2. Legal Foundation
  const legalMatches = LEGAL_REFERENCES.filter(k => normalizedText.includes(k))
  const legalScore = Math.min(15, Math.round((legalMatches.length / 5) * 15))
  const legalIssues: string[] = []
  const legalStrengths: string[] = []
  if (legalMatches.length < 2) legalIssues.push('غياب الاستناد النظامي - لا توجد إشارة للمواد والأنظمة ذات العلاقة')
  if (legalMatches.length >= 3) legalStrengths.push('استناد نظامي جيد مع الإشارة للمواد ذات العلاقة')
  criteria.push({
    criterionId: 'legal_foundation',
    criterionName: 'الاستناد النظامي',
    score: legalScore,
    maxScore: 15,
    percentage: Math.round((legalScore / 15) * 100),
    issues: legalIssues,
    strengths: legalStrengths,
  })

  // 3. Logical Consistency
  let logicScore = 12
  const logicIssues: string[] = []
  const logicStrengths: string[] = []
  const hasContradiction = /ولكن.*غير أن|رغم.*إلا أن.*ومع ذلك/.test(normalizedText)
  if (hasContradiction) { logicScore -= 5; logicIssues.push('يوجد احتمال تناقض بين أجزاء الحكم') }
  if (reasoningMatches.length >= 3 && legalMatches.length >= 2) {
    logicStrengths.push('تسلسل منطقي مقبول بين الحيثيات والمنطوق')
  } else {
    logicScore -= 3
    logicIssues.push('ضعف في التسلسل المنطقي بين الحيثيات والمنطوق')
  }
  criteria.push({
    criterionId: 'logical_consistency',
    criterionName: 'المنطق القانوني والاتساق',
    score: Math.max(0, Math.min(15, logicScore)),
    maxScore: 15,
    percentage: Math.round((Math.max(0, Math.min(15, logicScore)) / 15) * 100),
    issues: logicIssues,
    strengths: logicStrengths,
  })

  // 4. Formal Procedures
  const formalFound = FORMAL_ELEMENTS.filter(el => el.pattern.test(normalizedText))
  const formalMissing = FORMAL_ELEMENTS.filter(el => !el.pattern.test(normalizedText))
  const formalScore = Math.round((formalFound.length / FORMAL_ELEMENTS.length) * 10)
  const formalIssues = formalMissing.map(el => `عنصر مفقود: ${el.name}`)
  const formalStrengths = formalFound.length >= 5 ? ['استيفاء معظم الأركان الشكلية'] : []
  criteria.push({
    criterionId: 'formal_procedures',
    criterionName: 'الأركان الشكلية',
    score: formalScore,
    maxScore: 10,
    percentage: Math.round((formalScore / 10) * 100),
    issues: formalIssues,
    strengths: formalStrengths,
  })

  // 5. Party Rights
  const partyMatches = PARTY_RIGHTS_KEYWORDS.filter(k => normalizedText.includes(k))
  const partyScore = Math.min(15, Math.round((partyMatches.length / 5) * 15))
  const partyIssues: string[] = []
  const partyStrengths: string[] = []
  if (partyMatches.length < 2) partyIssues.push('لم يُذكر سماع الأطراف أو طلباتهم ودفوعهم بشكل كافٍ')
  if (partyMatches.length >= 4) partyStrengths.push('ذكر جيد لطلبات ودفوع الأطراف')
  criteria.push({
    criterionId: 'party_rights',
    criterionName: 'ضمان حقوق الأطراف',
    score: partyScore,
    maxScore: 15,
    percentage: Math.round((partyScore / 15) * 100),
    issues: partyIssues,
    strengths: partyStrengths,
  })

  // 6. Clarity & Precision
  let clarityScore = 7
  const clarityIssues: string[] = []
  const clarityStrengths: string[] = []
  if (normalizedText.length < 200) { clarityScore -= 3; clarityIssues.push('الحكم قصير جداً وقد يفتقر للتفصيل الكافي') }
  const hasRuling = /حكمت|قررت|أمرت/.test(normalizedText)
  if (!hasRuling) { clarityScore -= 3; clarityIssues.push('لم يُحدد المنطوق بوضوح (حكمت/قررت)') }
  else clarityStrengths.push('المنطوق محدد بوضوح')
  const hasAppealInfo = APPEAL_KEYWORDS.some(k => normalizedText.includes(k))
  if (!hasAppealInfo) clarityIssues.push('لم يُذكر ما إذا كان الحكم قابلاً للاستئناف')
  else { clarityScore += 2; clarityStrengths.push('ذكر حالة الاستئناف') }
  criteria.push({
    criterionId: 'clarity_precision',
    criterionName: 'الوضوح والدقة',
    score: Math.max(0, Math.min(10, clarityScore)),
    maxScore: 10,
    percentage: Math.round((Math.max(0, Math.min(10, clarityScore)) / 10) * 100),
    issues: clarityIssues,
    strengths: clarityStrengths,
  })

  // 7. Completeness
  let completenessScore = 7
  const completenessIssues: string[] = []
  const completenessStrengths: string[] = []
  if (reasoningMatches.length >= 3 && partyMatches.length >= 2 && legalMatches.length >= 2) {
    completenessScore = 9
    completenessStrengths.push('الحكم يغطي الأبعاد الرئيسية من وقائع وأسباب ومنطوق')
  } else {
    completenessScore -= 2
    completenessIssues.push('قد لا يكون الحكم شاملاً لجميع الطلبات والدفوع')
  }
  criteria.push({
    criterionId: 'completeness',
    criterionName: 'الاكتمال والشمولية',
    score: Math.max(0, Math.min(10, completenessScore)),
    maxScore: 10,
    percentage: Math.round((Math.max(0, Math.min(10, completenessScore)) / 10) * 100),
    issues: completenessIssues,
    strengths: completenessStrengths,
  })

  // 8. Proportionality
  let proportionalityScore = 3
  const proportionalityIssues: string[] = []
  const proportionalityStrengths: string[] = []
  const hasMoney = /ريال|مبلغ|تعويض|غرامة/.test(normalizedText)
  const hasJustification = reasoningMatches.length >= 3
  if (hasMoney && hasJustification) {
    proportionalityScore = 4
    proportionalityStrengths.push('يوجد ربط بين المبلغ المحكوم والتسبيب')
  } else if (hasMoney && !hasJustification) {
    proportionalityScore = 2
    proportionalityIssues.push('المبلغ المحكوم به لم يُسبَّب بشكل كافٍ')
  }
  criteria.push({
    criterionId: 'proportionality',
    criterionName: 'التناسب',
    score: Math.max(0, Math.min(5, proportionalityScore)),
    maxScore: 5,
    percentage: Math.round((Math.max(0, Math.min(5, proportionalityScore)) / 5) * 100),
    issues: proportionalityIssues,
    strengths: proportionalityStrengths,
  })

  // Aggregate
  const overallScore = criteria.reduce((sum, c) => sum + c.score, 0)
  const overallMax = criteria.reduce((sum, c) => sum + c.maxScore, 0)
  const overallPercentage = Math.round((overallScore / overallMax) * 100)
  const allIssues = criteria.flatMap(c => c.issues)
  const criticalIssues = allIssues.filter(i =>
    i.includes('ضعف في التسبيب') || i.includes('غياب الاستناد') || i.includes('تناقض')
  )

  let grade: string
  let gradeColor: string
  if (overallPercentage >= 90) { grade = 'ممتاز'; gradeColor = 'text-emerald-600' }
  else if (overallPercentage >= 75) { grade = 'جيد جداً'; gradeColor = 'text-blue-600' }
  else if (overallPercentage >= 60) { grade = 'جيد'; gradeColor = 'text-sky-600' }
  else if (overallPercentage >= 45) { grade = 'مقبول'; gradeColor = 'text-amber-600' }
  else { grade = 'ضعيف'; gradeColor = 'text-red-600' }

  const recommendations: string[] = []
  if (reasoningScore < 12) recommendations.push('تعزيز التسبيب بربط الوقائع بالأسباب القانونية بشكل أوضح')
  if (legalScore < 8) recommendations.push('إضافة الإشارات النظامية والمواد القانونية ذات العلاقة')
  if (formalScore < 7) recommendations.push('استكمال الأركان الشكلية المفقودة')
  if (partyScore < 8) recommendations.push('التأكد من ذكر طلبات ودفوع جميع الأطراف')
  if (!hasAppealInfo) recommendations.push('إضافة بيان حالة الاستئناف')

  return {
    overallScore,
    overallPercentage,
    grade,
    gradeColor,
    criteria,
    totalIssues: allIssues.length,
    criticalIssues,
    recommendations,
    summary: `حصل الحكم على تقييم ${grade} بنسبة ${overallPercentage}% (${overallScore}/${overallMax}). تم اكتشاف ${allIssues.length} ملاحظة منها ${criticalIssues.length} ملاحظة جوهرية.`,
  }
}
