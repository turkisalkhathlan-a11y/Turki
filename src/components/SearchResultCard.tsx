'use client'

import { memo } from 'react'
import { SearchResult } from '@/types/legal'

interface SearchResultCardProps {
  result: SearchResult
  onViewDetails: (id: string) => void
}

const courtTypeColors: Record<string, string> = {
  'إدارية': 'bg-amber-100 text-amber-800',
  'جزائية': 'bg-red-100 text-red-800',
  'استئناف إدارية': 'bg-indigo-100 text-indigo-800',
  'المحكمة الإدارية العليا': 'bg-purple-100 text-purple-800',
  'عامة': 'bg-gray-100 text-gray-800',
  'تجارية': 'bg-blue-100 text-blue-800',
  'عمالية': 'bg-green-100 text-green-800',
  'أحوال شخصية': 'bg-pink-100 text-pink-800',
}

const appealStatusColors: Record<string, string> = {
  'نهائي': 'bg-green-50 text-green-700 border-green-200',
  'قابل للاستئناف': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'مستأنف': 'bg-orange-50 text-orange-700 border-orange-200',
  'مؤيد استئنافياً': 'bg-blue-50 text-blue-700 border-blue-200',
}

function SearchResultCard({ result, onViewDetails }: SearchResultCardProps) {
  const { decision, relevanceScore, matchedKeywords, highlightedSummary } = result

  // Render highlighted summary with bold markers
  const renderHighlighted = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded font-semibold">
            {part.slice(2, -2)}
          </mark>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${courtTypeColors[decision.courtType] || 'bg-gray-100 text-gray-800'}`}>
              {decision.courtType === 'المحكمة الإدارية العليا' ? decision.courtType : `المحكمة ال${decision.courtType}`}
            </span>
            <span className={`px-2 py-0.5 rounded border text-xs ${appealStatusColors[decision.appealStatus] || ''}`}>
              {decision.appealStatus}
            </span>
          </div>
          {relevanceScore > 0 && matchedKeywords.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full shrink-0">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {Math.min(Math.round(relevanceScore / 5) * 10, 100)}%
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-primary-700 transition-colors">
          {decision.subject}
        </h3>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {decision.hijriDate} هـ
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            رقم القضية: {decision.caseNumber}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {decision.judge}
          </span>
        </div>

        {/* Summary */}
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {renderHighlighted(highlightedSummary)}
        </p>
      </div>

      {/* Ruling */}
      <div className="mx-5 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
        <p className="text-sm">
          <span className="font-semibold text-gray-700">الحكم: </span>
          <span className="text-gray-600">{decision.ruling}</span>
        </p>
      </div>

      {/* Compensation Details */}
      {(decision.compensationAmount || decision.imprisonmentDays || decision.dailyRate) && (
        <div className="mx-5 mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="flex flex-wrap gap-3 text-xs">
            {decision.compensationAmount && (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                التعويض: {decision.compensationAmount}
              </span>
            )}
            {decision.imprisonmentDays && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                مدة السجن: {decision.imprisonmentDays} يوم
              </span>
            )}
            {decision.dailyRate && (
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                معدل يومي: {decision.dailyRate.toLocaleString()} ريال
              </span>
            )}
          </div>
        </div>
      )}

      {/* Keywords & Actions */}
      <div className="px-5 pb-4">
        {/* Matched keywords */}
        {matchedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {matchedKeywords.slice(0, 5).map((keyword) => (
              <span
                key={keyword}
                className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}

        {/* Legal Articles */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {decision.legalArticles.map((article) => (
            <span
              key={article}
              className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs border border-gray-200"
            >
              {article}
            </span>
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={() => onViewDetails(decision.id)}
          className="w-full mt-2 py-2.5 px-4 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          عرض تفاصيل الحكم
        </button>
      </div>
    </div>
  )
}

export default memo(SearchResultCard)
