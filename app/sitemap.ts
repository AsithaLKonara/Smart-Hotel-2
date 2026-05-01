import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smarthotel-demo.vercel.app'
  
  // Base routes
  const routes = [
    '',
    '/rooms',
    '/dining',
    '/spa',
    '/facilities',
    '/gallery',
    '/about',
    '/contact',
    '/booking',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // In a production environment with a DB, we would fetch dynamic room IDs here
  // const rooms = await prisma.room.findMany({ select: { id: true } })
  // const roomRoutes = rooms.map(room => ({ ... }))

  return [...routes]
}
