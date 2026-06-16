import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Luxury Rooms & Suites | SmartHotel OS',
  description: 'Explore our curated selection of luxury 5-star rooms and suites, designed with timeless elegance and modern amenities for the ultimate comfort.',
}

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
