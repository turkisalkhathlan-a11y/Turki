'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  validateDocument,
  SAMPLE_DOCUMENT_WITH_ERRORS,
  SAMPLE_DOCUMENT_CORRECT,
  type ValidationResult,
  type ValidationError,
  type ErrorSeverity,
} from '@/lib/judicialValidator'

interface AIResult {
  ai_errors?: Array<{
    category: string
    message: string
    severity: ErrorSeverity
    suggestion: string
  }>
  ai_score?: number
  ai_summary?: string
  strengths?: string[]
  recommendations?: string[]
}

export default function ValidatorPage() {
  const [documentText, setDocumentText] = useState('')
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'input' | 'results' | 'report'>('input')

  const handleValidate = async () => {
    if (!documentText.trim()) return
    setIsValidating(true)
    setAiResult(null)

    // التحقق القاعدي (فوري)
    const validationResult = validateDocument(documentText)
    setResult(validationResult)
    setActiveTab('results')
    setIsValidating(false)

    // التحقق بالذكاء الاصطناعي (غير متزامن)
    setIsAiLoading(true)
    try {
      const response = await fetch('/api/validate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: documentText }),
      })
      const data = await response.json()
      if (data.ai_enabled && data.result) {
        setAiResult(data.result)
      }
    } catch {
      // AI analysis is optional
    } finally {
      setIsAiLoading(false)
    }
  }

  const loadSample = (type: 'errors' | 'correct') => {
    setDocumentText(type === 'errors' ? SAMPLE_DOCUMENT_WITH_ERRORS : SAMPLE_DOCUMENT_CORRECT)
    setResult(null)
    setAiResult(null)
    setActiveTab('input')
  }

  const severityConfig: Record<ErrorSeverity, { label: string; color: string; bg: string; icon: string }> = {
    critical: { label: 'حرج', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: '🔴' },
    major: { label: 'رئيسي', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: '🟠' },
    minor: { label: 'ثانوي', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: '🟡' },
    warning: { label: 'تنبيه', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '🔵' },
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-600'
    if (score >= 70) return 'from-yellow-500 to-yellow-600'
    if (score >= 50) return 'from-orange-500 to-orange-600'
    return 'from-red-500 to-red-600'
  }

  const groupedErrors = result?.errors.reduce((acc, error) => {
    if (!acc[error.category]) acc[error.category] = []
    acc[error.category].push(error)
    return acc
  }, {} as Record<string, ValidationError[]>)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">المفتش القضائي</h1>
            <p className="text-sm text-gray-500">كشف أخطاء الصكوك القضائية</p>
          </div>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'input' as const, label: 'إدخال الصك', icon: '📄' },
            { key: 'results' as const, label: 'نتائج الفحص', icon: '🔍', disabled: !result },
            { key: 'report' as const, label: 'التقرير التفصيلي', icon: '📊', disabled: !result },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white shadow-lg'
                  : tab.disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">نص الصك القضائي</h2>
                  <span className="text-sm text-gray-400">
                    {documentText.trim().split(/\s+/).filter(Boolean).length} كلمة
                  </span>
                </div>
                <textarea
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="الصق نص الصك القضائي هنا للفحص..."
                  className="w-full h-96 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-700 leading-relaxed"
                  dir="rtl"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleValidate}
                    disabled={!documentText.trim() || isValidating}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isValidating ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        جاري الفحص...
                      </span>
                    ) : (
                      'فحص الصك القضائي'
                    )}
                  </button>
                  <button
                    onClick={() => { setDocumentText(''); setResult(null); setAiResult(null) }}
                    className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    مسح
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="font-bold text-gray-800 mb-3">نماذج تجريبية</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => loadSample('errors')}
                    className="w-full text-right px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm"
                  >
                    صك به أخطاء متعددة
                  </button>
                  <button
                    onClick={() => loadSample('correct')}
                    className="w-full text-right px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors text-sm"
                  >
                    صك قضائي نموذجي
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="font-bold text-gray-800 mb-3">محددات الفحص</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">&#10003;</span>
                    الأركان الشكلية للصك
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">&#10003;</span>
                    صحة التاريخ الهجري
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">&#10003;</span>
                    بيانات الأطراف والوكلاء
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">&#10003;</span>
                    المصطلحات القانونية
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">&#10003;</span>
                    المراجع النظامية
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">&#10003;</span>
                    وضوح المنطوق
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">&#10003;</span>
                    اللغة الرسمية
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">&#10003;</span>
                    قابلية الطعن والاستئناف
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-5 border border-primary-200">
                <h3 className="font-bold text-primary-800 mb-2">نموذج الذكاء الاصطناعي</h3>
                <p className="text-sm text-primary-700 mb-2">
                  يُنصح باستخدام <strong>Claude Sonnet 4.6</strong> للتوازن بين السرعة والدقة، أو <strong>Claude Opus 4.6</strong> للتحليل القانوني المعمّق.
                </p>
                <p className="text-xs text-primary-600">
                  model: claude-sonnet-4-6-20250514
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && result && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              {/* Score Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-6">
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${getScoreBg(result.score)} flex items-center justify-center shadow-lg`}>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{result.score}</div>
                      <div className="text-xs text-white/80">من 100</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-xl font-bold mb-2 ${getScoreColor(result.score)}`}>
                      {result.score >= 90 ? 'ممتاز' : result.score >= 70 ? 'جيد' : result.score >= 50 ? 'يحتاج مراجعة' : 'ضعيف'}
                    </h2>
                    <p className="text-gray-600">{result.summary}</p>
                  </div>
                </div>

                {/* Error Stats */}
                <div className="grid grid-cols-4 gap-3 mt-6">
                  {(['critical', 'major', 'minor', 'warning'] as ErrorSeverity[]).map(sev => {
                    const count = result.errors.filter(e => e.severity === sev).length
                    const config = severityConfig[sev]
                    return (
                      <div key={sev} className={`p-3 rounded-xl border ${config.bg} text-center`}>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className={`text-sm ${config.color}`}>{config.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Errors List */}
              {groupedErrors && Object.entries(groupedErrors).map(([category, errors]) => (
                <div key={category} className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-600 rounded-full" />
                    {category}
                    <span className="text-sm font-normal text-gray-400">({errors.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {errors.map(error => {
                      const config = severityConfig[error.severity]
                      return (
                        <div key={error.id} className={`p-4 rounded-xl border ${config.bg}`}>
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{config.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color} bg-white/60`}>
                                  {config.label}
                                </span>
                              </div>
                              <p className={`font-medium ${config.color}`}>{error.message}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">الاقتراح:</span> {error.suggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* AI Analysis */}
              {isAiLoading && (
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                  <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-primary-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-gray-600">جاري التحليل بالذكاء الاصطناعي...</p>
                </div>
              )}

              {aiResult && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-purple-200">
                  <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    تحليل الذكاء الاصطناعي (Claude)
                  </h3>
                  {aiResult.ai_summary && (
                    <p className="text-purple-700 mb-4">{aiResult.ai_summary}</p>
                  )}
                  {aiResult.strengths && aiResult.strengths.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-green-700 mb-2">نقاط القوة:</h4>
                      <ul className="space-y-1">
                        {aiResult.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-green-600">
                            <span>&#10003;</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiResult.recommendations && aiResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-purple-700 mb-2">التوصيات:</h4>
                      <ul className="space-y-1">
                        {aiResult.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-purple-600">
                            <span>&#9679;</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiResult.ai_errors && aiResult.ai_errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-purple-700 mb-2">أخطاء إضافية اكتشفها الذكاء الاصطناعي:</h4>
                      <div className="space-y-2">
                        {aiResult.ai_errors.map((err, i) => (
                          <div key={i} className="p-3 bg-white/60 rounded-lg border border-purple-100">
                            <p className="font-medium text-purple-800">{err.message}</p>
                            <p className="text-sm text-purple-600 mt-1">{err.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sections Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="font-bold text-gray-800 mb-4">أقسام الصك</h3>
                <div className="space-y-2">
                  {result.sections.map((section, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-700">{section.name}</span>
                      {section.found ? (
                        <span className="text-green-500 text-lg">&#10003;</span>
                      ) : (
                        <span className="text-red-500 text-lg">&#10007;</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('input')}
                className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                تعديل النص
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                عرض التقرير الكامل
              </button>
            </div>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && result && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 print:shadow-none" dir="rtl">
              <div className="text-center mb-8 border-b pb-6">
                <h2 className="text-2xl font-bold text-gray-800">تقرير فحص الصك القضائي</h2>
                <p className="text-gray-500 mt-1">تاريخ الفحص: {new Date().toLocaleDateString('ar-SA')}</p>
              </div>

              {/* Score */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getScoreBg(result.score)} text-white text-2xl font-bold shadow-lg`}>
                  {result.score}
                </div>
                <p className={`mt-2 font-bold text-lg ${getScoreColor(result.score)}`}>
                  {result.score >= 90 ? 'ممتاز' : result.score >= 70 ? 'جيد' : result.score >= 50 ? 'يحتاج مراجعة' : 'ضعيف'}
                </p>
                <p className="text-gray-600 mt-1">{result.summary}</p>
              </div>

              {/* Sections Table */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3">الأقسام الأساسية</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 text-right text-sm">القسم</th>
                      <th className="border p-2 text-center text-sm">الحالة</th>
                      <th className="border p-2 text-right text-sm">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.sections.map((section, i) => (
                      <tr key={i}>
                        <td className="border p-2 text-sm">{section.name}</td>
                        <td className="border p-2 text-center">
                          {section.found ? (
                            <span className="text-green-600 font-bold">موجود</span>
                          ) : (
                            <span className="text-red-600 font-bold">مفقود</span>
                          )}
                        </td>
                        <td className="border p-2 text-sm text-gray-600">{section.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* All Errors */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  جميع الأخطاء والملاحظات ({result.errors.length})
                </h3>
                <div className="space-y-3">
                  {result.errors.map((error, i) => {
                    const config = severityConfig[error.severity]
                    return (
                      <div key={i} className={`p-3 rounded-lg border ${config.bg}`}>
                        <div className="flex items-start gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color} bg-white/60 whitespace-nowrap`}>
                            {config.label}
                          </span>
                          <div>
                            <p className={`font-medium text-sm ${config.color}`}>{error.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{error.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI Section in Report */}
              {aiResult && (
                <div className="mb-8 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-bold text-purple-800 mb-3">تحليل الذكاء الاصطناعي</h3>
                  {aiResult.ai_summary && <p className="text-purple-700 mb-3">{aiResult.ai_summary}</p>}
                  {aiResult.strengths && (
                    <div className="mb-2">
                      <span className="font-medium text-green-700">نقاط القوة: </span>
                      <span className="text-sm text-green-600">{aiResult.strengths.join(' | ')}</span>
                    </div>
                  )}
                  {aiResult.recommendations && (
                    <div>
                      <span className="font-medium text-purple-700">التوصيات: </span>
                      <span className="text-sm text-purple-600">{aiResult.recommendations.join(' | ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Disclaimer */}
              <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t">
                <p>هذا التقرير لأغراض استرشادية فقط ولا يُغني عن المراجعة القانونية المتخصصة</p>
                <p className="mt-1">المفتش القضائي - المستشار القانوني</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                طباعة التقرير
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                العودة للنتائج
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
