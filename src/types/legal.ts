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
  compensationAmount?: string
  imprisonmentDays?: number
  dailyRate?: number
  accusationType?: string
}

export type CourtType =
  | 'إدارية'
  | 'جزائية'
  | 'استئناف إدارية'
  | 'المحكمة الإدارية العليا'
  | 'عامة'
  | 'تجارية'
  | 'عمالية'
  | 'أحوال شخصية'

export type CaseCategory =
  | 'تعويض عن سجن'
  | 'تعويض عن توقيف'
  | 'تعويض عن خطأ قضائي'
  | 'تعويض عن اتهام كيدي'
  | 'تعويض عن ضرر'
  | 'إلغاء قرار إداري'
  | 'تعويضات'
  | 'جنائي'
  | 'إداري'
  | 'عقود'
  | 'شركات'
  | 'أوراق تجارية'
  | 'إفلاس'
  | 'منازعات عمالية'
  | 'فصل تعسفي'
  | 'أجور'
  | 'أحوال شخصية'
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
