import { prisma } from '@/lib/db'

export interface AssignFloatingShiftInput {
  employeeId: string
  targetPropertyId: string
  startTime: Date | string
  endTime: Date | string
  role?: string
  hourlyRate?: number
  reliefReason?: string
  actorUserId?: string
}

export interface FloatingShiftMetadata {
  isCrossProperty: boolean
  homePropertyId: string
  homePropertyCode: string
  targetPropertyId: string
  targetPropertyCode: string
  hourlyRate: number
  reliefReason: string
}

export interface PayrollSplitItem {
  employeeId: string
  employeeName: string
  homeProperty: { id: string; name: string; code: string }
  totalHours: number
  totalGrossPay: number
  propertyBreakdown: Array<{
    propertyId: string
    propertyName: string
    propertyCode: string
    hoursWorked: number
    percentage: number
    allocatedCost: number
    isHomeProperty: boolean
  }>
  interCompanyRecharges: Array<{
    debtorPropertyId: string
    debtorPropertyCode: string
    creditorPropertyId: string
    creditorPropertyCode: string
    amount: number
    reason: string
  }>
}

/**
 * Assigns a cross-property / floating shift with schedule conflict validation
 */
export async function assignFloatingShift(input: AssignFloatingShiftInput) {
  const {
    employeeId,
    targetPropertyId,
    startTime,
    endTime,
    role,
    hourlyRate = 25.0,
    reliefReason = 'Cross-property operational relief coverage',
    actorUserId
  } = input

  const start = new Date(startTime)
  const end = new Date(endTime)

  if (start >= end) {
    throw new Error('Shift start time must be before end time')
  }

  // 1. Fetch employee with home property
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      property: { select: { id: true, name: true, code: true } }
    }
  })

  if (!employee) {
    throw new Error(`Employee with ID ${employeeId} not found`)
  }

  // 2. Fetch target property
  const targetProperty = await prisma.property.findUnique({
    where: { id: targetPropertyId },
    select: { id: true, name: true, code: true }
  })

  if (!targetProperty) {
    throw new Error(`Target Property with ID ${targetPropertyId} not found`)
  }

  // 3. Conflict Detection: Verify no overlapping shift across ANY property
  const overlappingShift = await prisma.shift.findFirst({
    where: {
      employeeId,
      status: { not: 'CANCELLED' },
      OR: [
        {
          startTime: { lte: start },
          endTime: { gt: start }
        },
        {
          startTime: { lt: end },
          endTime: { gte: end }
        },
        {
          startTime: { gte: start },
          endTime: { lte: end }
        }
      ]
    }
  })

  if (overlappingShift) {
    throw new Error(
      `Conflict detected: Employee ${employee.firstName} ${employee.lastName} already has a shift scheduled between ${overlappingShift.startTime.toISOString()} and ${overlappingShift.endTime.toISOString()}`
    )
  }

  const isCrossProperty = employee.propertyId !== targetPropertyId

  const metadata: FloatingShiftMetadata = {
    isCrossProperty,
    homePropertyId: employee.property.id,
    homePropertyCode: employee.property.code,
    targetPropertyId: targetProperty.id,
    targetPropertyCode: targetProperty.code,
    hourlyRate,
    reliefReason
  }

  // 4. Create Shift record
  const shift = await prisma.shift.create({
    data: {
      employeeId,
      startTime: start,
      endTime: end,
      role: role || employee.position,
      status: 'SCHEDULED',
      notes: JSON.stringify(metadata)
    }
  })

  // 5. Create Audit Log for traceability
  await prisma.auditLog.create({
    data: {
      userId: actorUserId || null,
      actor: actorUserId ? `User:${actorUserId}` : 'HR_ROSTER_SYSTEM',
      action: 'FLOATING_SHIFT_ASSIGNED',
      resource: 'Shift',
      resourceId: shift.id,
      details: {
        shiftId: shift.id,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        homeProperty: employee.property.code,
        targetProperty: targetProperty.code,
        isCrossProperty,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        hourlyRate,
        reliefReason
      }
    }
  })

  return {
    id: shift.id,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    homeProperty: employee.property,
    targetProperty,
    isCrossProperty,
    startTime: shift.startTime,
    endTime: shift.endTime,
    role: shift.role,
    status: shift.status,
    hourlyRate
  }
}

/**
 * Calculates cross-property split-payroll allocation and inter-company recharge entries
 */
export async function calculateCrossPropertyPayrollAllocation(params: {
  periodStart: Date | string
  periodEnd: Date | string
  employeeId?: string
}): Promise<PayrollSplitItem[]> {
  const start = new Date(params.periodStart)
  const end = new Date(params.periodEnd)

  const shifts = await prisma.shift.findMany({
    where: {
      ...(params.employeeId ? { employeeId: params.employeeId } : {}),
      startTime: { gte: start },
      endTime: { lte: end },
      status: { in: ['SCHEDULED', 'COMPLETED'] }
    },
    include: {
      employee: {
        include: {
          property: { select: { id: true, name: true, code: true } }
        }
      }
    }
  })

  // Group shifts by employee
  const employeeShiftsMap = new Map<string, any[]>()
  for (const s of shifts) {
    if (!employeeShiftsMap.has(s.employeeId)) {
      employeeShiftsMap.set(s.employeeId, [])
    }
    employeeShiftsMap.get(s.employeeId)!.push(s)
  }

  const results: PayrollSplitItem[] = []

  for (const [empId, empShifts] of employeeShiftsMap.entries()) {
    const employee = empShifts[0].employee
    let totalHours = 0
    let totalGrossPay = 0

    const propertyHoursMap = new Map<string, { hours: number; rate: number; propCode: string; propName: string; isHome: boolean }>()

    for (const shift of empShifts) {
      const durationHours = Math.max(0, (shift.endTime.getTime() - shift.startTime.getTime()) / 3600000)
      totalHours += durationHours

      let meta: FloatingShiftMetadata | null = null
      try {
        if (shift.notes?.startsWith('{')) {
          meta = JSON.parse(shift.notes)
        }
      } catch {}

      const activePropId = meta?.targetPropertyId || employee.property.id
      const activePropCode = meta?.targetPropertyCode || employee.property.code
      const activePropName = meta?.targetPropertyCode || employee.property.name
      const hourlyRate = meta?.hourlyRate || Number(employee.baseSalary) / 160 || 20.0

      const isHome = activePropId === employee.property.id

      if (!propertyHoursMap.has(activePropId)) {
        propertyHoursMap.set(activePropId, {
          hours: 0,
          rate: hourlyRate,
          propCode: activePropCode,
          propName: activePropName,
          isHome
        })
      }

      const current = propertyHoursMap.get(activePropId)!
      current.hours += durationHours
      totalGrossPay += durationHours * hourlyRate
    }

    const propertyBreakdown = []
    const interCompanyRecharges = []

    for (const [propId, data] of propertyHoursMap.entries()) {
      const percentage = totalHours > 0 ? Number(((data.hours / totalHours) * 100).toFixed(1)) : 0
      const allocatedCost = Number((data.hours * data.rate).toFixed(2))

      propertyBreakdown.push({
        propertyId: propId,
        propertyName: data.propName,
        propertyCode: data.propCode,
        hoursWorked: Number(data.hours.toFixed(1)),
        percentage,
        allocatedCost,
        isHomeProperty: data.isHome
      })

      // If shift worked at secondary relief property, generate inter-company recharge
      if (!data.isHome && allocatedCost > 0) {
        interCompanyRecharges.push({
          debtorPropertyId: propId,
          debtorPropertyCode: data.propCode,
          creditorPropertyId: employee.property.id,
          creditorPropertyCode: employee.property.code,
          amount: allocatedCost,
          reason: `Relief staff cross-allocation (${data.hours.toFixed(1)} hrs @ $${data.rate}/hr for ${employee.firstName} ${employee.lastName})`
        })
      }
    }

    results.push({
      employeeId: empId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      homeProperty: employee.property,
      totalHours: Number(totalHours.toFixed(1)),
      totalGrossPay: Number(totalGrossPay.toFixed(2)),
      propertyBreakdown,
      interCompanyRecharges
    })
  }

  return results
}
