import { DatabaseClient, SqlTransactionClient } from '../database-client'

export interface TaskRecord {
  id: string
  propertyId: string
  domain: string
  priority: string
  state: string
  title: string
  description: string
  location: string
  assignedStaffId: string
  slaMinutes: number
  evidenceUrl?: string
  gpsLocation?: string
  createdAt: string
  dispatchedAt?: string
  completedAt?: string
}

export class TaskDispatchRepository {
  // Create task in persistent database
  static async createTask(task: TaskRecord, client: SqlTransactionClient): Promise<void> {
    await client.query(`
      INSERT INTO operational_tasks (id, property_id, domain, priority, state, title, description, location, assigned_staff_id, sla_minutes, created_at)
      VALUES ($1, $2, $3, $4, 'CREATED', $5, $6, $7, '', $8, $9)
    `, [task.id, task.propertyId, task.domain, task.priority, task.title, task.description, task.location, task.slaMinutes, task.createdAt])
  }

  // Dispatch task to operator
  static async dispatchTask(id: string, assignedStaffId: string, client: SqlTransactionClient): Promise<void> {
    const timestamp = new Date().toISOString()
    await client.query(`
      UPDATE operational_tasks 
      SET state = 'DISPATCHED', assigned_staff_id = $1, dispatched_at = $2
      WHERE id = $3 AND (state = 'CREATED' OR state = 'SLA_BREACHED')
    `, [assignedStaffId, timestamp, id])
  }

  // Record task accepted state
  static async acceptTask(id: string, client: SqlTransactionClient): Promise<void> {
    await client.query(`
      UPDATE operational_tasks 
      SET state = 'ACCEPTED'
      WHERE id = $1 AND state = 'DISPATCHED'
    `, [id])
  }

  // Complete task locking compliance evidence and GPS signatures
  static async completeTask(id: string, evidenceUrl: string, gpsLocation: string, client: SqlTransactionClient): Promise<void> {
    const timestamp = new Date().toISOString()
    const res = await client.query(`
      UPDATE operational_tasks 
      SET state = 'COMPLETED', evidence_url = $1, gps_location = $2, completed_at = $3
      WHERE id = $4 AND state != 'COMPLETED' AND state != 'CANCELLED'
    `, [evidenceUrl, gpsLocation, timestamp, id])

    if (res.rowCount === 0) {
      throw new Error(`TASK_NOT_COMPLETED: Operational task [${id}] was already closed or cannot be found.`)
    }
  }

  // Escalate breached task
  static async escalateTask(id: string, reason: string, client: SqlTransactionClient): Promise<void> {
    await client.query(`
      UPDATE operational_tasks 
      SET state = 'SLA_BREACHED', priority = 'VIP_CRITICAL', assigned_staff_id = 'supervisor_on_duty'
      WHERE id = $1 AND state != 'COMPLETED' AND state != 'CANCELLED'
    `, [id])
  }
}

export default TaskDispatchRepository
