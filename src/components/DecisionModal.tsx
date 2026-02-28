'use client'

import { memo, useEffect } from 'react'
import { JudicialDecision } from '@/types/legal'

interface DecisionModalProps {
  decision: JudicialDecision | null
  onClose: () => void
}

const courtTypeColors: Record<string, string> = {
  'تجارية': 'bg-blue-100 text-blue-800',
  'عمالية': 'bg-green-100 text-green-800',
  'جزائية': 'bg-red-100 text-red-800',
  'أحوال شخصية': 'bg-purple-100 text-purple-800',
  'عامة': 'bg-gray-100 text-gray-800',
  'إدارية': 'bg-amber-100 text-amber-800',
}

function DecisionModal({ decision, onClose }: DecisionModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (decision) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [decision, onClose])

  if (!decision) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">تفاصيل الحكم القضائي</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="إغلاق"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title & Court */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${courtTypeColors[decision.courtType] || ''}`}>
                المحكمة ال{decision.courtType}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                {decision.category}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{decision.subject}</h3>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">رقم القضية</p>
              <p className="font-semibold text-gray-800">{decision.caseNumber}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">التاريخ الهجري</p>
              <p className="font-semibold text-gray-800">{decision.hijriDate} هـ</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">القاضي</p>
              <p className="font-semibold text-gray-800">{decision.judge}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">حالة الاستئناف</p>
              <p className="font-semibold text-gray-800">{decision.appealStatus}</p>
            </div>
          </div>

          {/* Ruling */}
          <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <h4 className="font-bold text-primary-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              منطوق الحكم
            </h4>
            <p className="text-primary-900 font-medium">{decision.ruling}</p>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              ملخص القضية
            </h4>
            <p className="text-gray-600 leading-relaxed">{decision.summary}</p>
          </div>

          {/* Full Text */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              نص الحكم
            </h4>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-gray-700 leading-loose text-sm">{decision.fullText}</p>
            </div>
          </div>

          {/* Legal Articles */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              المواد النظامية المطبقة
            </h4>
            <div className="flex flex-wrap gap-2">
              {decision.legalArticles.map((article) => (
                <span
                  key={article}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm border border-slate-200"
                >
                  {article}
                </span>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="mb-4">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              الكلمات المفتاحية
            </h4>
            <div className="flex flex-wrap gap-2">
              {decision.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-3 flex items-center justify-between rounded-b-2xl">
          <p className="text-xs text-gray-400">
            المصدر: البوابة القانونية - وزارة العدل
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(DecisionModal)
