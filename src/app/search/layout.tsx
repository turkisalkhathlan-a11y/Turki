import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'محرك البحث القانوني الذكي | البوابة القانونية',
  description: 'محرك بحث ذكي في الأحكام القضائية الصادرة من المحاكم السعودية - مبني على بيانات البوابة القانونية لوزارة العدل',
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
