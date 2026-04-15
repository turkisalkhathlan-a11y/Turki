#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * scrape-judicial-decisions.mjs
 *
 * أداة لسحب الأحكام القضائية من البوابة القانونية لوزارة العدل السعودية
 *   https://laws.moj.gov.sa/ar/JudicialDecisionsList/{page}
 *
 * الاستخدام:
 *   node scripts/scrape-judicial-decisions.mjs [options]
 *
 * الخيارات:
 *   --start=<n>       رقم الصفحة الأولى (افتراضي: 1)
 *   --end=<n>         رقم الصفحة الأخيرة (افتراضي: متابعة حتى صفحة فارغة)
 *   --max=<n>         الحد الأقصى لعدد الأحكام المسحوبة (افتراضي: بدون حد)
 *   --delay=<ms>      التأخير بين الطلبات بالمللي ثانية (افتراضي: 1200)
 *   --concurrency=<n> عدد طلبات التفاصيل المتوازية (افتراضي: 2)
 *   --out=<path>      مسار ملف الإخراج JSON (افتراضي: scraped-data/judicial-decisions.json)
 *   --format=<fmt>    json | ts  (افتراضي: json). ts يولّد ملف TypeScript متوافقًا مع src/data
 *   --retries=<n>     عدد محاولات إعادة الطلب عند الفشل (افتراضي: 3)
 *   --user-agent=<s>  تخصيص User-Agent
 *   --verbose         طباعة تفاصيل إضافية
 *   --dry-run         المرور دون حفظ الملف
 *
 * مثال:
 *   node scripts/scrape-judicial-decisions.mjs --start=1 --end=5 --out=scraped-data/page-1-5.json
 *   node scripts/scrape-judicial-decisions.mjs --max=50 --format=ts --out=src/data/scrapedDecisions.ts
 *
 * ملاحظات:
 * - السكربت يحترم سرعة الموقع بتأخير بين الطلبات.
 * - المحدِّدات (selectors) مُجمَّعة في SELECTORS في أعلى الملف لسهولة تعديلها
 *   إذا تغيّر هيكل الصفحة.
 * - الحقول الناتجة تطابق نوع JudicialDecision في src/types/legal.ts.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import process from 'node:process'

import * as cheerio from 'cheerio'

// --------------------------------------------------------------------------
// الإعدادات والمحدّدات (قابلة للتعديل إذا تغيّر هيكل صفحة الموقع)
// --------------------------------------------------------------------------

const BASE_URL = 'https://laws.moj.gov.sa'
const LIST_PATH = '/ar/JudicialDecisionsList' // /{page}
const DEFAULT_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36'

/**
 * CSS selectors / field extractors. Tweak هذه القيم إذا تغيّر الـ HTML على الموقع.
 * كل selector عبارة عن دالة cheerio callback تُعيد نص الحقل أو null.
 */
const SELECTORS = {
  // روابط الأحكام في صفحة القائمة
  list: {
    // Cards / rows that wrap each decision link
    itemContainer: 'a[href*="JudicialDecision"], .decision-card a, .card a',
    // Fallback: any anchor that looks like a details page
    anchorHrefPattern: /JudicialDecision(Details|\/Details|\/[0-9]+)/i,
  },
  // صفحة تفاصيل الحكم
  detail: {
    subject: [
      'h1',
      'h2.decision-title',
      '.title',
      '.page-title',
      '.decision-subject',
    ],
    // أزواج مفتاح/قيمة في الجدول الجانبي (مثال: "رقم القضية"، "المحكمة"، "التاريخ")
    metaRows: [
      'table tr',
      '.decision-meta li',
      '.meta-row',
      'dl > *',
    ],
    // نص الحكم الكامل
    fullText: [
      '.decision-body',
      '.decision-content',
      '.full-text',
      'article',
      '.content',
    ],
    // ملخص
    summary: [
      '.decision-summary',
      '.summary',
      '.excerpt',
    ],
    // منطوق الحكم
    ruling: [
      '.ruling',
      '.verdict',
      '.decision-verdict',
    ],
  },
}

/**
 * خريطة أسماء الحقول العربية الظاهرة في الصفحة إلى مفاتيحنا الإنجليزية.
 */
const META_LABEL_MAP = {
  'رقم القضية': 'caseNumber',
  'رقم الدعوى': 'caseNumber',
  'رقم الحكم': 'caseNumber',
  'نوع المحكمة': 'courtType',
  'المحكمة': 'courtType',
  'نوع الدعوى': 'category',
  'تصنيف القضية': 'category',
  'التصنيف': 'category',
  'الموضوع': 'subject',
  'موضوع الدعوى': 'subject',
  'تاريخ الحكم': 'date',
  'تاريخ الجلسة': 'date',
  'التاريخ': 'date',
  'التاريخ الهجري': 'hijriDate',
  'تاريخ الحكم الهجري': 'hijriDate',
  'الدائرة': 'judge',
  'اسم القاضي': 'judge',
  'القاضي': 'judge',
  'الكلمات المفتاحية': 'keywords',
  'الكلمات الدلالية': 'keywords',
  'المواد النظامية': 'legalArticles',
  'الأنظمة المستند إليها': 'legalArticles',
  'حالة الاستئناف': 'appealStatus',
  'حالة الحكم': 'appealStatus',
  'الاستئناف': 'appealStatus',
  'المنطوق': 'ruling',
  'منطوق الحكم': 'ruling',
}

// --------------------------------------------------------------------------
// CLI args
// --------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {
    start: 1,
    end: null,
    max: null,
    delay: 1200,
    concurrency: 2,
    out: 'scraped-data/judicial-decisions.json',
    format: 'json',
    retries: 3,
    userAgent: DEFAULT_UA,
    verbose: false,
    dryRun: false,
  }
  for (const raw of argv.slice(2)) {
    if (raw === '--verbose' || raw === '-v') opts.verbose = true
    else if (raw === '--dry-run') opts.dryRun = true
    else if (raw === '--help' || raw === '-h') {
      printHelp()
      process.exit(0)
    } else {
      const [k, ...rest] = raw.replace(/^--/, '').split('=')
      const v = rest.join('=')
      switch (k) {
        case 'start':
          opts.start = parseInt(v, 10)
          break
        case 'end':
          opts.end = parseInt(v, 10)
          break
        case 'max':
          opts.max = parseInt(v, 10)
          break
        case 'delay':
          opts.delay = parseInt(v, 10)
          break
        case 'concurrency':
          opts.concurrency = Math.max(1, parseInt(v, 10))
          break
        case 'out':
          opts.out = v
          break
        case 'format':
          opts.format = v
          break
        case 'retries':
          opts.retries = parseInt(v, 10)
          break
        case 'user-agent':
          opts.userAgent = v
          break
        default:
          console.warn(`⚠️  خيار غير معروف: --${k}`)
      }
    }
  }
  return opts
}

function printHelp() {
  console.log(`\nاستخدام: node scripts/scrape-judicial-decisions.mjs [options]\n
--start=<n>        رقم الصفحة الأولى (1)
--end=<n>          رقم الصفحة الأخيرة
--max=<n>          الحد الأقصى لعدد الأحكام
--delay=<ms>       التأخير بين الطلبات (1200)
--concurrency=<n>  طلبات التفاصيل المتوازية (2)
--out=<path>       مسار ملف الإخراج
--format=<fmt>     json | ts
--retries=<n>      محاولات إعادة المحاولة (3)
--user-agent=<s>   تخصيص User-Agent
--verbose          طباعة تفاصيل إضافية
--dry-run          بدون حفظ الملف
`)
}

// --------------------------------------------------------------------------
// HTTP helpers
// --------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function httpGet(url, { userAgent, retries, verbose }) {
  let lastError
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ar,en;q=0.7',
        },
        redirect: 'follow',
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`)
      }
      return await res.text()
    } catch (err) {
      lastError = err
      if (verbose) {
        console.warn(`محاولة ${attempt}/${retries} فشلت لـ ${url}: ${err.message}`)
      }
      if (attempt < retries) {
        await sleep(1000 * attempt) // backoff خطي بسيط
      }
    }
  }
  throw lastError
}

// --------------------------------------------------------------------------
// Parsing
// --------------------------------------------------------------------------

function absolutize(href) {
  if (!href) return null
  if (href.startsWith('http://') || href.startsWith('https://')) return href
  if (href.startsWith('//')) return 'https:' + href
  if (href.startsWith('/')) return BASE_URL + href
  return BASE_URL + '/' + href
}

function firstText($, selectors) {
  for (const sel of selectors) {
    const el = $(sel).first()
    if (el && el.length) {
      const txt = normalize(el.text())
      if (txt) return txt
    }
  }
  return ''
}

function normalize(str) {
  return (str || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * استخراج روابط الأحكام من صفحة القائمة.
 */
function extractDecisionLinks(html) {
  const $ = cheerio.load(html)
  const urls = new Set()

  // محاولة selectors المحددة أولاً
  $(SELECTORS.list.itemContainer).each((_, el) => {
    const href = $(el).attr('href')
    if (href) {
      const abs = absolutize(href)
      if (abs) urls.add(abs)
    }
  })

  // بديل: كل رابط يتطابق مع نمط صفحات التفاصيل
  if (urls.size === 0) {
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || ''
      if (SELECTORS.list.anchorHrefPattern.test(href)) {
        const abs = absolutize(href)
        if (abs) urls.add(abs)
      }
    })
  }

  return [...urls]
}

/**
 * استخراج حقول الحكم من صفحة التفاصيل.
 * نعتمد على:
 *   1) أزواج مفتاح/قيمة في جداول/قوائم.
 *   2) selectors محددة مسبقاً للملخص والنص الكامل والمنطوق.
 */
function parseDecisionDetail(html, sourceUrl) {
  const $ = cheerio.load(html)
  const fields = {
    id: '',
    caseNumber: '',
    courtType: '',
    subject: '',
    summary: '',
    fullText: '',
    date: '',
    hijriDate: '',
    judge: '',
    keywords: [],
    category: '',
    ruling: '',
    legalArticles: [],
    appealStatus: '',
    source: sourceUrl,
  }

  // معرف من الرابط (آخر رقم في المسار)
  const idMatch = sourceUrl.match(/(\d+)(?:[/?#]|$)/)
  if (idMatch) fields.id = `MOJ-${idMatch[1]}`

  // Subject
  fields.subject = firstText($, SELECTORS.detail.subject)

  // Meta rows: جدول مفتاح/قيمة
  for (const sel of SELECTORS.detail.metaRows) {
    $(sel).each((_, el) => {
      const $el = $(el)
      // صفوف جدول <tr><th>..</th><td>..</td></tr>
      const th = $el.find('th').first().text()
      const td = $el.find('td').first().text()
      if (th && td) {
        assignMeta(fields, th, td)
        return
      }
      // <dt> / <dd>
      if ($el.is('dt')) {
        const dd = $el.next('dd').text()
        assignMeta(fields, $el.text(), dd)
        return
      }
      // صيغة "المفتاح: القيمة" داخل عنصر واحد
      const raw = $el.text()
      if (raw && raw.includes(':')) {
        const [label, ...v] = raw.split(':')
        assignMeta(fields, label, v.join(':'))
      }
    })
  }

  // Summary / Full Text / Ruling
  if (!fields.summary) fields.summary = firstText($, SELECTORS.detail.summary)
  if (!fields.fullText) fields.fullText = firstText($, SELECTORS.detail.fullText)
  if (!fields.ruling) fields.ruling = firstText($, SELECTORS.detail.ruling)

  // Fallback: إذا لم نجد نصاً كاملاً، نأخذ أكبر كتلة نصية في الصفحة
  if (!fields.fullText) {
    let best = ''
    $('div, section, article').each((_, el) => {
      const t = normalize($(el).text())
      if (t.length > best.length) best = t
    })
    fields.fullText = best.slice(0, 20000)
  }

  // الكلمات المفتاحية من وسوم إن وُجدت
  if (fields.keywords.length === 0) {
    $('.tags a, .keywords a, .chip, .badge').each((_, el) => {
      const t = normalize($(el).text())
      if (t) fields.keywords.push(t)
    })
  }

  return fields
}

function assignMeta(fields, labelRaw, valueRaw) {
  const label = normalize(labelRaw).replace(/[:：]\s*$/, '')
  const value = normalize(valueRaw)
  if (!label || !value) return
  const key = META_LABEL_MAP[label]
  if (!key) return
  if (key === 'keywords' || key === 'legalArticles') {
    fields[key] = value
      .split(/[،,;؛|\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  } else {
    fields[key] = value
  }
}

// --------------------------------------------------------------------------
// Concurrency helper
// --------------------------------------------------------------------------

async function mapWithLimit(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      results[i] = await worker(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

// --------------------------------------------------------------------------
// Output writers
// --------------------------------------------------------------------------

async function writeJson(outPath, decisions) {
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(decisions, null, 2), 'utf8')
}

async function writeTs(outPath, decisions) {
  const header = `import { JudicialDecision } from '@/types/legal'\n\n// تم توليد هذا الملف آلياً بواسطة scripts/scrape-judicial-decisions.mjs\n// المصدر: https://laws.moj.gov.sa/ar/JudicialDecisionsList\n\nexport const scrapedDecisions: JudicialDecision[] = `
  const body = JSON.stringify(decisions, null, 2)
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, header + body + '\n', 'utf8')
}

// --------------------------------------------------------------------------
// Main flow
// --------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv)
  console.log('⚙️  إعدادات السحب:', {
    start: opts.start,
    end: opts.end,
    max: opts.max,
    delay: opts.delay,
    concurrency: opts.concurrency,
    out: opts.out,
    format: opts.format,
  })

  // 1) جمع روابط الأحكام من صفحات القائمة
  const allLinks = []
  let page = opts.start
  while (true) {
    if (opts.end !== null && page > opts.end) break
    const listUrl = `${BASE_URL}${LIST_PATH}/${page}`
    console.log(`📄 تحميل صفحة القائمة ${page} - ${listUrl}`)
    let html
    try {
      html = await httpGet(listUrl, opts)
    } catch (err) {
      console.error(`❌ فشل تحميل صفحة ${page}: ${err.message}`)
      break
    }
    const links = extractDecisionLinks(html)
    if (opts.verbose) console.log(`   تم العثور على ${links.length} رابطاً`)
    if (links.length === 0) {
      console.log('⏹️  لم يتم العثور على روابط إضافية، إيقاف الترقيم.')
      break
    }
    for (const l of links) {
      if (!allLinks.includes(l)) allLinks.push(l)
      if (opts.max !== null && allLinks.length >= opts.max) break
    }
    if (opts.max !== null && allLinks.length >= opts.max) break
    page += 1
    await sleep(opts.delay)
  }

  console.log(`🔗 إجمالي روابط الأحكام التي سيتم معالجتها: ${allLinks.length}`)
  if (allLinks.length === 0) {
    console.log('لا توجد روابط. قد تحتاج إلى تعديل SELECTORS.list في السكربت.')
    process.exitCode = 1
    return
  }

  // 2) جلب تفاصيل كل حكم مع تحديد التوازي
  const decisions = []
  let processed = 0
  await mapWithLimit(allLinks, opts.concurrency, async (url) => {
    try {
      await sleep(opts.delay / opts.concurrency)
      const html = await httpGet(url, opts)
      const decision = parseDecisionDetail(html, url)
      decisions.push(decision)
      processed += 1
      if (processed % 10 === 0 || opts.verbose) {
        console.log(`✅ [${processed}/${allLinks.length}] ${url}`)
      }
    } catch (err) {
      console.error(`❌ فشل في ${url}: ${err.message}`)
    }
  })

  // ترتيب حسب التاريخ تنازلياً إن أمكن
  decisions.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  console.log(`📦 تم جمع ${decisions.length} حكماً`)

  if (opts.dryRun) {
    console.log('🚫 dry-run: لم يتم حفظ أي ملف. أول حكم:')
    console.log(JSON.stringify(decisions[0], null, 2))
    return
  }

  const outPath = resolve(process.cwd(), opts.out)
  if (opts.format === 'ts') {
    await writeTs(outPath, decisions)
  } else {
    await writeJson(outPath, decisions)
  }
  console.log(`💾 تم الحفظ في ${outPath}`)
}

// Only run when invoked directly
const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : ''
if (entry && import.meta.url === entry) {
  main().catch((err) => {
    console.error('💥 خطأ غير متوقع:', err)
    process.exit(1)
  })
}

export {
  parseArgs,
  extractDecisionLinks,
  parseDecisionDetail,
  SELECTORS,
  META_LABEL_MAP,
}
