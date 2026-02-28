import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { judicialDecisions } from '@/data/judicialDecisions'

const systemPrompt = `أنت محرك بحث قانوني ذكي متخصص في الأحكام القضائية السعودية. مهمتك تحليل استعلام المستخدم وإرجاع نتائج بحث ذكية.

لديك قاعدة بيانات تحتوي على أحكام قضائية من المحاكم السعودية (تجارية، عمالية، جزائية، أحوال شخصية، عامة، إدارية).

عند تلقي استعلام من المستخدم:
1. افهم النية والسياق القانوني للاستعلام
2. حدد الكلمات المفتاحية والمفاهيم القانونية ذات الصلة
3. حدد نوع المحكمة المناسب إن أمكن
4. أعد ملخصاً ذكياً للنتائج

يجب أن يكون ردك بصيغة JSON فقط بالشكل التالي:
{
  "understood_query": "فهمك للاستعلام",
  "legal_context": "السياق القانوني",
  "relevant_keywords": ["كلمة1", "كلمة2"],
  "suggested_court_type": "تجارية" أو null,
  "suggested_category": "عقود" أو null,
  "matched_decision_ids": ["ID1", "ID2"],
  "ai_summary": "ملخص ذكي للنتائج",
  "related_articles": ["مادة نظامية 1"],
  "legal_advice_note": "ملاحظة قانونية مختصرة"
}`

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'يرجى إدخال استعلام بحث صالح' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      // Fallback: return basic analysis without AI
      return NextResponse.json({
        ai_enabled: false,
        message: 'محرك البحث الذكي يعمل بدون مفتاح API. أضف ANTHROPIC_API_KEY لتفعيل الذكاء الاصطناعي.',
        query,
      })
    }

    const client = new Anthropic({ apiKey })

    // Prepare decisions summary for context
    const decisionsContext = judicialDecisions.map(d => ({
      id: d.id,
      subject: d.subject,
      courtType: d.courtType,
      category: d.category,
      keywords: d.keywords,
      ruling: d.ruling,
      summary: d.summary.substring(0, 200),
    }))

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `قاعدة البيانات المتاحة:\n${JSON.stringify(decisionsContext, null, 0)}\n\nاستعلام المستخدم: "${query}"\n\nحلل الاستعلام وأعد النتائج بصيغة JSON فقط.`,
        },
      ],
      system: systemPrompt,
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON from response
    let aiResult
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      aiResult = null
    }

    return NextResponse.json({
      ai_enabled: true,
      result: aiResult,
      query,
    })
  } catch (error) {
    console.error('AI Search error:', error)
    return NextResponse.json(
      {
        ai_enabled: false,
        error: 'حدث خطأ في محرك البحث الذكي',
        message: error instanceof Error ? error.message : 'خطأ غير معروف',
      },
      { status: 500 }
    )
  }
}
