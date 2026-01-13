import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'المستشار القانوني | Legal Advisor Chat',
  description: 'دردشة ذكية للإجابة على استفساراتك القانونية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
