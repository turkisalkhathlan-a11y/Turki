# أداة سحب الأحكام القضائية

سكربت Node.js لسحب الأحكام القضائية من البوابة القانونية لوزارة العدل السعودية:
<https://laws.moj.gov.sa/ar/JudicialDecisionsList/1>

يقوم السكربت بـ:

1. المرور على صفحات القائمة واحدة تلو الأخرى.
2. استخراج روابط صفحات تفاصيل كل حكم.
3. فتح كل حكم وتحليل حقوله (رقم القضية، المحكمة، التاريخ الهجري/الميلادي، القاضي/الدائرة، الموضوع، الملخص، المنطوق، المواد النظامية، الكلمات المفتاحية، حالة الاستئناف، النص الكامل).
4. حفظ النتائج في ملف `JSON` أو ملف `TypeScript` متوافق مع نوع `JudicialDecision` في `src/types/legal.ts`.

## التثبيت

```bash
npm install
```

تمت إضافة `cheerio` كاعتماد تطويري في `package.json`.

## الاستخدام السريع

```bash
# أول 3 صفحات فقط، إخراج JSON افتراضي
npm run scrape:decisions -- --start=1 --end=3

# حفظ كـ TypeScript جاهز للاستيراد داخل التطبيق
npm run scrape:decisions -- --max=100 --format=ts --out=src/data/scrapedDecisions.ts

# تشغيل هادئ مع تأخير أطول لاحترام سرعة الخادم
npm run scrape:decisions -- --start=1 --end=20 --delay=2000 --concurrency=1
```

## جميع الخيارات

| الخيار | الافتراضي | الوصف |
|---|---|---|
| `--start=<n>` | `1` | رقم الصفحة الأولى |
| `--end=<n>` | — | رقم الصفحة الأخيرة (بدون = استمرار حتى صفحة فارغة) |
| `--max=<n>` | — | الحد الأقصى لعدد الأحكام المسحوبة |
| `--delay=<ms>` | `1200` | التأخير بين الطلبات بالمللي ثانية |
| `--concurrency=<n>` | `2` | طلبات التفاصيل المتوازية |
| `--out=<path>` | `scraped-data/judicial-decisions.json` | مسار الإخراج |
| `--format=<json\|ts>` | `json` | صيغة الإخراج |
| `--retries=<n>` | `3` | عدد محاولات إعادة الطلب |
| `--user-agent=<s>` | Chrome UA | تخصيص User-Agent |
| `--verbose` | — | تفاصيل إضافية في السجل |
| `--dry-run` | — | دون كتابة أي ملف |

## صيغة الإخراج

كل حكم كائن مطابق لـ `JudicialDecision`:

```ts
{
  id: string              // MOJ-<id>
  caseNumber: string
  courtType: string       // "تجارية" | "عمالية" | ...
  subject: string
  summary: string
  fullText: string
  date: string            // ISO أو النص كما يظهر
  hijriDate: string
  judge: string           // اسم الدائرة/القاضي
  keywords: string[]
  category: string
  ruling: string
  legalArticles: string[]
  appealStatus: string
  source: string          // رابط صفحة الحكم الأصلية
}
```

## تعديل المحدّدات (Selectors)

إذا تغيّر هيكل الصفحة ولم تُستَخرج الحقول كما يجب، يمكن تعديل `SELECTORS` و`META_LABEL_MAP` مباشرة في أعلى الملف `scripts/scrape-judicial-decisions.mjs`:

- `SELECTORS.list.itemContainer`: المحدد الذي يطابق روابط الأحكام في صفحة القائمة.
- `SELECTORS.list.anchorHrefPattern`: نمط احتياطي لاكتشاف الروابط.
- `SELECTORS.detail.*`: محدِّدات الموضوع والملخص والنص الكامل والمنطوق.
- `META_LABEL_MAP`: خريطة الأسماء العربية لحقول البيانات (مثلاً "رقم القضية" → `caseNumber`).

يتضمن السكربت عدة محدِّدات احتياطية، وإذا لم يجد النص الكامل يسحب أكبر كتلة نصية في الصفحة.

## نصائح

- لا تخفض `--delay` كثيراً لتجنب الحظر.
- ابدأ بـ `--dry-run --start=1 --end=1 --verbose` للتأكد من صحة التحليل قبل السحب الكامل.
- يمكن دمج المخرجات مع `src/data/judicialDecisions.ts` يدوياً بعد المراجعة.
- يحترم السكربت الأخلاقيات التقنية: User-Agent واضح، تأخير بين الطلبات، توازٍ محدود.

## الاستخدام داخل التطبيق

عند توليد `--format=ts`:

```ts
import { scrapedDecisions } from '@/data/scrapedDecisions'
import { judicialDecisions } from '@/data/judicialDecisions'

export const allDecisions = [...judicialDecisions, ...scrapedDecisions]
```
