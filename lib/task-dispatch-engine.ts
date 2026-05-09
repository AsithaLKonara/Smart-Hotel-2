import { eventBus } from './event-bus'

export type TaskDomain =
  | 'HOUSEKEEPING'
  | 'MAINTENANCE'
  | 'KITCHEN'
  | 'VALET'
  | 'LAUNDRY'
  | 'SECURITY'
  | 'TRANSPORT'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'VIP_CRITICAL'

export type TaskState =
  | 'CREATED'
  | 'DISPATCHED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'SLA_BREACHED'
  | 'COMPLETED'
  | 'CANCELLED'

export interface TaskHistoryEntry {
  from: TaskState
  to: TaskState
  timestamp: string
  note?: string
}

export interface DispatchTask {
  id: string
  domain: TaskDomain
  priority: TaskPriority
  state: TaskState
  title: string
  description: string
  location: string
  assignedStaffId: string
  slaMinutes: number
  createdAt: string
  dispatchedAt?: string
  acceptedAt?: string
  completedAt?: string
  evidenceUrl?: string
  gpsLocation?: string
  history: TaskHistoryEntry[]
}

export class TaskDispatchEngine {
  private static tasks: Map<string, DispatchTask> = new Map()

  // Reset static map (for clean test suites runs)
  static clearAll(): void {
    this.tasks.clear()
  }

  // Create a new task in CREATED status
  static createTask(
    id: string,
    domain: TaskDomain,
    priority: TaskPriority,
    title: string,
    description: string,
    location: string,
    slaMinutes: number
  ): DispatchTask {
    const task: DispatchTask = {
      id,
      domain,
      priority,
      state: 'CREATED',
      title,
      description,
      location,
      assignedStaffId: '',
      slaMinutes,
      createdAt: new Date().toISOString(),
      history: []
    }

    this.tasks.set(id, task)

    eventBus.emit({
      id: `task-create-${id}`,
      type: 'dispatch.task_created',
      severity: 'INFO',
      title: `Task Created: ${title}`,
      message: `New operational dispatch [${domain}] created for location: ${location}.`,
      metadata: { ...task },
      timestamp: task.createdAt
    })

    return task
  }

  // Dispatch task to assigned staff member
  static dispatchTask(id: string, assignedStaffId: string): DispatchTask {
    const task = this.tasks.get(id)
    if (!task) {
      throw new Error(`Operational task [${id}] not found in dispatch files.`)
    }
    if (task.state !== 'CREATED' && task.state !== 'SLA_BREACHED') {
      throw new Error(`Cannot dispatch task [${id}] in its current state: ${task.state}.`)
    }

    const previousState = task.state
    task.state = 'DISPATCHED'
    task.assignedStaffId = assignedStaffId
    task.dispatchedAt = new Date().toISOString()

    task.history.push({
      from: previousState,
      to: 'DISPATCHED',
      timestamp: task.dispatchedAt,
      note: `Dispatched to staff ID: ${assignedStaffId}`
    })

    eventBus.emit({
      id: `task-disp-${id}-${Date.now()}`,
      type: 'dispatch.task_dispatched',
      severity: 'INFO',
      title: `Task Dispatched: ${task.title}`,
      message: `Task assigned to operator ${assignedStaffId}.`,
      metadata: { ...task },
      timestamp: task.dispatchedAt
    })

    return task
  }

  // Staff member accepts task
  static acceptTask(id: string): DispatchTask {
    const task = this.tasks.get(id)
    if (!task) {
      throw new Error(`Operational task [${id}] not found in dispatch files.`)
    }
    if (task.state !== 'DISPATCHED') {
      throw new Error(`Cannot accept task [${id}] in its current state: ${task.state}.`)
    }

    task.state = 'ACCEPTED'
    task.acceptedAt = new Date().toISOString()

    task.history.push({
      from: 'DISPATCHED',
      to: 'ACCEPTED',
      timestamp: task.acceptedAt,
      note: 'Task accepted by operator'
    })

    return task
  }

  // Staff completes task with required audit compliance evidence
  static completeTask(id: string, evidenceUrl?: string, gpsLocation?: string): DispatchTask {
    const task = this.tasks.get(id)
    if (!task) {
      throw new Error(`Operational task [${id}] not found in dispatch files.`)
    }
    if (task.state === 'COMPLETED' || task.state === 'CANCELLED') {
      throw new Error(`Cannot complete task [${id}] which is already ${task.state}.`)
    }

    const previousState = task.state
    task.state = 'COMPLETED'
    task.completedAt = new Date().toISOString()
    task.evidenceUrl = evidenceUrl
    task.gpsLocation = gpsLocation

    task.history.push({
      from: previousState,
      to: 'COMPLETED',
      timestamp: task.completedAt,
      note: `Task completed. Compliance Evidence: ${evidenceUrl || 'None'}, Location: ${gpsLocation || 'None'}`
    })

    eventBus.emit({
      id: `task-comp-${id}-${Date.now()}`,
      type: 'dispatch.task_completed',
      severity: 'HIGH',
      title: `Task Settled: ${task.title}`,
      message: `Operational task [${task.domain}] at ${task.location} successfully completed by ${task.assignedStaffId}.`,
      metadata: { ...task },
      timestamp: task.completedAt
    })

    return task
  }

  // SRE Audit Sweeper: scans running tasks for SLA violations
  static auditSlaBreaches(fakeCurrentTime?: Date): DispatchTask[] {
    const now = fakeCurrentTime || new Date()
    const breachedTasks: DispatchTask[] = []

    this.tasks.forEach((task) => {
      if (task.state === 'COMPLETED' || task.state === 'CANCELLED' || task.state === 'SLA_BREACHED') {
        return
      }

      const createdTime = new Date(task.createdAt)
      const elapsedMinutes = Math.floor((now.getTime() - createdTime.getTime()) / 1000 / 60)

      if (elapsedMinutes > task.slaMinutes) {
        // Mark as breached and auto-escalate!
        this.escalateTask(task.id, 'SLA Breach auto-escalation')
        breachedTasks.push(task)
      }
    })

    return breachedTasks
  }

  // Escalate task to supervisor on breach or manual override
  static escalateTask(id: string, reason: string = 'Manual escalation request'): DispatchTask {
    const task = this.tasks.get(id)
    if (!task) {
      throw new Error(`Operational task [${id}] not found in dispatch files.`)
    }

    const previousState = task.state
    task.state = 'SLA_BREACHED'
    task.priority = 'VIP_CRITICAL'
    task.assignedStaffId = 'supervisor_on_duty'

    task.history.push({
      from: previousState,
      to: 'SLA_BREACHED',
      timestamp: new Date().toISOString(),
      note: `Escalated to Supervisor. Reason: ${reason}`
    })

    eventBus.emit({
      id: `task-esc-${id}-${Date.now()}`,
      type: 'dispatch.task_escalated',
      severity: 'HIGH',
      title: `CRITICAL BREACH: ${task.title}`,
      message: `Task ${task.id} breached its SLA window of ${task.slaMinutes}m. Priority upgraded to VIP_CRITICAL and reassigned to Supervisor.`,
      metadata: { ...task, escalationReason: reason },
      timestamp: new Date().toISOString()
    })

    return task
  }

  static getTask(id: string): DispatchTask | undefined {
    return this.tasks.get(id)
  }

  static getTasks(): DispatchTask[] {
    return Array.from(this.tasks.values())
  }
}

export default TaskDispatchEngine;
