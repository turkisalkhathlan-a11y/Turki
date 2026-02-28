import { JudicialDecision, SearchFilters, SearchResult, CourtType, CaseCategory, AppealStatus } from '@/types/legal'
import { judicialDecisions } from '@/data/judicialDecisions'

// Arabic text normalization - handles different forms of Arabic letters
function normalizeArabic(text: string): string {
  return text
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\u0640/g, '') // tatweel
    .replace(/[\u064B-\u065F]/g, '') // diacritics (tashkeel)
    .trim()
}

// Synonym map for semantic matching
const synonymMap: Record<string, string[]> = {
  'فصل': ['فصل تعسفي', 'إنهاء خدمات', 'إنهاء عقد', 'طرد', 'إقالة'],
  'راتب': ['أجر', 'أجور', 'رواتب', 'مستحقات مالية', 'راتب متأخر'],
  'شركة': ['شركات', 'مؤسسة', 'منشأة', 'كيان تجاري'],
  'عقد': ['عقود', 'اتفاقية', 'اتفاق', 'عقد عمل', 'عقد تجاري'],
  'تعويض': ['تعويضات', 'جبر ضرر', 'غرامة', 'تعويض مالي'],
  'ميراث': ['تركة', 'ورثة', 'إرث', 'تقسيم تركة', 'أنصبة'],
  'طلاق': ['حضانة', 'نفقة', 'أحوال شخصية', 'زواج', 'فسخ نكاح'],
  'احتيال': ['نصب', 'غش', 'تدليس', 'خداع', 'احتيال مالي'],
  'عقار': ['عقارات', 'أرض', 'ملكية عقارية', 'صك', 'بيع عقار'],
  'تأمين': ['وثيقة تأمين', 'بوليصة', 'شركة تأمين', 'مطالبة تأمين'],
  'بنك': ['مصرف', 'قرض', 'تمويل', 'بنكي', 'مصرفي'],
  'عمل': ['عامل', 'موظف', 'عمالي', 'حقوق العامل', 'نظام العمل'],
  'تزوير': ['مزور', 'تزييف', 'مستندات مزورة', 'محرر مزور'],
  'إفلاس': ['تصفية', 'إعسار', 'توقف عن الدفع', 'مفلس'],
  'علامة تجارية': ['ملكية فكرية', 'تقليد', 'علامة مقلدة', 'براءة اختراع'],
  'حادث': ['حادث مروري', 'إصابة', 'أضرار', 'مرور'],
  'إداري': ['قرار إداري', 'ديوان المظالم', 'جهة حكومية', 'ترخيص'],
}

// Expand query with synonyms
function expandQuery(query: string): string[] {
  const normalized = normalizeArabic(query)
  const words = normalized.split(/\s+/)
  const expanded = new Set<string>(words)

  for (const word of words) {
    for (const [key, synonyms] of Object.entries(synonymMap)) {
      const normalizedKey = normalizeArabic(key)
      if (normalizedKey.includes(word) || word.includes(normalizedKey)) {
        synonyms.forEach(s => expanded.add(normalizeArabic(s)))
        expanded.add(normalizedKey)
      }
      for (const synonym of synonyms) {
        const normalizedSynonym = normalizeArabic(synonym)
        if (normalizedSynonym.includes(word) || word.includes(normalizedSynonym)) {
          expanded.add(normalizedKey)
          synonyms.forEach(s => expanded.add(normalizeArabic(s)))
        }
      }
    }
  }

  return Array.from(expanded)
}

// Calculate relevance score for a decision against a query
function calculateRelevance(decision: JudicialDecision, queryTerms: string[]): { score: number; matchedKeywords: string[] } {
  let score = 0
  const matchedKeywords: string[] = []

  const normalizedSubject = normalizeArabic(decision.subject)
  const normalizedSummary = normalizeArabic(decision.summary)
  const normalizedFullText = normalizeArabic(decision.fullText)
  const normalizedRuling = normalizeArabic(decision.ruling)
  const normalizedKeywords = decision.keywords.map(k => normalizeArabic(k))

  for (const term of queryTerms) {
    // Subject match (highest weight)
    if (normalizedSubject.includes(term)) {
      score += 10
      if (!matchedKeywords.includes(term)) matchedKeywords.push(term)
    }

    // Keywords match (high weight)
    for (const keyword of normalizedKeywords) {
      if (keyword.includes(term) || term.includes(keyword)) {
        score += 8
        if (!matchedKeywords.includes(decision.keywords[normalizedKeywords.indexOf(keyword)])) {
          matchedKeywords.push(decision.keywords[normalizedKeywords.indexOf(keyword)])
        }
      }
    }

    // Ruling match (medium-high weight)
    if (normalizedRuling.includes(term)) {
      score += 6
      if (!matchedKeywords.includes(term)) matchedKeywords.push(term)
    }

    // Summary match (medium weight)
    if (normalizedSummary.includes(term)) {
      score += 4
      if (!matchedKeywords.includes(term)) matchedKeywords.push(term)
    }

    // Full text match (lower weight)
    if (normalizedFullText.includes(term)) {
      score += 2
    }

    // Category match
    if (normalizeArabic(decision.category).includes(term)) {
      score += 5
    }

    // Legal articles match
    for (const article of decision.legalArticles) {
      if (normalizeArabic(article).includes(term)) {
        score += 3
      }
    }
  }

  return { score, matchedKeywords }
}

// Highlight matching terms in text
function highlightText(text: string, queryTerms: string[]): string {
  let highlighted = text
  for (const term of queryTerms) {
    if (term.length < 2) continue
    const regex = new RegExp(`(${term})`, 'gi')
    highlighted = highlighted.replace(regex, '**$1**')
  }
  return highlighted
}

// Main search function
export function searchDecisions(filters: SearchFilters): SearchResult[] {
  let results: SearchResult[] = []

  const queryTerms = filters.query.trim()
    ? expandQuery(filters.query)
    : []

  for (const decision of judicialDecisions) {
    // Apply filters
    if (filters.courtType !== 'الكل' && decision.courtType !== filters.courtType) {
      continue
    }
    if (filters.category !== 'الكل' && decision.category !== filters.category) {
      continue
    }
    if (filters.appealStatus !== 'الكل' && decision.appealStatus !== filters.appealStatus) {
      continue
    }
    if (filters.dateFrom && decision.date < filters.dateFrom) {
      continue
    }
    if (filters.dateTo && decision.date > filters.dateTo) {
      continue
    }

    // Calculate relevance
    let relevanceScore = 0
    let matchedKeywords: string[] = []
    let highlightedSummary = decision.summary

    if (queryTerms.length > 0) {
      const result = calculateRelevance(decision, queryTerms)
      relevanceScore = result.score
      matchedKeywords = result.matchedKeywords

      // Only include if there's some relevance
      if (relevanceScore === 0) continue

      highlightedSummary = highlightText(decision.summary, queryTerms)
    } else {
      // No query - return all matching filters, sorted by date
      relevanceScore = 1
    }

    results.push({
      decision,
      relevanceScore,
      matchedKeywords,
      highlightedSummary,
    })
  }

  // Sort results
  if (filters.sortBy === 'relevance') {
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  } else if (filters.sortBy === 'date_desc') {
    results.sort((a, b) => b.decision.date.localeCompare(a.decision.date))
  } else if (filters.sortBy === 'date_asc') {
    results.sort((a, b) => a.decision.date.localeCompare(b.decision.date))
  }

  return results
}

// Get available filter options
export const courtTypes: (CourtType | 'الكل')[] = [
  'الكل', 'تجارية', 'عمالية', 'جزائية', 'أحوال شخصية', 'عامة', 'إدارية'
]

export const caseCategories: (CaseCategory | 'الكل')[] = [
  'الكل', 'عقود', 'شركات', 'أوراق تجارية', 'إفلاس',
  'منازعات عمالية', 'فصل تعسفي', 'أجور', 'تعويضات',
  'أحوال شخصية', 'جنائي', 'إداري', 'عقارات',
  'ملكية فكرية', 'تأمين', 'مصرفية'
]

export const appealStatuses: (AppealStatus | 'الكل')[] = [
  'الكل', 'نهائي', 'قابل للاستئناف', 'مستأنف', 'مؤيد استئنافياً'
]

// Get search suggestions based on partial input
export function getSearchSuggestions(query: string): string[] {
  if (!query || query.length < 2) return []

  const normalized = normalizeArabic(query)
  const suggestions = new Set<string>()

  // Suggest from keywords
  for (const decision of judicialDecisions) {
    for (const keyword of decision.keywords) {
      if (normalizeArabic(keyword).includes(normalized)) {
        suggestions.add(keyword)
      }
    }
    // Suggest from subjects
    if (normalizeArabic(decision.subject).includes(normalized)) {
      suggestions.add(decision.subject)
    }
  }

  // Suggest from synonyms
  for (const [key, synonyms] of Object.entries(synonymMap)) {
    if (normalizeArabic(key).includes(normalized)) {
      suggestions.add(key)
    }
    for (const synonym of synonyms) {
      if (normalizeArabic(synonym).includes(normalized)) {
        suggestions.add(synonym)
      }
    }
  }

  return Array.from(suggestions).slice(0, 8)
}

// Get statistics
export function getStatistics() {
  const total = judicialDecisions.length
  const byCourt: Record<string, number> = {}
  const byCategory: Record<string, number> = {}

  for (const d of judicialDecisions) {
    byCourt[d.courtType] = (byCourt[d.courtType] || 0) + 1
    byCategory[d.category] = (byCategory[d.category] || 0) + 1
  }

  return { total, byCourt, byCategory }
}
