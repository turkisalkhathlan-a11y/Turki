#!/usr/bin/env python3
"""
سكربت جلب الأحكام المنشورة من البوابة القانونية - وزارة العدل السعودية
https://laws.moj.gov.sa/

يستخدم Playwright لتشغيل متصفح حقيقي ويصدّر النتائج إلى ملف وورد (.docx)
بشكل تدريجي (يحفظ كل مجموعة أحكام فور جلبها)
"""

import asyncio
import json
import os
import re
import sys
import time
from datetime import datetime

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("يرجى تثبيت playwright أولاً:")
    print("  pip install playwright")
    print("  playwright install chromium")
    sys.exit(1)

try:
    from docx import Document
    from docx.shared import Pt, Inches, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
except ImportError:
    print("يرجى تثبيت python-docx أولاً:")
    print("  pip install python-docx")
    sys.exit(1)


# ─── الإعدادات ───────────────────────────────────────────────────────────────

BASE_URL = "https://laws.moj.gov.sa"
LISTING_URL = f"{BASE_URL}/ar/JudicialDecisionsList"

# أنواع المحاكم المعروفة
COURT_TYPES = {
    0: "المحكمة التجارية",
    1: "المحكمة العامة",
    2: "المحكمة العمالية",
    3: "المحكمة الجزائية",
    4: "محكمة الأحوال الشخصية",
    5: "المحكمة الإدارية",
}

OUTPUT_DIR = "output"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "أحكام_البوابة_القانونية.docx")
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "progress.json")

# تأخير بين الطلبات (بالثواني) - للتعامل بلطف مع الموقع
REQUEST_DELAY = 2
PAGE_LOAD_TIMEOUT = 30000  # 30 ثانية

# عدد الصفحات الأقصى لكل نوع محكمة (0 = بلا حدود)
MAX_PAGES_PER_COURT = 0


# ─── مساعدات ─────────────────────────────────────────────────────────────────

def load_progress():
    """تحميل سجل التقدم السابق"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"scraped_urls": [], "last_court_type": 0, "last_page": 0, "total_decisions": 0}


def save_progress(progress):
    """حفظ سجل التقدم"""
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def create_document():
    """إنشاء ملف وورد جديد مع التنسيق"""
    doc = Document()

    # إعداد الاتجاه من اليمين لليسار
    style = doc.styles["Normal"]
    font = style.font
    font.name = "Traditional Arabic"
    font.size = Pt(14)
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    # العنوان الرئيسي
    title = doc.add_heading("الأحكام المنشورة - البوابة القانونية", level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    subtitle = doc.add_paragraph(f"وزارة العدل - المملكة العربية السعودية")
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER

    date_para = doc.add_paragraph(f"تاريخ الجلب: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("")  # سطر فارغ

    return doc


def load_or_create_document():
    """تحميل ملف وورد موجود أو إنشاء واحد جديد"""
    if os.path.exists(OUTPUT_FILE):
        return Document(OUTPUT_FILE)
    return create_document()


def add_decision_to_doc(doc, decision, index):
    """إضافة حكم واحد إلى ملف الوورد"""
    # عنوان الحكم
    heading = doc.add_heading(f"حكم رقم {index}", level=1)
    heading.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    # معلومات الحكم
    info_fields = [
        ("المحكمة", decision.get("court_name", "غير محدد")),
        ("رقم القضية", decision.get("case_number", "غير محدد")),
        ("التاريخ", decision.get("date", "غير محدد")),
        ("نوع القضية", decision.get("case_type", "غير محدد")),
        ("الرابط", decision.get("url", "")),
    ]

    for label, value in info_fields:
        if value:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            run_label = p.add_run(f"{label}: ")
            run_label.bold = True
            run_label.font.size = Pt(13)
            run_value = p.add_run(str(value))
            run_value.font.size = Pt(13)

    # ملخص الحكم
    if decision.get("summary"):
        doc.add_heading("ملخص الحكم", level=2).alignment = WD_ALIGN_PARAGRAPH.RIGHT
        summary_para = doc.add_paragraph(decision["summary"])
        summary_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    # نص الحكم الكامل
    if decision.get("full_text"):
        doc.add_heading("نص الحكم", level=2).alignment = WD_ALIGN_PARAGRAPH.RIGHT
        text_para = doc.add_paragraph(decision["full_text"])
        text_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    # خط فاصل
    doc.add_paragraph("─" * 60)


# ─── السكربت الرئيسي ──────────────────────────────────────────────────────────

async def scrape_decision_page(page, url):
    """جلب تفاصيل حكم واحد"""
    try:
        await page.goto(url, wait_until="networkidle", timeout=PAGE_LOAD_TIMEOUT)
        await page.wait_for_timeout(2000)

        # محاولة جلب المحتوى الرئيسي
        decision = {"url": url}

        # جلب عنوان الصفحة
        title_el = await page.query_selector("h1, .page-title, .decision-title, [class*='title']")
        if title_el:
            decision["court_name"] = (await title_el.inner_text()).strip()

        # جلب رقم القضية
        case_num_el = await page.query_selector("[class*='case-number'], [class*='caseNumber']")
        if case_num_el:
            decision["case_number"] = (await case_num_el.inner_text()).strip()

        # محاولة جلب كل النصوص المهمة من الصفحة
        # نبحث عن المحتوى الرئيسي
        content_selectors = [
            ".decision-content",
            ".judgment-text",
            ".content-area",
            "#MainContent",
            "main",
            ".main-content",
            "[class*='decision']",
            "[class*='judgment']",
            "[class*='content']",
            "article",
        ]

        full_text = ""
        for selector in content_selectors:
            el = await page.query_selector(selector)
            if el:
                text = (await el.inner_text()).strip()
                if len(text) > len(full_text):
                    full_text = text

        # إذا لم نجد محتوى بالمحددات، نجلب كل النص المرئي
        if not full_text:
            full_text = await page.inner_text("body")

        decision["full_text"] = full_text

        # محاولة استخراج معلومات إضافية من النص
        # البحث عن رقم القضية في النص
        case_match = re.search(r'(\d{10,})', full_text)
        if case_match and "case_number" not in decision:
            decision["case_number"] = case_match.group(1)

        # البحث عن التاريخ
        date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', full_text)
        if date_match:
            decision["date"] = date_match.group(1)

        return decision

    except Exception as e:
        print(f"  ✗ خطأ في جلب الحكم: {e}")
        return None


async def scrape_listing_page(page, court_type, page_num=1):
    """جلب قائمة الأحكام من صفحة واحدة"""
    url = f"{LISTING_URL}/{court_type}"
    if page_num > 1:
        url = f"{url}?page={page_num}"

    print(f"\n📄 جلب الصفحة {page_num} - {COURT_TYPES.get(court_type, f'نوع {court_type}')}...")
    print(f"   الرابط: {url}")

    try:
        await page.goto(url, wait_until="networkidle", timeout=PAGE_LOAD_TIMEOUT)
        await page.wait_for_timeout(3000)

        # جلب روابط الأحكام
        links = []

        # البحث عن روابط الأحكام بعدة أنماط
        link_selectors = [
            f"a[href*='/JudicialDecisionsList/{court_type}/']",
            "a[href*='/JudicialDecisionsList/']",
            ".decision-link a",
            ".card a",
            "table a",
            ".list-group a",
        ]

        for selector in link_selectors:
            elements = await page.query_selector_all(selector)
            for el in elements:
                href = await el.get_attribute("href")
                if href and "/JudicialDecisionsList/" in href:
                    # تحويل الرابط النسبي إلى مطلق
                    if href.startswith("/"):
                        href = f"{BASE_URL}{href}"
                    text = (await el.inner_text()).strip()
                    if href not in [l["url"] for l in links]:
                        links.append({"url": href, "title": text})

        # التحقق من وجود صفحة تالية
        has_next = False
        next_selectors = [
            "a[rel='next']",
            ".pagination .next a",
            "a[aria-label='Next']",
            "[class*='next'] a",
            ".pagination li:last-child a",
        ]
        for selector in next_selectors:
            next_el = await page.query_selector(selector)
            if next_el:
                has_next = True
                break

        # إذا لم نجد زر "التالي" نتحقق من وجود أرقام صفحات
        if not has_next:
            page_links = await page.query_selector_all(".pagination a, [class*='pager'] a")
            for pl in page_links:
                text = (await pl.inner_text()).strip()
                if text.isdigit() and int(text) > page_num:
                    has_next = True
                    break

        print(f"   ✓ تم العثور على {len(links)} حكم في هذه الصفحة")
        return links, has_next

    except Exception as e:
        print(f"   ✗ خطأ في جلب الصفحة: {e}")
        return [], False


async def try_api_approach(page):
    """محاولة اكتشاف API داخلي للموقع"""
    print("\n🔍 محاولة اكتشاف API داخلي...")

    api_endpoints = []

    # التقاط طلبات الشبكة
    captured_requests = []

    def on_request(request):
        url = request.url
        if "api" in url.lower() or "judicial" in url.lower():
            captured_requests.append({
                "url": url,
                "method": request.method,
                "headers": dict(request.headers),
            })

    page.on("request", on_request)

    try:
        await page.goto(f"{LISTING_URL}/0", wait_until="networkidle", timeout=PAGE_LOAD_TIMEOUT)
        await page.wait_for_timeout(5000)

        if captured_requests:
            print(f"   ✓ تم اكتشاف {len(captured_requests)} طلب API:")
            for req in captured_requests:
                print(f"     {req['method']} {req['url']}")
                api_endpoints.append(req)

    except Exception as e:
        print(f"   ✗ خطأ: {e}")

    page.remove_listener("request", on_request)
    return api_endpoints


async def main():
    """البرنامج الرئيسي"""
    print("=" * 60)
    print("  سكربت جلب الأحكام المنشورة - البوابة القانونية")
    print("  وزارة العدل - المملكة العربية السعودية")
    print("  https://laws.moj.gov.sa/")
    print("=" * 60)

    # إنشاء مجلد الإخراج
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # تحميل سجل التقدم
    progress = load_progress()
    scraped_urls = set(progress.get("scraped_urls", []))
    total_decisions = progress.get("total_decisions", 0)
    start_court = progress.get("last_court_type", 0)
    start_page = progress.get("last_page", 0)

    if scraped_urls:
        print(f"\n📋 استئناف من آخر نقطة: {len(scraped_urls)} حكم تم جلبها سابقاً")

    # تحميل أو إنشاء ملف الوورد
    doc = load_or_create_document()

    async with async_playwright() as p:
        print("\n🚀 تشغيل المتصفح...")
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )

        context = await browser.new_context(
            locale="ar-SA",
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )

        page = await context.new_page()

        # محاولة اكتشاف API أولاً
        api_endpoints = await try_api_approach(page)

        # جلب الأحكام لكل نوع محكمة
        for court_type in sorted(COURT_TYPES.keys()):
            if court_type < start_court:
                continue

            court_name = COURT_TYPES[court_type]
            print(f"\n{'='*60}")
            print(f"📁 {court_name} (نوع {court_type})")
            print(f"{'='*60}")

            page_num = start_page if court_type == start_court else 1
            consecutive_empty = 0

            while True:
                if MAX_PAGES_PER_COURT > 0 and page_num > MAX_PAGES_PER_COURT:
                    print(f"\n   ⏹ تم الوصول للحد الأقصى ({MAX_PAGES_PER_COURT} صفحة)")
                    break

                # جلب قائمة الأحكام
                links, has_next = await scrape_listing_page(page, court_type, page_num)

                if not links:
                    consecutive_empty += 1
                    if consecutive_empty >= 3:
                        print(f"   ⏹ لا توجد أحكام أخرى (3 صفحات فارغة متتالية)")
                        break
                    page_num += 1
                    continue

                consecutive_empty = 0

                # جلب تفاصيل كل حكم
                new_decisions = 0
                for i, link in enumerate(links):
                    if link["url"] in scraped_urls:
                        print(f"   ⏭ تم جلبه سابقاً: {link['title'][:50]}")
                        continue

                    print(f"\n   📥 جلب الحكم {i+1}/{len(links)}: {link['title'][:50]}...")
                    await asyncio.sleep(REQUEST_DELAY)

                    decision = await scrape_decision_page(page, link["url"])
                    if decision:
                        total_decisions += 1
                        new_decisions += 1
                        decision["court_name"] = decision.get("court_name", court_name)

                        # إضافة إلى ملف الوورد
                        add_decision_to_doc(doc, decision, total_decisions)

                        # تحديث سجل التقدم
                        scraped_urls.add(link["url"])
                        progress["scraped_urls"] = list(scraped_urls)
                        progress["last_court_type"] = court_type
                        progress["last_page"] = page_num
                        progress["total_decisions"] = total_decisions

                        # حفظ تدريجي كل 5 أحكام
                        if new_decisions % 5 == 0:
                            print(f"\n   💾 حفظ تدريجي... ({total_decisions} حكم حتى الآن)")
                            doc.save(OUTPUT_FILE)
                            save_progress(progress)

                # حفظ بعد كل صفحة
                if new_decisions > 0:
                    print(f"\n   💾 حفظ الصفحة... ({total_decisions} حكم حتى الآن)")
                    doc.save(OUTPUT_FILE)
                    save_progress(progress)

                if not has_next:
                    # نجرب الصفحة التالية على أي حال
                    page_num += 1
                else:
                    page_num += 1

            # إعادة تعيين صفحة البدء بعد أول نوع محكمة
            start_page = 1

        # حفظ نهائي
        doc.save(OUTPUT_FILE)
        save_progress(progress)

        await browser.close()

    print(f"\n{'='*60}")
    print(f"✅ تم الانتهاء!")
    print(f"   إجمالي الأحكام: {total_decisions}")
    print(f"   الملف: {os.path.abspath(OUTPUT_FILE)}")
    print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())
