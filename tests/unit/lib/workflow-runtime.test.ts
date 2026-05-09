import { WorkflowRuntimeEngine } from '../../../lib/workflow-runtime'

describe('Operational Workflow Runtime Engine (Checkout Sagas)', () => {
  beforeEach(() => {
    WorkflowRuntimeEngine.clearAll()
  })

  test('should launch a checkout saga initializing the first task as RUNNING', () => {
    const saga = WorkflowRuntimeEngine.startCheckoutSaga('res-001', 'r101', '101', 'mgr_alice')

    expect(saga.status).toBe('IN_PROGRESS')
    expect(saga.roomNumber).toBe('101')
    expect(saga.tasks.length).toBe(5)

    // First task should be CLOSE_FOLIO with RUNNING status
    expect(saga.tasks[0].type).toBe('CLOSE_FOLIO')
    expect(saga.tasks[0].status).toBe('RUNNING')

    // Subsequent tasks should be PENDING
    expect(saga.tasks[1].type).toBe('MINIBAR_AUDIT')
    expect(saga.tasks[1].status).toBe('PENDING')
  })

  test('should throw error when completing a task that is not currently running', () => {
    const saga = WorkflowRuntimeEngine.startCheckoutSaga('res-002', 'r102', '102', 'mgr_alice')

    // Attempting to complete MINIBAR_AUDIT when CLOSE_FOLIO is still active (illegal!)
    expect(() => {
      WorkflowRuntimeEngine.completeTask(saga.id, 'MINIBAR_AUDIT')
    }).toThrow('cannot be completed because its current status is PENDING')
  })

  test('should cascade progress through the 5-step task list and complete the overall saga', () => {
    const saga = WorkflowRuntimeEngine.startCheckoutSaga('res-003', 'r103', '103', 'mgr_alice')

    // Step 1: Complete Folio Audit
    WorkflowRuntimeEngine.completeTask(saga.id, 'CLOSE_FOLIO')
    expect(saga.tasks[0].status).toBe('COMPLETED')
    expect(saga.tasks[1].status).toBe('RUNNING') // Minibar audit is now active

    // Step 2: Complete Minibar Audit
    WorkflowRuntimeEngine.completeTask(saga.id, 'MINIBAR_AUDIT')
    expect(saga.tasks[1].status).toBe('COMPLETED')
    expect(saga.tasks[2].status).toBe('RUNNING') // Housekeeping dispatch is now active

    // Step 3: Complete Housekeeping dispatch (cleaning)
    WorkflowRuntimeEngine.completeTask(saga.id, 'HOUSEKEEPING_DISPATCH')
    expect(saga.tasks[2].status).toBe('COMPLETED')
    expect(saga.tasks[3].status).toBe('RUNNING') // Engineering inspection is now active

    // Step 4: Complete Engineering inspection
    // Note: Completing engineering inspection should automatically trigger and complete Step 5 (RELEASE_INVENTORY)
    WorkflowRuntimeEngine.completeTask(saga.id, 'ENGINEERING_INSPECTION')

    expect(saga.tasks[3].status).toBe('COMPLETED')
    expect(saga.tasks[4].status).toBe('COMPLETED') // System inventory released!
    expect(saga.status).toBe('COMPLETED') // Overall saga completed!
    expect(saga.completedAt).toBeDefined()
  })
})
