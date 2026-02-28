'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { SearchFilters, CourtType, CaseCategory, AppealStatus } from '@/types/legal'
import { searchDecisions, courtTypes, caseCategories, appealStatuses, getSearchSuggestions, getStatistics } from '@/lib/searchEngine'
import { judicialDecisions } from '@/data/judicialDecisions'
import SearchResultCard from '@/components/SearchResultCard'
import DecisionModal from '@/components/DecisionModal'

interface AIResult {
  understood_query?: string
  legal_context?: string
  ai_summary?: string
  legal_advice_note?: string
  matched_decision_ids?: string[]
  related_articles?: string[]
}

const defaultFilters: SearchFilters = {
  query: '',
  courtType: 'الكل',
  category: 'الكل',
  dateFrom: '',
  dateTo: '',
  appealStatus: 'الكل',
  sortBy: 'relevance',
}

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const stats = useMemo(() => getStatistics(), [])

  const results = useMemo(() => {
    if (!hasSearched) return []
    return searchDecisions(filters)
  }, [filters, hasSearched])

  const selectedDecision = useMemo(() => {
    if (!selectedDecisionId) return null
    return judicialDecisions.find(d => d.id === selectedDecisionId) || null
  }, [selectedDecisionId])

  const handleQueryChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, query: value }))
    if (value.length >= 2) {
      const newSuggestions = getSearchSuggestions(value)
      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [])

  const fetchAIResults = useCallback(async (query: string) => {
    if (!aiEnabled || !query.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (data.ai_enabled && data.result) {
        setAiResult(data.result)
      } else {
        setAiResult(null)
      }
    } catch {
      setAiResult(null)
    } finally {
      setAiLoading(false)
    }
  }, [aiEnabled])

  const handleSearch = useCallback(() => {
    setHasSearched(true)
    setShowSuggestions(false)
    fetchAIResults(filters.query)
  }, [filters.query, fetchAIResults])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setFilters(prev => ({ ...prev, query: suggestion }))
    setShowSuggestions(false)
    setHasSearched(true)
    fetchAIResults(suggestion)
  }, [fetchAIResults])

  const handleFilterChange = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = useCallback(() => {
    setFilters(defaultFilters)
    setHasSearched(false)
    setSuggestions([])
    setAiResult(null)
    searchInputRef.current?.focus()
  }, [])

  const handleViewDetails = useCallback((id: string) => {
    setSelectedDecisionId(id)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedDecisionId(null)
  }, [])

  const popularSearches = [
    'فصل تعسفي من العمل',
    'كمبيالة تجارية مستحقة',
    'تقليد علامة تجارية',
    'حضانة أطفال بعد الطلاق',
    'إفلاس تاجر',
    'تعويض حادث مروري',
    'احتيال مالي إلكتروني',
    'أجور متأخرة',
  ]

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-base">محرك البحث القانوني الذكي</h1>
              <p className="text-xs text-gray-500">مبني على بيانات البوابة القضائية العلمية - وزارة العدل السعودية</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                aiEnabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {aiEnabled ? 'AI مفعّل' : 'AI معطّل'}
            </button>
            <span className="hidden sm:inline bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full font-medium text-xs">
              {stats.total} حكم قضائي
            </span>
            <a
              href="https://sjp.moj.gov.sa"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 transition-colors text-xs font-medium bg-primary-50 px-3 py-1.5 rounded-full"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              المصدر الرسمي
            </a>
          </div>
        </div>
      </header>

      {/* Hero / Search */}
      <section className={`transition-all duration-500 ${hasSearched ? 'py-6' : 'py-16 md:py-24'}`}>
        <div className="max-w-4xl mx-auto px-4">
          {!hasSearched && (
            <div className="text-center mb-10 animate-fade-in">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-4">محرك البحث في الأحكام القضائية</h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                ابحث بالذكاء الاصطناعي في قاعدة بيانات الأحكام القضائية الصادرة من المحاكم السعودية
              </p>
              <p className="text-sm text-gray-400 mt-2">مصدر البيانات: البوابة القضائية العلمية (sjp.moj.gov.sa) والبوابة القانونية (laws.moj.gov.sa)</p>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative" ref={suggestionsRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={filters.query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                  placeholder="اكتب سؤالك القانوني... (مثال: ما حكم الفصل التعسفي؟)"
                  className="w-full px-5 py-4 pr-12 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-base shadow-sm"
                  dir="rtl"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button onClick={handleSearch} className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                بحث
              </button>
            </div>
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => handleSuggestionClick(s)} className="w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-700 border-b border-gray-50 last:border-0">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                تصفية متقدمة
              </button>
              {hasSearched && (
                <button onClick={handleReset} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  إعادة تعيين
                </button>
              )}
            </div>
            {hasSearched && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">ترتيب:</label>
                <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-primary-300">
                  <option value="relevance">الأكثر صلة</option>
                  <option value="date_desc">الأحدث أولاً</option>
                  <option value="date_asc">الأقدم أولاً</option>
                </select>
              </div>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">نوع المحكمة</label>
                  <select value={filters.courtType} onChange={(e) => handleFilterChange('courtType', e.target.value as CourtType | 'الكل')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 text-sm focus:outline-none focus:border-primary-300">
                    {courtTypes.map((t) => <option key={t} value={t}>{t === 'الكل' ? 'جميع المحاكم' : `المحكمة ال${t}`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">تصنيف القضية</label>
                  <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value as CaseCategory | 'الكل')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 text-sm focus:outline-none focus:border-primary-300">
                    {caseCategories.map((c) => <option key={c} value={c}>{c === 'الكل' ? 'جميع التصنيفات' : c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">حالة الاستئناف</label>
                  <select value={filters.appealStatus} onChange={(e) => handleFilterChange('appealStatus', e.target.value as AppealStatus | 'الكل')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 text-sm focus:outline-none focus:border-primary-300">
                    {appealStatuses.map((s) => <option key={s} value={s}>{s === 'الكل' ? 'جميع الحالات' : s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">من تاريخ</label>
                  <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 text-sm focus:outline-none focus:border-primary-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">إلى تاريخ</label>
                  <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 text-sm focus:outline-none focus:border-primary-300" />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={handleSearch} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">تطبيق الفلاتر</button>
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {!hasSearched && (
            <div className="mt-8 animate-fade-in">
              <p className="text-sm text-gray-500 mb-3 font-medium">عمليات بحث شائعة:</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button key={term} onClick={() => { setFilters(prev => ({ ...prev, query: term })); setHasSearched(true); fetchAIResults(term) }} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-all shadow-sm">
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats (before search) */}
      {!hasSearched && (
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-medium text-gray-500 mb-4">تصفح حسب نوع المحكمة:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(stats.byCourt).map(([court, count]) => (
                <button key={court} onClick={() => { setFilters(prev => ({ ...prev, courtType: court as CourtType })); setHasSearched(true) }} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all text-center group">
                  <p className="text-2xl font-bold text-primary-600 group-hover:scale-110 transition-transform">{count}</p>
                  <p className="text-xs text-gray-500 mt-1">ال{court}</p>
                </button>
              ))}
            </div>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">بحث بالذكاء الاصطناعي</h4>
                <p className="text-xs text-gray-500">يفهم سؤالك القانوني ويجد الأحكام ذات الصلة تلقائياً باستخدام Claude AI</p>
              </div>
              <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">بيانات رسمية</h4>
                <p className="text-xs text-gray-500">مصدر البيانات: البوابة القضائية العلمية والبوابة القانونية لوزارة العدل</p>
              </div>
              <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">تصفية متقدمة</h4>
                <p className="text-xs text-gray-500">فلترة حسب نوع المحكمة والتصنيف والتاريخ وحالة الاستئناف</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results */}
      {hasSearched && (
        <section className="pb-12 px-4 flex-1">
          <div className="max-w-6xl mx-auto">
            {aiLoading && (
              <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-sm text-emerald-700 font-medium">جاري تحليل استعلامك بالذكاء الاصطناعي...</p>
                </div>
              </div>
            )}
            {aiResult && !aiLoading && (
              <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-800 text-sm mb-2">تحليل الذكاء الاصطناعي</h3>
                    {aiResult.ai_summary && <p className="text-sm text-emerald-700 mb-3 leading-relaxed">{aiResult.ai_summary}</p>}
                    {aiResult.legal_context && <p className="text-xs text-emerald-600 mb-2"><span className="font-semibold">السياق القانوني:</span> {aiResult.legal_context}</p>}
                    {aiResult.related_articles && aiResult.related_articles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {aiResult.related_articles.map((a) => <span key={a} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">{a}</span>)}
                      </div>
                    )}
                    {aiResult.legal_advice_note && <p className="text-xs text-emerald-500 mt-3 italic">{aiResult.legal_advice_note}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                تم العثور على <span className="font-bold text-gray-800">{results.length}</span> نتيجة
                {filters.query && <span> لـ &quot;<span className="text-primary-600">{filters.query}</span>&quot;</span>}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {filters.courtType !== 'الكل' && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center gap-1">{filters.courtType}<button onClick={() => handleFilterChange('courtType', 'الكل')} className="hover:text-blue-900">×</button></span>}
                {filters.category !== 'الكل' && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs flex items-center gap-1">{filters.category}<button onClick={() => handleFilterChange('category', 'الكل')} className="hover:text-green-900">×</button></span>}
                {filters.appealStatus !== 'الكل' && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs flex items-center gap-1">{filters.appealStatus}<button onClick={() => handleFilterChange('appealStatus', 'الكل')} className="hover:text-amber-900">×</button></span>}
              </div>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.map((result) => <SearchResultCard key={result.decision.id} result={result} onViewDetails={handleViewDetails} />)}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">لم يتم العثور على نتائج</h3>
                <p className="text-gray-500 mb-4">حاول تعديل كلمات البحث أو تغيير الفلاتر</p>
                <button onClick={handleReset} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">بحث جديد</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              </div>
              <span className="text-xs text-gray-500">محرك البحث القانوني الذكي</span>
            </div>
            <p className="text-xs text-amber-600 text-center max-w-xl">تنبيه: النتائج للاسترشاد فقط ولا تُغني عن استشارة محامٍ مرخص.</p>
            <div className="flex items-center gap-3 text-xs">
              <a href="https://sjp.moj.gov.sa" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 transition-colors">البوابة القضائية العلمية</a>
              <span className="text-gray-300">|</span>
              <a href="https://laws.moj.gov.sa/ar" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 transition-colors">البوابة القانونية</a>
            </div>
          </div>
        </div>
      </footer>

      <DecisionModal decision={selectedDecision} onClose={handleCloseModal} />
    </div>
  )
}
