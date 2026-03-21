import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const systemPrompt = `أنت مفتش قضائي متخصص في مراجعة الصكوك القضائية السعودية. مهمتك تحليل الصك القضائي واكتشاف الأخطاء وفقاً للمعايير التالية:

1. **الأركان الشكلية**: البسملة، اسم المحكمة والدائرة، رقم القضية والتاريخ الهجري، بيانات الأطراف كاملة
2. **التسبيب القانوني**: سلامة الحيثيات، الاستناد للمواد النظامية، الربط بين الوقائع والحكم
3. **المنطوق**: وضوح الحكم، تحديد المبالغ بالأرقام والحروف، ذكر قابلية الاستئناف
4. **اللغة القانونية**: سلامة المصطلحات، تجنب العبارات غير الرسمية، الدقة في الألفاظ
5. **المراجع النظامية**: صحة الإشارات للمواد والأنظمة
6. **الاتساق**: عدم التناقض بين أجزاء الصك

أعد تحليلك بصيغة JSON التالية:
{
  "ai_errors": [
    {
      "category": "الفئة",
      "message": "وصف الخطأ",
      "severity": "critical|major|minor|warning",
      "suggestion": "الاقتراح"
    }
  ],
  "ai_score": 0-100,
  "ai_summary": "ملخص التقييم",
  "strengths": ["نقاط القوة"],
  "recommendations": ["التوصيات"]
}`

const userPrompt = (text: string) =>
  `حلّل الصك القضائي التالي واكتشف جميع الأخطاء:\n\n---\n${text}\n---\n\nأعد التحليل بصيغة JSON فقط.`

async function analyzeWithClaude(apiKey: string, text: string) {
  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt(text) }],
  })
  return message.content[0].type === 'text' ? message.content[0].text : ''
}

async function analyzeWithOpenAI(apiKey: string, text: string) {
  const client = new OpenAI({ apiKey })
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt(text) },
    ],
  })
  return completion.choices[0]?.message?.content || ''
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'يرجى إدخال نص الصك القضائي' },
        { status: 400 }
      )
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!anthropicKey && !openaiKey) {
      return NextResponse.json({
        ai_enabled: false,
        message:
          'التحليل بالذكاء الاصطناعي غير متاح. أضف ANTHROPIC_API_KEY أو OPENAI_API_KEY لتفعيله. التحليل القاعدي يعمل بشكل طبيعي.',
      })
    }

    let responseText: string
    let provider: string

    if (anthropicKey) {
      responseText = await analyzeWithClaude(anthropicKey, text)
      provider = 'claude'
    } else {
      responseText = await analyzeWithOpenAI(openaiKey!, text)
      provider = 'openai'
    }

    let aiResult
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      aiResult = null
    }

    return NextResponse.json({
      ai_enabled: true,
      provider,
      result: aiResult,
    })
  } catch (error) {
    console.error('Validate Document error:', error)
    return NextResponse.json(
      {
        ai_enabled: false,
        error: 'حدث خطأ في التحليل بالذكاء الاصطناعي',
        message: error instanceof Error ? error.message : 'خطأ غير معروف',
      },
      { status: 500 }
    )
  }
}
