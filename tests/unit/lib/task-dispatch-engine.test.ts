import { TaskDispatchEngine } from '../../../lib/task-dispatch-engine'
import { eventBus } from '../../../lib/event-bus'

describe('TaskDispatchEngine', () => {
  beforeEach(() => {
    TaskDispatchEngine.clearAll()
  })

  test('should correctly create a new task in CREATED status', () => {
    const task = TaskDispatchEngine.createTask(
      'task-101',
      'HOUSEKEEPING',
      'HIGH',
      'Clean Room 101 VIP checkout',
      'Ensure standard VIP chocolates and clean towels are replaced',
      'Room 101',
      20
    )

    expect(task.id).toBe('task-101')
    expect(task.domain).toBe('HOUSEKEEPING')
    expect(task.priority).toBe('HIGH')
    expect(task.state).toBe('CREATED')
    expect(task.location).toBe('Room 101')
    expect(task.slaMinutes).toBe(20)
    expect(task.assignedStaffId).toBe('')
  })

  test('should progress task lifecycle through standard transitions', () => {
    TaskDispatchEngine.createTask(
      'task-102',
      'MAINTENANCE',
      'MEDIUM',
      'AC Filter cleaning',
      'HVAC maintenance',
      'Room 301',
      30
    )

    // CREATED -> DISPATCHED
    const dispatched = TaskDispatchEngine.dispatchTask('task-102', 'operator_marcelo')
    expect(dispatched.state).toBe('DISPATCHED')
    expect(dispatched.assignedStaffId).toBe('operator_marcelo')

    // DISPATCHED -> ACCEPTED
    const accepted = TaskDispatchEngine.acceptTask('task-102')
    expect(accepted.state).toBe('ACCEPTED')

    // ACCEPTED -> COMPLETED with evidence and GPS compliance
    const completed = TaskDispatchEngine.completeTask(
      'task-102',
      'https://smarthotel.storage/evidence/task-102-ac.webp',
      '40.7128,-74.0060'
    )
    expect(completed.state).toBe('COMPLETED')
    expect(completed.evidenceUrl).toBe('https://smarthotel.storage/evidence/task-102-ac.webp')
    expect(completed.gpsLocation).toBe('40.7128,-74.0060')
    expect(completed.completedAt).toBeDefined()
  })

  test('should throw error on illegal transitions', () => {
    TaskDispatchEngine.createTask(
      'task-103',
      'LAUNDRY',
      'LOW',
      'Dry Cleaning guest suit',
      'Suite service laundry',
      'Room 401',
      45
    )

    // Cannot accept immediately from CREATED (must be DISPATCHED first)
    expect(() => {
      TaskDispatchEngine.acceptTask('task-103')
    }).toThrow()

    // Dispatch and complete
    TaskDispatchEngine.dispatchTask('task-103', 'operator_julie')
    TaskDispatchEngine.acceptTask('task-103')
    TaskDispatchEngine.completeTask('task-103')

    // Cannot dispatch completed task
    expect(() => {
      TaskDispatchEngine.dispatchTask('task-103', 'operator_julie')
    }).toThrow()
  })

  test('should auto-escalate tasks to SLA_BREACHED and reassign to supervisor on breach', () => {
    const task = TaskDispatchEngine.createTask(
      'task-104',
      'VALET',
      'MEDIUM',
      'Retrieve guest Porsche 911 GT3',
      'Front driveway dispatch',
      'Lobby Entrance',
      10
    )

    // Trigger SLA sweeping audit simulating 15 minutes have elapsed (which exceeds 10m SLA limit)
    const mockCurrentTime = new Date(new Date(task.createdAt).getTime() + 15 * 60 * 1000)
    const breaches = TaskDispatchEngine.auditSlaBreaches(mockCurrentTime)

    expect(breaches.length).toBe(1)
    
    const escalatedTask = TaskDispatchEngine.getTask('task-104')
    expect(escalatedTask?.state).toBe('SLA_BREACHED')
    expect(escalatedTask?.priority).toBe('VIP_CRITICAL')
    expect(escalatedTask?.assignedStaffId).toBe('supervisor_on_duty')
    expect(escalatedTask?.history.some(h => h.to === 'SLA_BREACHED')).toBe(true)
  })
})
