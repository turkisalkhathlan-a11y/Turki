'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { evaluateRulingLocally, EVALUATION_CRITERIA, type EvaluationResult, type CriterionResult } from '@/lib/evaluationEngine'

type CaseType = 'تجارية' | 'عمالية' | 'جزائية' | 'أحوال شخصية' | 'عامة' | 'إدارية' | ''

interface AIEvaluationResult {
  criteria: Array<{
    id: string
    name: string
    score: number
    maxScore: number
    analysis: string
    issues: string[]
    strengths: string[]
  }>
  overallScore: number
  overallPercentage: number
  grade: string
  criticalIssues: string[]
  recommendations: string[]
  summary: string
}

const SAMPLE_RULING = `بسم الله الرحمن الرحيم

المحكمة التجارية بالرياض - الدائرة الثالثة
رقم القضية: 4521 لعام 1445هـ
التاريخ: 15/06/1445هـ

المدعي: شركة النور للتجارة والمقاولات
المدعى عليه: مؤسسة البناء الحديث

الوقائع:
تتلخص وقائع هذه الدعوى في أن المدعي تقدم بدعواه ضد المدعى عليه مطالباً بمبلغ وقدره (500,000) خمسمائة ألف ريال، وذلك قيمة أعمال مقاولات نفذها لصالح المدعى عليه بموجب عقد المقاولة رقم 2023/156 المؤرخ في 01/02/1444هـ.

حيث إن المدعي قدم ما يثبت تنفيذه للأعمال المتفق عليها كاملة، وحيث إن المدعى عليه لم ينكر استلامه للأعمال ولكنه دفع بأن الأعمال لم تكن مطابقة للمواصفات.

ولما كانت الدائرة قد اطلعت على تقرير الخبير المعين في الدعوى والذي أثبت أن الأعمال منفذة بنسبة 95% وفقاً للمواصفات المتفق عليها.

الأسباب:
بناءً على المادة (13) من نظام المحكمة التجارية، والمادة (48) من نظام المرافعات الشرعية، وحيث ثبت للدائرة من خلال البينات المقدمة وتقرير الخبير أن المدعي نفذ التزاماته التعاقدية، وحيث إن المدعى عليه لم يقدم ما يثبت دفوعه بعدم المطابقة، ولما كان العقد شريعة المتعاقدين استناداً للمادة (1) من نظام المعاملات المدنية.

المنطوق:
حكمت الدائرة بما يلي:
أولاً: إلزام المدعى عليه بدفع مبلغ (475,000) أربعمائة وخمسة وسبعين ألف ريال للمدعي.
ثانياً: رفض ما زاد على ذلك من طلبات.
ثالثاً: هذا الحكم قابل للاستئناف خلال ثلاثين يوماً من تاريخ إبلاغ الأطراف.

القاضي: عبدالله بن محمد
رئيس الدائرة الثالثة`

export default function EvaluatePage() {
  const [rulingText, setRulingText] = useState('')
  const [caseType, setCaseType] = useState<CaseType>('')
  const [localResult, setLocalResult] = useState<EvaluationResult | null>(null)
  const [aiResult, setAiResult] = useState<AIEvaluationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'local' | 'ai'>('local')
  const [showCriteria, setShowCriteria] = useState(false)

  const handleEvaluate = useCallback(async () => {
    if (!rulingText.trim() || rulingText.trim().length < 20) return
    setIsLoading(true)
    setAiResult(null)
    setAiMessage('')

    // Local evaluation (instant)
    const result = evaluateRulingLocally(rulingText)
    setLocalResult(result)
    setActiveTab('local')
    setIsLoading(false)

    // AI evaluation (async)
    setAiLoading(true)
    try {
      const response = await fetch('/api/evaluate-ruling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rulingText, caseType }),
      })
      const data = await response.json()
      if (data.ai_enabled && data.result) {
        setAiResult(data.result)
      } else {
        setAiMessage(data.message || 'التقييم بالذكاء الاصطناعي غير متاح حالياً')
      }
    } catch {
      setAiMessage('تعذر الاتصال بخدمة الذكاء الاصطناعي')
    } finally {
      setAiLoading(false)
    }
  }, [rulingText, caseType])

  const loadSample = useCallback(() => {
    setRulingText(SAMPLE_RULING)
    setCaseType('تجارية')
    setLocalResult(null)
    setAiResult(null)
  }, [])

  const handleReset = useCallback(() => {
    setRulingText('')
    setCaseType('')
    setLocalResult(null)
    setAiResult(null)
    setAiMessage('')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">تقييم الأحكام القضائية بالذكاء الاصطناعي</h1>
            <p className="text-sm text-gray-500">تحليل شامل لجودة الحكم واكتشاف المشاكل</p>
          </div>
          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            معايير التقييم
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Criteria Modal */}
        {showCriteria && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">معايير التقييم (100 نقطة)</h2>
              <button onClick={() => setShowCriteria(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EVALUATION_CRITERIA.map((c) => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-800">{c.name}</span>
                    <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-full">{c.maxScore} نقطة</span>
                  </div>
                  <p className="text-sm text-gray-600">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">نص الحكم القضائي</h2>
            <div className="flex gap-2">
              <button
                onClick={loadSample}
                className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                تحميل نموذج
              </button>
              {rulingText && (
                <button
                  onClick={handleReset}
                  className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  مسح
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع القضية (اختياري)</label>
            <select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value as CaseType)}
              className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">غير محدد</option>
              <option value="تجارية">تجارية</option>
              <option value="عمالية">عمالية</option>
              <option value="جزائية">جزائية</option>
              <option value="أحوال شخصية">أحوال شخصية</option>
              <option value="عامة">عامة</option>
              <option value="إدارية">إدارية</option>
            </select>
          </div>

          <textarea
            value={rulingText}
            onChange={(e) => setRulingText(e.target.value)}
            placeholder="الصق نص الحكم القضائي هنا لتقييمه..."
            className="w-full h-64 border border-gray-300 rounded-lg p-4 text-sm leading-relaxed focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
            dir="rtl"
          />

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-400">
              {rulingText.length > 0 ? `${rulingText.length} حرف` : 'أدخل نص الحكم للبدء'}
            </span>
            <button
              onClick={handleEvaluate}
              disabled={isLoading || rulingText.trim().length < 20}
              className="bg-primary-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جارٍ التقييم...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  تقييم الحكم
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {localResult && (
          <div className="space-y-6">
            {/* Score Overview */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Score Circle */}
                <div className="relative w-40 h-40 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={localResult.overallPercentage >= 75 ? '#10b981' : localResult.overallPercentage >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${localResult.overallPercentage * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${localResult.gradeColor}`}>{localResult.overallPercentage}%</span>
                    <span className={`text-sm font-medium ${localResult.gradeColor}`}>{localResult.grade}</span>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-right">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">نتيجة التقييم</h2>
                  <p className="text-gray-600 mb-4">{localResult.summary}</p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                      {localResult.overallScore} / 100 نقطة
                    </span>
                    <span className="bg-amber-50 text-amber-700 text-sm px-3 py-1 rounded-full">
                      {localResult.totalIssues} ملاحظة
                    </span>
                    {localResult.criticalIssues.length > 0 && (
                      <span className="bg-red-50 text-red-700 text-sm px-3 py-1 rounded-full">
                        {localResult.criticalIssues.length} مشكلة جوهرية
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Switch */}
            <div className="flex bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <button
                onClick={() => setActiveTab('local')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'local' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                التقييم الأساسي
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                تقييم الذكاء الاصطناعي
                {aiLoading && ' ...'}
              </button>
            </div>

            {/* Local Results Tab */}
            {activeTab === 'local' && (
              <div className="space-y-4">
                {/* Criteria Cards */}
                {localResult.criteria.map((criterion) => (
                  <CriterionCard key={criterion.criterionId} criterion={criterion} />
                ))}

                {/* Recommendations */}
                {localResult.recommendations.length > 0 && (
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                    <h3 className="text-lg font-bold text-blue-800 mb-3">التوصيات</h3>
                    <ul className="space-y-2">
                      {localResult.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-blue-700">
                          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* AI Results Tab */}
            {activeTab === 'ai' && (
              <div>
                {aiLoading && (
                  <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
                    <svg className="animate-spin w-10 h-10 mx-auto mb-4 text-primary-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-gray-600">جارٍ تحليل الحكم بالذكاء الاصطناعي...</p>
                    <p className="text-xs text-gray-400 mt-1">قد يستغرق هذا بضع ثوانٍ</p>
                  </div>
                )}

                {!aiLoading && aiMessage && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 text-center">
                    <p className="text-amber-700">{aiMessage}</p>
                  </div>
                )}

                {!aiLoading && aiResult && (
                  <div className="space-y-4">
                    {/* AI Summary */}
                    <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">ملخص التقييم الذكي</h3>
                      <p className="text-gray-600 leading-relaxed">{aiResult.summary}</p>
                      {aiResult.overallPercentage !== undefined && (
                        <div className="mt-3 flex gap-3">
                          <span className="bg-primary-100 text-primary-700 text-sm font-bold px-3 py-1 rounded-full">
                            {aiResult.overallPercentage}% - {aiResult.grade}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* AI Criteria */}
                    {aiResult.criteria?.map((c, i) => (
                      <div key={i} className="bg-white rounded-xl shadow border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-800">{c.name}</h4>
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                            (c.score / c.maxScore) >= 0.75 ? 'bg-emerald-100 text-emerald-700' :
                            (c.score / c.maxScore) >= 0.5 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {c.score} / {c.maxScore}
                          </span>
                        </div>
                        {c.analysis && <p className="text-sm text-gray-600 mb-3">{c.analysis}</p>}
                        {c.strengths?.length > 0 && (
                          <div className="mb-2">
                            {c.strengths.map((s, j) => (
                              <p key={j} className="text-sm text-emerald-600 flex items-start gap-1">
                                <span className="mt-1">+</span> {s}
                              </p>
                            ))}
                          </div>
                        )}
                        {c.issues?.length > 0 && (
                          <div>
                            {c.issues.map((issue, j) => (
                              <p key={j} className="text-sm text-red-600 flex items-start gap-1">
                                <span className="mt-1">-</span> {issue}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* AI Critical Issues */}
                    {aiResult.criticalIssues?.length > 0 && (
                      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                        <h3 className="text-lg font-bold text-red-800 mb-3">مشاكل جوهرية</h3>
                        <ul className="space-y-2">
                          {aiResult.criticalIssues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-2 text-red-700 text-sm">
                              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* AI Recommendations */}
                    {aiResult.recommendations?.length > 0 && (
                      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                        <h3 className="text-lg font-bold text-blue-800 mb-3">توصيات الذكاء الاصطناعي</h3>
                        <ul className="space-y-2">
                          {aiResult.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-blue-700 text-sm">
                              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 mb-4 text-center">
          <p className="text-xs text-gray-400">
            هذا التقييم استرشادي ولا يُعد رأياً قانونياً رسمياً. يُرجى الرجوع للمختصين للحصول على استشارة قانونية معتمدة.
          </p>
        </div>
      </main>
    </div>
  )
}

function CriterionCard({ criterion }: { criterion: CriterionResult }) {
  const barColor = criterion.percentage >= 75 ? 'bg-emerald-500' : criterion.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const badgeColor = criterion.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : criterion.percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-800">{criterion.criterionName}</h4>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${badgeColor}`}>
          {criterion.score} / {criterion.maxScore}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
        <div className={`h-2.5 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${criterion.percentage}%` }} />
      </div>

      {/* Strengths */}
      {criterion.strengths.length > 0 && (
        <div className="mb-2">
          {criterion.strengths.map((s, i) => (
            <p key={i} className="text-sm text-emerald-600 flex items-start gap-1">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {s}
            </p>
          ))}
        </div>
      )}

      {/* Issues */}
      {criterion.issues.length > 0 && (
        <div>
          {criterion.issues.map((issue, i) => (
            <p key={i} className="text-sm text-red-600 flex items-start gap-1">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
              {issue}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
