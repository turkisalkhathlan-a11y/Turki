import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'أحكام التعويض ضد النيابة العامة | ديوان المظالم',
  description: 'محرك بحث ذكي في الأحكام والسوابق القضائية الصادرة بالتعويض عن السجن والتوقيف ضد النيابة العامة - مبني على بيانات ديوان المظالم',
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
