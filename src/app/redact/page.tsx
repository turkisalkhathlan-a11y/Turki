'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  redactDocument,
  RedactionResult,
  RedactionOptions,
  defaultRedactionOptions,
  RedactedEntity,
  SAMPLE_LEGAL_TEXT,
  EntityType,
} from '@/lib/redactionEngine'

const ENTITY_COLORS: Record<EntityType, string> = {
  'اسم شخص': 'bg-red-100 text-red-800 border-red-300',
  'رقم هوية': 'bg-blue-100 text-blue-800 border-blue-300',
  'رقم هاتف': 'bg-green-100 text-green-800 border-green-300',
  'رقم حساب بنكي': 'bg-purple-100 text-purple-800 border-purple-300',
  'عنوان': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'بريد إلكتروني': 'bg-pink-100 text-pink-800 border-pink-300',
  'رقم سجل تجاري': 'bg-orange-100 text-orange-800 border-orange-300',
  'رقم جواز سفر': 'bg-teal-100 text-teal-800 border-teal-300',
}

const ENTITY_ICONS: Record<EntityType, string> = {
  'اسم شخص': '👤',
  'رقم هوية': '🪪',
  'رقم هاتف': '📱',
  'رقم حساب بنكي': '🏦',
  'عنوان': '📍',
  'بريد إلكتروني': '📧',
  'رقم سجل تجاري': '📋',
  'رقم جواز سفر': '🛂',
}

const OPTION_LABELS: { key: keyof RedactionOptions; label: string; type: EntityType }[] = [
  { key: 'redactNames', label: 'أسماء الأشخاص', type: 'اسم شخص' },
  { key: 'redactIds', label: 'أرقام الهوية / الإقامة', type: 'رقم هوية' },
  { key: 'redactPhones', label: 'أرقام الهواتف', type: 'رقم هاتف' },
  { key: 'redactBankAccounts', label: 'أرقام الحسابات البنكية', type: 'رقم حساب بنكي' },
  { key: 'redactAddresses', label: 'العناوين', type: 'عنوان' },
  { key: 'redactEmails', label: 'البريد الإلكتروني', type: 'بريد إلكتروني' },
  { key: 'redactCommercialReg', label: 'السجل التجاري', type: 'رقم سجل تجاري' },
  { key: 'redactPassports', label: 'جوازات السفر', type: 'رقم جواز سفر' },
]

// Steps: input → review → final
type Step = 'input' | 'review' | 'final'

export default function RedactPage() {
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<RedactionResult | null>(null)
  const [options, setOptions] = useState<RedactionOptions>(defaultRedactionOptions)
  const [step, setStep] = useState<Step>('input')
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Track which entities are approved (true) or rejected (false)
  const [entityDecisions, setEntityDecisions] = useState<Record<number, boolean>>({})

  const handleRedact = useCallback(() => {
    if (!inputText.trim()) return
    setIsProcessing(true)
    setTimeout(() => {
      const redactionResult = redactDocument(inputText, options)
      setResult(redactionResult)
      // Default: all entities approved
      const decisions: Record<number, boolean> = {}
      redactionResult.entities.forEach((_, i) => {
        decisions[i] = true
      })
      setEntityDecisions(decisions)
      setStep('review')
      setIsProcessing(false)
    }, 300)
  }, [inputText, options])

  const handleLoadSample = () => {
    setInputText(SAMPLE_LEGAL_TEXT)
    setResult(null)
    setStep('input')
  }

  const handleClear = () => {
    setInputText('')
    setResult(null)
    setEntityDecisions({})
    setStep('input')
  }

  const handleBackToInput = () => {
    setStep('input')
  }

  const handleBackToReview = () => {
    setStep('review')
  }

  // Generate the final text based on approved/rejected decisions
  const finalText = useMemo(() => {
    if (!result) return ''

    // Get only approved entities
    const approved = result.entities
      .map((entity, i) => ({ entity, approved: entityDecisions[i] !== false }))
      .filter(x => x.approved)
      .map(x => x.entity)

    // Sort by position descending for safe replacement
    const sorted = [...approved].sort((a, b) => b.start - a.start)

    let text = inputText
    for (const entity of sorted) {
      text =
        text.substring(0, entity.start) +
        entity.replacement +
        text.substring(entity.end)
    }
    return text
  }, [result, entityDecisions, inputText])

  const handleConfirmReview = () => {
    setStep('final')
  }

  const handleCopyFinal = async () => {
    await navigator.clipboard.writeText(finalText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleEntity = (index: number) => {
    setEntityDecisions(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const approveAll = () => {
    if (!result) return
    const decisions: Record<number, boolean> = {}
    result.entities.forEach((_, i) => { decisions[i] = true })
    setEntityDecisions(decisions)
  }

  const rejectAll = () => {
    if (!result) return
    const decisions: Record<number, boolean> = {}
    result.entities.forEach((_, i) => { decisions[i] = false })
    setEntityDecisions(decisions)
  }

  const toggleOption = (key: keyof RedactionOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const approvedCount = Object.values(entityDecisions).filter(v => v).length
  const rejectedCount = Object.values(entityDecisions).filter(v => !v).length
  const totalEntities = result ? result.entities.length : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">تنقيح الأحكام القضائية</h1>
              <p className="text-sm text-gray-500">إزالة البيانات الشخصية تلقائياً</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="hidden md:flex items-center gap-2">
            {[
              { id: 'input' as Step, label: 'إدخال النص', num: '1' },
              { id: 'review' as Step, label: 'مراجعة التعديلات', num: '2' },
              { id: 'final' as Step, label: 'النص النهائي', num: '3' },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-0.5 ${step === s.id || (s.id === 'final' && step === 'final') || (s.id === 'review' && step !== 'input') ? 'bg-red-400' : 'bg-gray-300'}`} />}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  step === s.id
                    ? 'bg-red-600 text-white'
                    : (step === 'final' && s.id !== 'final') || (step === 'review' && s.id === 'input')
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {(step === 'final' && s.id !== 'final') || (step === 'review' && s.id === 'input')
                      ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      : s.num
                    }
                  </span>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ================================ */}
        {/* STEP 1: INPUT */}
        {/* ================================ */}
        {step === 'input' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-5 sticky top-6">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  خيارات التنقيح
                </h2>
                <div className="space-y-3">
                  {OPTION_LABELS.map(({ key, label, type }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={options[key]}
                        onChange={() => toggleOption(key)}
                        className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 flex items-center gap-1">
                        <span>{ENTITY_ICONS[type]}</span>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
                <hr className="my-4" />
                <div className="space-y-2">
                  <button onClick={handleLoadSample} className="w-full text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    تحميل نص تجريبي
                  </button>
                  <button onClick={handleClear} className="w-full text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    مسح الكل
                  </button>
                </div>
              </div>
            </div>

            {/* Input area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-md p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الصق نص الحكم القضائي هنا
                </label>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="الصق نص الحكم القضائي المراد تنقيحه هنا..."
                  className="w-full h-96 p-4 border border-gray-300 rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  dir="rtl"
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500">
                    {inputText.length > 0 ? `${inputText.length} حرف` : 'لم يتم إدخال نص'}
                  </span>
                  <button
                    onClick={handleRedact}
                    disabled={!inputText.trim() || isProcessing}
                    className="px-8 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        جاري الفحص...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        فحص وكشف البيانات الشخصية
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================ */}
        {/* STEP 2: REVIEW */}
        {/* ================================ */}
        {step === 'review' && result && (
          <div className="space-y-6">
            {/* Review Header */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">مراجعة البيانات المكتشفة</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    راجع كل عنصر واختر الموافقة على حذفه أو رفض الحذف وإبقائه
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-700">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      موافق: {approvedCount}
                    </span>
                    <span className="flex items-center gap-1 text-red-700">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      مرفوض: {rejectedCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bulk actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button onClick={approveAll} className="px-4 py-2 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  موافقة على الكل
                </button>
                <button onClick={rejectAll} className="px-4 py-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                  رفض الكل
                </button>
              </div>
            </div>

            {/* Entity Review Cards */}
            <div className="space-y-3">
              {result.entities.map((entity, i) => (
                <EntityReviewCard
                  key={i}
                  index={i}
                  entity={entity}
                  approved={entityDecisions[i] !== false}
                  originalText={inputText}
                  onToggle={() => toggleEntity(i)}
                />
              ))}
            </div>

            {/* Review Actions */}
            <div className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between sticky bottom-4">
              <button
                onClick={handleBackToInput}
                className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                رجوع للنص
              </button>
              <div className="text-center">
                <span className="text-sm text-gray-500">
                  {approvedCount} تعديل سيُطبّق من أصل {totalEntities}
                </span>
              </div>
              <button
                onClick={handleConfirmReview}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                اعتماد وعرض النص النهائي
              </button>
            </div>
          </div>
        )}

        {/* ================================ */}
        {/* STEP 3: FINAL TEXT */}
        {/* ================================ */}
        {step === 'final' && result && (
          <div className="space-y-6">
            {/* Stats bar */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    النص النهائي المنقح
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    تم تطبيق {approvedCount} تعديل — تم رفض {rejectedCount} تعديل
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBackToReview}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    رجوع للمراجعة
                  </button>
                  <button
                    onClick={handleCopyFinal}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        تم النسخ!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        نسخ النص النهائي
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Summary stats */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {result && Object.entries(result.stats).map(([type, count]) => {
                  if (count === 0) return null
                  // Count how many of this type were approved
                  const approvedOfType = result.entities.filter(
                    (e, i) => e.type === type && entityDecisions[i] !== false
                  ).length
                  return (
                    <span key={type} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border ${ENTITY_COLORS[type as EntityType]}`}>
                      {ENTITY_ICONS[type as EntityType]} {type}: {approvedOfType}/{count}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Final text display */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 whitespace-pre-wrap text-sm leading-loose max-h-[700px] overflow-y-auto">
                <RedactedTextDisplay text={finalText} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleClear}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                بدء تنقيح جديد
              </button>
              <button
                onClick={handleCopyFinal}
                className="px-8 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                نسخ النص النهائي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==============================
// Entity Review Card
// ==============================

function EntityReviewCard({
  index,
  entity,
  approved,
  originalText,
  onToggle,
}: {
  index: number
  entity: RedactedEntity
  approved: boolean
  originalText: string
  onToggle: () => void
}) {
  // Show surrounding context from the original text
  const contextBefore = originalText.substring(Math.max(0, entity.start - 40), entity.start)
  const contextAfter = originalText.substring(entity.end, Math.min(originalText.length, entity.end + 40))

  const colors = ENTITY_COLORS[entity.type]

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
      approved ? 'border-green-200' : 'border-red-200'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Entity info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-400 font-mono">#{index + 1}</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors}`}>
                {ENTITY_ICONS[entity.type]} {entity.type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                approved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {approved ? 'سيُحذف' : 'سيبقى'}
              </span>
            </div>

            {/* Context preview */}
            <div className="text-sm leading-relaxed bg-gray-50 rounded-lg p-3 font-mono" dir="rtl">
              <span className="text-gray-500">...{contextBefore}</span>
              <span className={`px-1 py-0.5 rounded font-bold ${
                approved
                  ? 'bg-red-200 text-red-900 line-through'
                  : 'bg-yellow-100 text-yellow-900'
              }`}>
                {entity.original}
              </span>
              <span className="text-gray-500">{contextAfter}...</span>
            </div>

            {approved && (
              <div className="text-xs text-gray-500 mt-2">
                سيُستبدل بـ: <span className="font-mono bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{entity.replacement}</span>
              </div>
            )}
          </div>

          {/* Approve / Reject buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={onToggle}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                approved
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              حذف
            </button>
            <button
              onClick={onToggle}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                !approved
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              إبقاء
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==============================
// Highlighted Text Display
// ==============================

function RedactedTextDisplay({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/)
  const entityTypes = Object.keys(ENTITY_COLORS)

  return (
    <>
      {parts.map((part, i) => {
        const inner = part.startsWith('[') && part.endsWith(']')
          ? part.slice(1, -1)
          : null

        if (inner && entityTypes.includes(inner)) {
          const colors = ENTITY_COLORS[inner as EntityType]
          return (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold mx-0.5 ${colors}`}
            >
              {ENTITY_ICONS[inner as EntityType]} {inner}
            </span>
          )
        }

        return <span key={i}>{part}</span>
      })}
    </>
  )
}
