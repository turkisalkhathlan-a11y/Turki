'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SearchFilters, SearchResult, CourtType, CaseCategory, AppealStatus } from '@/types/legal'
import { searchDecisions, courtTypes, caseCategories, appealStatuses, getSearchSuggestions, getStatistics } from '@/lib/searchEngine'
import { judicialDecisions } from '@/data/judicialDecisions'
import SearchResultCard from '@/components/SearchResultCard'
import DecisionModal from '@/components/DecisionModal'

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

  const handleSearch = useCallback(() => {
    setHasSearched(true)
    setShowSuggestions(false)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setFilters(prev => ({ ...prev, query: suggestion }))
    setShowSuggestions(false)
    setHasSearched(true)
  }, [])

  const handleFilterChange = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    if (hasSearched) {
      // auto-refresh results when filters change
    }
  }, [hasSearched])

  const handleReset = useCallback(() => {
    setFilters(defaultFilters)
    setHasSearched(false)
    setSuggestions([])
    searchInputRef.current?.focus()
  }, [])

  const handleViewDetails = useCallback((id: string) => {
    setSelectedDecisionId(id)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedDecisionId(null)
  }, [])

  // Popular search topics
  const popularSearches = [
    'فصل تعسفي',
    'عقد تجاري',
    'كمبيالة',
    'تعويض',
    'إفلاس',
    'ملكية عقارية',
    'احتيال مالي',
    'حضانة أطفال',
  ]

  // Close suggestions on outside click
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="الرجوع للرئيسية"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-sm">محرك البحث القانوني</h1>
                <p className="text-xs text-gray-500">البوابة القانونية - وزارة العدل</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="hidden sm:inline bg-primary-50 text-primary-700 px-2 py-1 rounded-full font-medium">
              {stats.total} حكم قضائي
            </span>
          </div>
        </div>
      </header>

      {/* Hero / Search Section */}
      <section className={`transition-all duration-500 ${hasSearched ? 'py-6' : 'py-16'}`}>
        <div className="max-w-4xl mx-auto px-4">
          {!hasSearched && (
            <div className="text-center mb-8 animate-fade-in">
              <div className="w-20 h-20 mx-auto bg-primary-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">محرك البحث في الأحكام القضائية</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                ابحث بذكاء في قاعدة بيانات الأحكام القضائية الصادرة من المحاكم السعودية
              </p>
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
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true)
                  }}
                  placeholder="ابحث في الأحكام القضائية... (مثال: فصل تعسفي، عقد تجاري، كمبيالة)"
                  className="w-full px-5 py-4 pr-12 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all text-base shadow-sm"
                  dir="rtl"
                />
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={handleSearch}
                className="px-8 py-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                بحث
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-700 border-b border-gray-50 last:border-0"
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle & Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showFilters
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                تصفية متقدمة
              </button>
              {hasSearched && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  إعادة تعيين
                </button>
              )}
            </div>
            {hasSearched && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">ترتيب:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-primary-300"
                >
                  <option value="relevance">الأكثر صلة</option>
                  <option value="date_desc">الأحدث أولاً</option>
                  <option value="date_asc">الأقدم أولاً</option>
                </select>
              </div>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Court Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">نوع المحكمة</label>
                  <select
                    value={filters.courtType}
                    onChange={(e) => handleFilterChange('courtType', e.target.value as CourtType | 'الكل')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-100"
                  >
                    {courtTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === 'الكل' ? 'جميع المحاكم' : `المحكمة ال${type}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">تصنيف القضية</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value as CaseCategory | 'الكل')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-100"
                  >
                    {caseCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'الكل' ? 'جميع التصنيفات' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Appeal Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">حالة الاستئناف</label>
                  <select
                    value={filters.appealStatus}
                    onChange={(e) => handleFilterChange('appealStatus', e.target.value as AppealStatus | 'الكل')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-100"
                  >
                    {appealStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status === 'الكل' ? 'جميع الحالات' : status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">من تاريخ</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-100"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">إلى تاريخ</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  تطبيق الفلاتر
                </button>
              </div>
            </div>
          )}

          {/* Popular Searches (only before first search) */}
          {!hasSearched && (
            <div className="mt-6 animate-fade-in">
              <p className="text-sm text-gray-500 mb-3">عمليات بحث شائعة:</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, query: term }))
                      setHasSearched(true)
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Statistics (before search) */}
      {!hasSearched && (
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(stats.byCourt).map(([court, count]) => (
                <button
                  key={court}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, courtType: court as CourtType }))
                    setHasSearched(true)
                  }}
                  className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all text-center group"
                >
                  <p className="text-2xl font-bold text-primary-600 group-hover:scale-110 transition-transform">{count}</p>
                  <p className="text-xs text-gray-500 mt-1">المحكمة ال{court}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      {hasSearched && (
        <section className="pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                تم العثور على <span className="font-bold text-gray-800">{results.length}</span> نتيجة
                {filters.query && (
                  <span> لـ &quot;<span className="text-primary-600">{filters.query}</span>&quot;</span>
                )}
              </p>
              {/* Active Filters */}
              <div className="flex flex-wrap gap-1.5">
                {filters.courtType !== 'الكل' && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center gap-1">
                    {filters.courtType}
                    <button onClick={() => handleFilterChange('courtType', 'الكل')} className="hover:text-blue-900">×</button>
                  </span>
                )}
                {filters.category !== 'الكل' && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs flex items-center gap-1">
                    {filters.category}
                    <button onClick={() => handleFilterChange('category', 'الكل')} className="hover:text-green-900">×</button>
                  </span>
                )}
                {filters.appealStatus !== 'الكل' && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs flex items-center gap-1">
                    {filters.appealStatus}
                    <button onClick={() => handleFilterChange('appealStatus', 'الكل')} className="hover:text-amber-900">×</button>
                  </span>
                )}
              </div>
            </div>

            {/* Results Grid */}
            {results.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.map((result) => (
                  <SearchResultCard
                    key={result.decision.id}
                    result={result}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">لم يتم العثور على نتائج</h3>
                <p className="text-gray-500 mb-4">حاول تعديل كلمات البحث أو تغيير الفلاتر</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  بحث جديد
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer Disclaimer */}
      <footer className="bg-amber-50 border-t border-amber-200 px-4 py-3">
        <p className="text-xs text-amber-700 text-center max-w-4xl mx-auto">
          تنبيه: هذا المحرك مبني على بيانات البوابة القانونية لوزارة العدل (laws.moj.gov.sa). النتائج للاسترشاد فقط ولا تُغني عن الرجوع للمصدر الرسمي أو استشارة محامٍ مرخص.
        </p>
      </footer>

      {/* Decision Modal */}
      <DecisionModal decision={selectedDecision} onClose={handleCloseModal} />
    </div>
  )
}
