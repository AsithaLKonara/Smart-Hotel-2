import { eventBus } from './event-bus'

export type WorkflowTaskType =
  | 'CLOSE_FOLIO'
  | 'MINIBAR_AUDIT'
  | 'HOUSEKEEPING_DISPATCH'
  | 'ENGINEERING_INSPECTION'
  | 'RELEASE_INVENTORY'

export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface WorkflowTask {
  id: string
  type: WorkflowTaskType
  status: TaskStatus
  assignedGroup: 'FINANCE' | 'RECEPTION' | 'HOUSEKEEPING' | 'ENGINEERING' | 'SYSTEM'
  slaMinutes: number
  startedAt?: string
  completedAt?: string
}

export interface CheckoutSaga {
  id: string
  reservationId: string
  roomId: string
  roomNumber: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  tasks: WorkflowTask[]
  createdAt: string
  completedAt?: string
  operatorId: string
}

export class WorkflowRuntimeEngine {
  private static sagas: Map<string, CheckoutSaga> = new Map()

  // Clear data (for test suites)
  static clearAll(): void {
    this.sagas.clear()
  }

  // Trigger a full guest checkout saga flow
  static startCheckoutSaga(
    reservationId: string,
    roomId: string,
    roomNumber: string,
    operatorId: string
  ): CheckoutSaga {
    const sagaId = `saga-out-${reservationId}-${Date.now()}`
    
    // Model the 5-Step Pipeline
    const tasks: WorkflowTask[] = [
      { id: `${sagaId}-t1`, type: 'CLOSE_FOLIO', status: 'RUNNING', assignedGroup: 'FINANCE', slaMinutes: 10, startedAt: new Date().toISOString() },
      { id: `${sagaId}-t2`, type: 'MINIBAR_AUDIT', status: 'PENDING', assignedGroup: 'RECEPTION', slaMinutes: 15 },
      { id: `${sagaId}-t3`, type: 'HOUSEKEEPING_DISPATCH', status: 'PENDING', assignedGroup: 'HOUSEKEEPING', slaMinutes: 45 },
      { id: `${sagaId}-t4`, type: 'ENGINEERING_INSPECTION', status: 'PENDING', assignedGroup: 'ENGINEERING', slaMinutes: 30 },
      { id: `${sagaId}-t5`, type: 'RELEASE_INVENTORY', status: 'PENDING', assignedGroup: 'SYSTEM', slaMinutes: 5 }
    ]

    const saga: CheckoutSaga = {
      id: sagaId,
      reservationId,
      roomId,
      roomNumber,
      status: 'IN_PROGRESS',
      tasks,
      createdAt: new Date().toISOString(),
      operatorId
    }

    this.sagas.set(sagaId, saga)

    eventBus.emit({
      id: `saga-start-${sagaId}`,
      type: 'workflow.saga_started',
      severity: 'HIGH',
      title: 'Checkout Saga Initiated',
      message: `Operational checkout saga launched for Room ${roomNumber}. First task: CLOSE_FOLIO is in progress.`,
      metadata: { ...saga },
      timestamp: saga.createdAt
    })

    return saga
  }

  // Progress a task to completion, cascading execution to next task
  static completeTask(sagaId: string, type: WorkflowTaskType): CheckoutSaga {
    const saga = this.sagas.get(sagaId)
    if (!saga) {
      throw new Error(`Checkout saga [${sagaId}] not found in runtime registry.`)
    }

    const task = saga.tasks.find(t => t.type === type)
    if (!task) {
      throw new Error(`Task type [${type}] not found in saga ${sagaId}.`)
    }
    if (task.status !== 'RUNNING') {
      throw new Error(`Task [${type}] cannot be completed because its current status is ${task.status}.`)
    }

    // Complete the current task
    task.status = 'COMPLETED'
    task.completedAt = new Date().toISOString()

    eventBus.emit({
      id: `task-comp-${task.id}`,
      type: 'workflow.task_completed',
      severity: 'INFO',
      title: `Task Completed: ${type}`,
      message: `Department [${task.assignedGroup}] successfully settled ${type} for Room ${saga.roomNumber}.`,
      metadata: { sagaId, task },
      timestamp: task.completedAt
    })

    // Advance to next task in the sequence cascade
    this.advanceSagaSequence(saga, type)

    return saga
  }

  // Sequence Cascader Machine
  private static advanceSagaSequence(saga: CheckoutSaga, completedType: WorkflowTaskType): void {
    const now = new Date().toISOString()

    if (completedType === 'CLOSE_FOLIO') {
      // Step 2: Begin Minibar Audit
      const next = saga.tasks.find(t => t.type === 'MINIBAR_AUDIT')!
      next.status = 'RUNNING'
      next.startedAt = now
    } 
    else if (completedType === 'MINIBAR_AUDIT') {
      // Step 3: Dispatch Housekeeping
      const next = saga.tasks.find(t => t.type === 'HOUSEKEEPING_DISPATCH')!
      next.status = 'RUNNING'
      next.startedAt = now
    } 
    else if (completedType === 'HOUSEKEEPING_DISPATCH') {
      // Step 4: Dispatch Engineering Inspection
      const next = saga.tasks.find(t => t.type === 'ENGINEERING_INSPECTION')!
      next.status = 'RUNNING'
      next.startedAt = now
    } 
    else if (completedType === 'ENGINEERING_INSPECTION') {
      // Step 5: Release Inventory (System Task)
      const next = saga.tasks.find(t => t.type === 'RELEASE_INVENTORY')!
      next.status = 'RUNNING'
      next.startedAt = now

      // Automatically resolve and complete System tasks
      next.status = 'COMPLETED'
      next.completedAt = now

      // Finish the entire Saga
      saga.status = 'COMPLETED'
      saga.completedAt = now

      eventBus.emit({
        id: `saga-comp-${saga.id}`,
        type: 'workflow.saga_completed',
        severity: 'HIGH',
        title: `Room Released: Room ${saga.roomNumber}`,
        message: `Checkout saga completed! Room ${saga.roomNumber} inventory is updated and active on OTA distribution channels.`,
        metadata: { ...saga },
        timestamp: saga.completedAt
      })
    }
  }

  static getSaga(sagaId: string): CheckoutSaga | undefined {
    return this.sagas.get(sagaId)
  }

  static getSagas(): CheckoutSaga[] {
    return Array.from(this.sagas.values())
  }

  static getActiveSagaForRoom(roomNumber: string): CheckoutSaga | undefined {
    return Array.from(this.sagas.values()).find(
      s => s.roomNumber === roomNumber && s.status === 'IN_PROGRESS'
    )
  }
}

export default WorkflowRuntimeEngine;
