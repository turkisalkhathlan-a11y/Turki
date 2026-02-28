export interface JudicialDecision {
  id: string
  caseNumber: string
  courtType: CourtType
  subject: string
  summary: string
  fullText: string
  date: string
  hijriDate: string
  judge: string
  keywords: string[]
  category: CaseCategory
  ruling: string
  legalArticles: string[]
  appealStatus: AppealStatus
  source: string
}

export type CourtType =
  | 'تجارية'
  | 'عمالية'
  | 'جزائية'
  | 'أحوال شخصية'
  | 'عامة'
  | 'إدارية'

export type CaseCategory =
  | 'عقود'
  | 'شركات'
  | 'أوراق تجارية'
  | 'إفلاس'
  | 'منازعات عمالية'
  | 'فصل تعسفي'
  | 'أجور'
  | 'تعويضات'
  | 'أحوال شخصية'
  | 'جنائي'
  | 'إداري'
  | 'عقارات'
  | 'ملكية فكرية'
  | 'تأمين'
  | 'مصرفية'

export type AppealStatus =
  | 'نهائي'
  | 'قابل للاستئناف'
  | 'مستأنف'
  | 'مؤيد استئنافياً'

export interface SearchFilters {
  query: string
  courtType: CourtType | 'الكل'
  category: CaseCategory | 'الكل'
  dateFrom: string
  dateTo: string
  appealStatus: AppealStatus | 'الكل'
  sortBy: 'relevance' | 'date_desc' | 'date_asc'
}

export interface SearchResult {
  decision: JudicialDecision
  relevanceScore: number
  matchedKeywords: string[]
  highlightedSummary: string
}
