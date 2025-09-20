"use client"

import { StaffTaskPanel } from '@/components/dashboard/staff-task-panel'

export default function StaffTaskPanelPage() {
  const handleTaskClick = (taskId: string) => {
    console.log(`Task clicked: ${taskId}`)
    // Navigate to task details or open modal
    window.location.href = `/admin/tasks/${taskId}`
  }

  const handleTaskUpdate = (taskId: string, updates: any) => {
    console.log(`Task ${taskId} updated:`, updates)
    // In a real app, this would send an API request to update the task
    // and trigger real-time updates via WebSocket
  }

  const handleCreateTask = () => {
    console.log('Create new task')
    // Open create task modal or navigate to create task page
    window.location.href = '/admin/tasks/create'
  }

  return (
    <StaffTaskPanel
      onTaskClick={handleTaskClick}
      onTaskUpdate={handleTaskUpdate}
      onCreateTask={handleCreateTask}
    />
  )
}

