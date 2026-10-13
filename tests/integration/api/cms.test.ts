import { CmsService } from '@/lib/services/cms-service'
import prisma from '@/lib/db'
import { GET as getCmsProperties } from '@/app/api/cms/properties/route'
import { GET as getCmsGalleries } from '@/app/api/cms/gallery/route'
import { GET as getCmsExperiences } from '@/app/api/cms/experiences/route'
import { GET as getCmsFacilities } from '@/app/api/cms/facilities/route'
import { NextRequest } from 'next/server'

describe('Multi-Property CMS API and Service Suite', () => {
  beforeAll(async () => {
    await CmsService.ensureDefaultCmsContent()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('CmsService retrieves active properties with coordinates and counts', async () => {
    const properties = await CmsService.getProperties({ activeOnly: true })
    expect(Array.isArray(properties)).toBe(true)
    expect(properties.length).toBeGreaterThan(0)
    
    const first = properties[0]
    expect(first.id).toBeDefined()
    expect(first.name).toBeDefined()
    expect(first.latitude).toBeDefined()
    expect(first.longitude).toBeDefined()
    expect(first._count).toHaveProperty('experiences')
    expect(first._count).toHaveProperty('resortFacilities')
    expect(first._count).toHaveProperty('galleries')
  })

  test('Public /api/cms/properties returns 200 with formatted property list', async () => {
    const req = new NextRequest('http://localhost:3000/api/cms/properties')
    const res = await getCmsProperties(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('properties')
    expect(Array.isArray(data.properties)).toBe(true)
    expect(data.properties.length).toBeGreaterThan(0)
    expect(data.properties[0]).toHaveProperty('latitude')
    expect(data.properties[0]).toHaveProperty('longitude')
  })

  test('Public /api/cms/experiences returns 200 with signature experiences', async () => {
    const req = new NextRequest('http://localhost:3000/api/cms/experiences')
    const res = await getCmsExperiences(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBe(true)
    expect(data.items.length).toBeGreaterThan(0)
    expect(data.items[0]).toHaveProperty('title')
    expect(data.items[0]).toHaveProperty('category')
  })

  test('Public /api/cms/facilities returns 200 with resort facilities', async () => {
    const req = new NextRequest('http://localhost:3000/api/cms/facilities')
    const res = await getCmsFacilities(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBe(true)
    expect(data.items.length).toBeGreaterThan(0)
    expect(data.items[0]).toHaveProperty('operatingHours')
  })

  test('Public /api/cms/gallery returns 200 with gallery items', async () => {
    const req = new NextRequest('http://localhost:3000/api/cms/gallery')
    const res = await getCmsGalleries(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBe(true)
    expect(data.items.length).toBeGreaterThan(0)
  })

  test('CRUD experience lifecycle via CmsService', async () => {
    const properties = await CmsService.getProperties()
    const targetProperty = properties[0]

    // Create
    const created = await CmsService.createExperience({
      title: 'Helicopter Alpine Tour',
      subtitle: 'Summit Flight',
      description: 'Exclusive private helicopter excursion across alpine peaks.',
      imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&q=80&w=1200',
      icon: '🚁',
      category: 'ADVENTURE',
      duration: '45 Mins',
      price: 1200,
      order: 10,
      active: true,
      propertyId: targetProperty.id,
    })
    expect(created.id).toBeDefined()
    expect(created.title).toBe('Helicopter Alpine Tour')

    // Update
    const updated = await CmsService.updateExperience(created.id, {
      price: 1350,
      duration: '60 Mins',
    })
    expect(updated.price).toBe(1350)
    expect(updated.duration).toBe('60 Mins')

    // Delete
    const deleted = await CmsService.deleteExperience(created.id)
    expect(deleted.id).toBe(created.id)
  })
})
