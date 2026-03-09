'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  redactDocument,
  RedactionResult,
  RedactionOptions,
  defaultRedactionOptions,
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

type TabType = 'input' | 'result' | 'report'

export default function RedactPage() {
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<RedactionResult | null>(null)
  const [options, setOptions] = useState<RedactionOptions>(defaultRedactionOptions)
  const [activeTab, setActiveTab] = useState<TabType>('input')
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleRedact = useCallback(() => {
    if (!inputText.trim()) return
    setIsProcessing(true)
    // Small delay for UX feedback
    setTimeout(() => {
      const redactionResult = redactDocument(inputText, options)
      setResult(redactionResult)
      setActiveTab('result')
      setIsProcessing(false)
    }, 300)
  }, [inputText, options])

  const handleLoadSample = () => {
    setInputText(SAMPLE_LEGAL_TEXT)
    setResult(null)
    setActiveTab('input')
  }

  const handleClear = () => {
    setInputText('')
    setResult(null)
    setActiveTab('input')
  }

  const handleCopyRedacted = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.redactedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleOption = (key: keyof RedactionOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const totalEntities = result
    ? Object.values(result.stats).reduce((a, b) => a + b, 0)
    : 0

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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Options */}
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
                  <label
                    key={key}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
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
                <button
                  onClick={handleLoadSample}
                  className="w-full text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  تحميل نص تجريبي
                </button>
                <button
                  onClick={handleClear}
                  className="w-full text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  مسح الكل
                </button>
              </div>

              {/* Stats */}
              {result && totalEntities > 0 && (
                <>
                  <hr className="my-4" />
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">ملخص التنقيح</h3>
                  <div className="space-y-2">
                    {Object.entries(result.stats).map(([type, count]) => {
                      if (count === 0) return null
                      const colors = ENTITY_COLORS[type as EntityType]
                      return (
                        <div
                          key={type}
                          className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${colors}`}
                        >
                          <span className="flex items-center gap-1">
                            <span>{ENTITY_ICONS[type as EntityType]}</span>
                            {type}
                          </span>
                          <span className="font-bold">{count}</span>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between text-sm px-3 py-2 bg-gray-800 text-white rounded-lg font-bold">
                      <span>الإجمالي</span>
                      <span>{totalEntities}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-white rounded-xl shadow-sm p-1">
              {[
                { id: 'input' as TabType, label: 'النص الأصلي', icon: '📝' },
                { id: 'result' as TabType, label: 'النص المنقح', icon: '🔒' },
                { id: 'report' as TabType, label: 'تقرير التنقيح', icon: '📊' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="ml-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Input Tab */}
            {activeTab === 'input' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الصق نص الحكم القضائي هنا
                  </label>
                  <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="الصق نص الحكم القضائي المراد تنقيحه هنا..."
                    className="w-full h-96 p-4 border border-gray-300 rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none font-mono"
                    dir="rtl"
                  />
                </div>

                <div className="flex items-center justify-between">
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
                        جاري التنقيح...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        تنقيح النص
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Result Tab */}
            {activeTab === 'result' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                {result ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800">النص بعد التنقيح</h3>
                      <button
                        onClick={handleCopyRedacted}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            تم النسخ
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            نسخ النص المنقح
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 whitespace-pre-wrap text-sm leading-relaxed font-mono max-h-[600px] overflow-y-auto">
                      <RedactedTextDisplay text={result.redactedText} />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>أدخل نصاً في التبويب الأول ثم اضغط &ldquo;تنقيح النص&rdquo;</p>
                  </div>
                )}
              </div>
            )}

            {/* Report Tab */}
            {activeTab === 'report' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                {result && result.entities.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-800">تقرير البيانات المكتشفة</h3>
                      <span className="text-sm text-gray-500">
                        تم اكتشاف {totalEntities} عنصر شخصي
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-right py-3 px-4 font-medium text-gray-600">#</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-600">النوع</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-600">القيمة الأصلية</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-600">الاستبدال</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-600">الموقع</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.entities.map((entity, i) => (
                            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${ENTITY_COLORS[entity.type]}`}>
                                  {ENTITY_ICONS[entity.type]} {entity.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-red-600 bg-red-50 rounded">
                                {entity.original}
                              </td>
                              <td className="py-3 px-4 font-mono text-green-700 bg-green-50 rounded">
                                {entity.replacement}
                              </td>
                              <td className="py-3 px-4 text-gray-500 text-xs">
                                حرف {entity.start}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : result && result.entities.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>لم يتم اكتشاف أي بيانات شخصية في النص</p>
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>قم بتنقيح النص أولاً لعرض التقرير</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Component to highlight redacted portions in the text
function RedactedTextDisplay({ text }: { text: string }) {
  // Split on redaction markers like [اسم شخص], [رقم هوية], etc.
  const parts = text.split(/(\[[^\]]+\])/)

  const entityTypes = Object.keys(ENTITY_COLORS)

  return (
    <>
      {parts.map((part, i) => {
        // Check if this part is a redaction marker
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
