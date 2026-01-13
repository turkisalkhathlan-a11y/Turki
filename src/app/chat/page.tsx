'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ChatMessage, { Message } from '@/components/ChatMessage'
import ChatInput from '@/components/ChatInput'
import TypingIndicator from '@/components/TypingIndicator'

// Legal responses simulation - in production this would call an AI API
const legalResponses: Record<string, string> = {
  default: `شكراً لسؤالك. كمستشار قانوني، أود أن أوضح أن الإجابة على هذا السؤال تعتمد على عدة عوامل قانونية.

يُنصح دائماً بمراجعة محامٍ متخصص للحصول على استشارة قانونية دقيقة تناسب حالتك الخاصة.

هل لديك تفاصيل إضافية حول موضوعك؟`,

  عقد: `بخصوص العقود، هناك عدة نقاط أساسية يجب مراعاتها:

1. **أركان العقد**: يجب توفر الإيجاب والقبول، المحل، والسبب المشروع.

2. **شروط الصحة**: أهلية المتعاقدين، وخلو الإرادة من العيوب (الغلط، الإكراه، التدليس).

3. **التوثيق**: يُفضل توثيق العقود الهامة كتابياً وتصديقها من جهة مختصة.

هل تحتاج مساعدة في نوع معين من العقود؟`,

  عمل: `فيما يتعلق بنظام العمل، إليك أهم الحقوق والواجبات:

**حقوق العامل:**
- الأجر المتفق عليه في الوقت المحدد
- الإجازات السنوية والمرضية
- بيئة عمل آمنة وصحية
- مكافأة نهاية الخدمة

**واجبات صاحب العمل:**
- دفع الأجور في مواعيدها
- توفير التأمينات الاجتماعية
- الالتزام بساعات العمل النظامية

هل لديك استفسار محدد عن قضية عمالية؟`,

  طلاق: `مسائل الأحوال الشخصية والطلاق تتطلب اهتماماً خاصاً:

**أنواع الطلاق:**
- الطلاق الرجعي
- الطلاق البائن بينونة صغرى
- الطلاق البائن بينونة كبرى

**الحقوق المترتبة:**
- حق الحضانة للأطفال
- النفقة للزوجة والأطفال
- المتعة والمؤخر

⚠️ **تنبيه هام**: هذه المسائل حساسة وتختلف باختلاف الظروف. يُنصح بشدة بمراجعة محكمة الأحوال الشخصية أو محامٍ متخصص.`,

  ميراث: `قضايا الميراث والتركات لها أحكام شرعية وقانونية محددة:

**الورثة وأنصبتهم:**
- أصحاب الفروض (النصف، الربع، الثمن، الثلثان، الثلث، السدس)
- العصبات
- ذوي الأرحام

**إجراءات حصر الإرث:**
1. استخراج صك حصر الورثة
2. حصر أموال وممتلكات المتوفى
3. سداد الديون إن وجدت
4. تقسيم التركة حسب الأنصبة الشرعية

هل تحتاج مساعدة في حالة إرث معينة؟`,

  جريمة: `في القضايا الجنائية، من المهم معرفة:

**حقوق المتهم:**
- الحق في محامٍ
- افتراض البراءة حتى تثبت الإدانة
- عدم الإكراه على الاعتراف
- الحق في الاستئناف

**الإجراءات:**
1. تقديم البلاغ للجهة المختصة
2. التحقيق من النيابة العامة
3. المحاكمة أمام المحكمة الجزائية

⚠️ **هام**: في القضايا الجنائية، يُنصح بشدة بتوكيل محامٍ متخصص فوراً.`,
}

function getLegalResponse(question: string): string {
  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes('عقد') || lowerQuestion.includes('اتفاق') || lowerQuestion.includes('عقود')) {
    return legalResponses['عقد']
  }
  if (lowerQuestion.includes('عمل') || lowerQuestion.includes('وظيفة') || lowerQuestion.includes('راتب') || lowerQuestion.includes('فصل')) {
    return legalResponses['عمل']
  }
  if (lowerQuestion.includes('طلاق') || lowerQuestion.includes('زواج') || lowerQuestion.includes('نفقة') || lowerQuestion.includes('حضانة')) {
    return legalResponses['طلاق']
  }
  if (lowerQuestion.includes('ميراث') || lowerQuestion.includes('تركة') || lowerQuestion.includes('ورثة') || lowerQuestion.includes('إرث')) {
    return legalResponses['ميراث']
  }
  if (lowerQuestion.includes('جريمة') || lowerQuestion.includes('سرقة') || lowerQuestion.includes('قتل') || lowerQuestion.includes('اعتداء') || lowerQuestion.includes('جنائي')) {
    return legalResponses['جريمة']
  }

  return legalResponses['default']
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'مرحباً بك في المستشار القانوني! أنا هنا لمساعدتك في الإجابة على استفساراتك القانونية. كيف يمكنني مساعدتك اليوم؟',
      role: 'assistant',
      timestamp: new Date(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  const handleSend = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000))

    const response = getLegalResponse(content)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: response,
      role: 'assistant',
      timestamp: new Date(),
    }

    setIsTyping(false)
    setMessages((prev) => [...prev, assistantMessage])
  }, [])

  const handleClearChat = useCallback(() => {
    setMessages([
      {
        id: Date.now().toString(),
        content: 'مرحباً بك في المستشار القانوني! أنا هنا لمساعدتك في الإجابة على استفساراتك القانونية. كيف يمكنني مساعدتك اليوم؟',
        role: 'assistant',
        timestamp: new Date(),
      },
    ])
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="الرجوع للرئيسية"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">المستشار القانوني</h1>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                متصل الآن
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          aria-label="مسح المحادثة"
          title="مسح المحادثة"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-500 mb-2">أسئلة مقترحة:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'ما هي شروط العقد الصحيح؟',
                'ما هي حقوقي كموظف؟',
                'كيف أقسم الميراث؟',
                'ما إجراءات الطلاق؟',
              ].map((question) => (
                <button
                  key={question}
                  onClick={() => handleSend(question)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-primary-300 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isTyping} />

      {/* Disclaimer */}
      <div className="bg-amber-50 border-t border-amber-200 px-4 py-2">
        <p className="text-xs text-amber-700 text-center max-w-4xl mx-auto">
          ⚠️ تنبيه: هذه المعلومات للاسترشاد فقط ولا تُغني عن استشارة محامٍ مرخص. كل حالة قانونية فريدة وتحتاج تقييماً خاصاً.
        </p>
      </div>
    </div>
  )
}
