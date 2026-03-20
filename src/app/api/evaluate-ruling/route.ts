import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const systemPrompt = `أنت خبير قانوني سعودي متخصص في تقييم جودة الأحكام القضائية. مهمتك تحليل الحكم القضائي تحليلاً شاملاً وفق المعايير التالية:

## معايير التقييم (المجموع 100 نقطة):

### 1. جودة التسبيب (20 نقطة)
- هل الحيثيات واضحة ومرتبة؟
- هل يوجد ربط منطقي بين الوقائع والأسباب والمنطوق؟
- هل التعليل كافٍ ومقنع؟

### 2. الاستناد النظامي (15 نقطة)
- هل تمت الإشارة للمواد النظامية الصحيحة؟
- هل الاستدلال بالنصوص الشرعية والنظامية في محله؟
- هل توجد مراجع كافية؟

### 3. المنطق القانوني والاتساق (15 نقطة)
- هل يوجد تناقض بين أجزاء الحكم؟
- هل الاستنتاج يتبع المقدمات بشكل سليم؟
- هل التكييف القانوني صحيح؟

### 4. الأركان الشكلية (10 نقاط)
- البسملة، اسم المحكمة، رقم القضية، التاريخ الهجري
- بيانات الأطراف كاملة
- توقيع القاضي / رئيس الدائرة

### 5. ضمان حقوق الأطراف (15 نقطة)
- هل تم سماع جميع الأطراف؟
- هل ذُكرت طلبات ودفوع الأطراف؟
- هل تم الرد على كل دفع جوهري؟

### 6. الوضوح والدقة (10 نقاط)
- وضوح المنطوق وعدم الغموض
- دقة المصطلحات القانونية
- تحديد الحقوق والالتزامات بدقة

### 7. الاكتمال والشمولية (10 نقاط)
- معالجة جميع الطلبات المقدمة
- الرد على كل الدفوع
- عدم إغفال أي جانب جوهري

### 8. التناسب (5 نقاط)
- تناسب العقوبة/التعويض مع الضرر
- مراعاة الظروف المخففة أو المشددة

## التعليمات:
- قيّم كل معيار بالدرجة المستحقة مع تبرير
- اذكر نقاط القوة والضعف بوضوح
- قدم توصيات عملية للتحسين
- حدد المشاكل الجوهرية التي تؤثر على سلامة الحكم

أعد النتيجة بصيغة JSON:
{
  "criteria": [
    {
      "id": "معرف_المعيار",
      "name": "اسم المعيار",
      "score": الدرجة,
      "maxScore": الدرجة_القصوى,
      "analysis": "التحليل التفصيلي",
      "issues": ["المشاكل المكتشفة"],
      "strengths": ["نقاط القوة"]
    }
  ],
  "overallScore": المجموع,
  "overallPercentage": النسبة_المئوية,
  "grade": "التقدير",
  "criticalIssues": ["المشاكل الجوهرية"],
  "recommendations": ["التوصيات العملية"],
  "summary": "ملخص شامل للتقييم في فقرة"
}`

export async function POST(request: NextRequest) {
  try {
    const { text, caseType } = await request.json()

    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json(
        { error: 'يرجى إدخال نص الحكم القضائي (20 حرفاً على الأقل)' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        ai_enabled: false,
        message: 'التقييم بالذكاء الاصطناعي غير متاح. أضف ANTHROPIC_API_KEY لتفعيله. التقييم الأساسي يعمل بشكل طبيعي.',
      })
    }

    const client = new Anthropic({ apiKey })

    const userPrompt = `قيّم الحكم القضائي التالي تقييماً شاملاً${caseType ? ` (نوع القضية: ${caseType})` : ''}:

---
${text}
---

أعد التقييم بصيغة JSON فقط.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userPrompt }],
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
    console.error('Evaluate Ruling error:', error)
    return NextResponse.json(
      {
        ai_enabled: false,
        error: 'حدث خطأ في التقييم بالذكاء الاصطناعي',
        message: error instanceof Error ? error.message : 'خطأ غير معروف',
      },
      { status: 500 }
    )
  }
}
