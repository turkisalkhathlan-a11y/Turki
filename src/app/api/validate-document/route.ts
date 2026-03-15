import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

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

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'يرجى إدخال نص الصك القضائي' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        ai_enabled: false,
        message: 'التحليل بالذكاء الاصطناعي غير متاح. أضف ANTHROPIC_API_KEY لتفعيله. التحليل القاعدي يعمل بشكل طبيعي.',
      })
    }

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `حلّل الصك القضائي التالي واكتشف جميع الأخطاء:\n\n---\n${text}\n---\n\nأعد التحليل بصيغة JSON فقط.`,
        },
      ],
      system: systemPrompt,
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let aiResult
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      aiResult = null
    }

    return NextResponse.json({
      ai_enabled: true,
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
