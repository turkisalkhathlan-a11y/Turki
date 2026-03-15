import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center max-w-3xl">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-amber-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            المفتش القضائي
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            اكتشف أخطاء الصكوك القضائية وفقاً لمحددات مضبوطة
          </p>
        </div>

        <Link
          href="/validator"
          className="inline-flex items-center justify-center gap-3 bg-amber-600 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-amber-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          ابدأ فحص الصك القضائي
        </Link>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">9 محددات فحص</h3>
            <p className="text-gray-600 text-sm">
              فحص شامل للأركان الشكلية والتسبيب والمنطوق والمصطلحات والمراجع النظامية
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">ذكاء اصطناعي</h3>
            <p className="text-gray-600 text-sm">
              تحليل معمّق بنموذج Claude لاكتشاف الأخطاء السياقية والتناقضات
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">تقرير تفصيلي</h3>
            <p className="text-gray-600 text-sm">
              تقرير شامل بدرجة تقييم وتوصيات قابل للطباعة
            </p>
          </div>
        </div>

        <div className="mt-12 p-6 bg-amber-50 rounded-2xl border border-amber-200 text-right">
          <h3 className="font-bold text-amber-800 mb-3">محددات الفحص المضبوطة</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'الأركان الشكلية',
              'التاريخ الهجري',
              'رقم القضية',
              'بيانات الأطراف',
              'المصطلحات القانونية',
              'المراجع النظامية',
              'وضوح المنطوق',
              'اللغة الرسمية',
              'قابلية الاستئناف',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-amber-700">
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
