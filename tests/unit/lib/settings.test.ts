import { jest } from '@jest/globals'

describe('lib/settings', () => {
  let settingFindMany: jest.Mock
  let staffFindMany: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    settingFindMany = jest.fn()
    staffFindMany = jest.fn()

    jest.doMock('@/lib/db', () => ({
      __esModule: true,
      default: {
        setting: { findMany: settingFindMany },
        staff: { findMany: staffFindMany },
      },
      prisma: {
        setting: { findMany: settingFindMany },
        staff: { findMany: staffFindMany },
      },
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns cached settings map from prisma and caches subsequent calls', async () => {
    settingFindMany.mockResolvedValueOnce([
      { key: 'hotel_name', value: 'SmartHotel Elite' },
      { key: 'hotel_email', value: 'elite@smarthotel.com' },
    ])

    const { getHotelSettings } = await import('@/lib/settings')

    const first = await getHotelSettings()
    const second = await getHotelSettings()

    expect(settingFindMany).toHaveBeenCalledTimes(1)
    expect(first).toEqual({
      hotel_name: 'SmartHotel Elite',
      hotel_email: 'elite@smarthotel.com',
    })
    expect(second).toBe(first)
  })

  it('provides default contact info when settings missing and coerces coordinates', async () => {
    settingFindMany.mockResolvedValueOnce([
      { key: 'hotel_phone', value: '+94 11 555 1234' },
      { key: 'hotel_latitude', value: '6.9271' },
      { key: 'hotel_longitude', value: '79.8612' },
    ])

    const { getHotelContactInfo } = await import('@/lib/settings')

    const contact = await getHotelContactInfo()

    expect(contact).toMatchObject({
      name: 'SmartHotel Grand Palace',
      phone: '+94 11 555 1234',
      coordinates: { lat: 6.9271, lng: 79.8612 },
    })
  })

  it('returns about content with parsed milestones and staff list', async () => {
    const milestones = ['Milestone 1', 'Milestone 2']

    settingFindMany.mockResolvedValueOnce([
      { key: 'hotel_story', value: 'Tailored luxury since 1985.' },
      { key: 'hotel_founded', value: '1985' },
      { key: 'hotel_milestones', value: JSON.stringify(milestones) },
    ])

    staffFindMany.mockResolvedValueOnce([
      { id: 'staff-1', name: 'Alex', position: 'GM', hireDate: new Date('2000-01-01') },
    ])

    const { getHotelAboutContent } = await import('@/lib/settings')

    const about = await getHotelAboutContent()

    expect(settingFindMany).toHaveBeenCalledTimes(1)
    expect(staffFindMany).toHaveBeenCalledWith({
      orderBy: { hireDate: 'asc' },
      take: 6,
    })
    expect(about).toEqual({
      story: 'Tailored luxury since 1985.',
      founded: '1985',
      milestones,
      staff: [
        { id: 'staff-1', name: 'Alex', position: 'GM', hireDate: new Date('2000-01-01') },
      ],
    })
  })

  it('falls back to default milestones and warns on invalid JSON', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    settingFindMany.mockResolvedValueOnce([
      { key: 'hotel_story', value: 'Boutique heritage.' },
      { key: 'hotel_milestones', value: 'not-json' },
    ] as Array<{ key: string; value: string }>)
    staffFindMany.mockResolvedValueOnce([] as Array<{ id: string; name: string; position: string; hireDate: Date }>)

    const { getHotelAboutContent } = await import('@/lib/settings')

    const about = await getHotelAboutContent()

    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to parse hotel milestones from settings:',
      expect.any(SyntaxError),
    )
    expect(Array.isArray(about.milestones)).toBe(true)
    expect(about.milestones.length).toBeGreaterThan(0)

    warnSpy.mockRestore()
  })
})

