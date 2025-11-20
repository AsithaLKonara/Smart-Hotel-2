"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Search, CheckCircle, Clock, AlertTriangle, Loader2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import toast from 'react-hot-toast'

interface Task {
  id: string
  title: string
  description?: string
  type: string
  priority: string
  status: string
  assignedTo?: string
  dueDate?: string
  completedAt?: string
  createdAt: string
  staff?: {
    id: string
    name: string
  }
}

export default function AdminTasksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'HOUSEKEEPING',
    priority: 'MEDIUM',
    status: 'PENDING',
    assignedTo: '',
    dueDate: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchTasks()
    fetchStaff()
  }, [session, status, router])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      // Ensure data is always an array even if the API returns { tasks: [...] }
      const tasksArray: Task[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.tasks)
        ? data.tasks
        : []
      setTasks(tasksArray)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
      setTasks([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      if (!response.ok) throw new Error('Failed to fetch staff')
      const data = await response.json()
      setStaff(data.filter((s: any) => s.isActive))
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const taskData = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        assignedTo: formData.assignedTo || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        createdBy: session?.user.id
      }

      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
      const method = editingTask ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) throw new Error(editingTask ? 'Failed to update task' : 'Failed to create task')

      toast.success(editingTask ? 'Task updated successfully' : 'Task created successfully')
      setShowModal(false)
      setEditingTask(null)
      resetForm()
      fetchTasks()
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(editingTask ? 'Failed to update task' : 'Failed to create task')
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      type: task.type,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    })
    setShowModal(true)
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete task')

      toast.success('Task deleted successfully')
      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update task status')

      toast.success('Task status updated')
      fetchTasks()
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'HOUSEKEEPING',
      priority: 'MEDIUM',
      status: 'PENDING',
      assignedTo: '',
      dueDate: ''
    })
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    const matchesType = filterType === 'all' || task.type === filterType
    return matchesSearch && matchesStatus && matchesPriority && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'LOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const statsData = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    urgent: tasks.filter(t => t.priority === 'URGENT' && t.status !== 'COMPLETED').length
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Tasks' },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Task Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and assign tasks to staff members
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
            <div className="text-2xl font-bold">{statsData.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{statsData.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">{statsData.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            <div className="text-2xl font-bold text-green-600">{statsData.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Urgent</div>
            <div className="text-2xl font-bold text-red-600">{statsData.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="HOUSEKEEPING">Housekeeping</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="ROOM_SERVICE">Room Service</option>
            <option value="GUEST_REQUEST">Guest Request</option>
            <option value="ADMINISTRATIVE">Administrative</option>
          </select>
        </div>

        <Button
          onClick={() => {
            setEditingTask(null)
            resetForm()
            setShowModal(true)
          }}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{task.title}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge variant="secondary">{task.type.replace('_', ' ')}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {task.description}
                </p>
              )}

              {task.staff && (
                <div className="text-sm mb-2">
                  <span className="text-gray-500">Assigned to: </span>
                  <span className="font-medium">{task.staff.name}</span>
                </div>
              )}

              {task.dueDate && (
                <div className="text-sm mb-3 text-gray-500">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                {task.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}
                    className="flex-1"
                  >
                    Start
                  </Button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(task.id, 'COMPLETED')}
                    className="flex-1"
                  >
                    Complete
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(task)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first task to get started'}
          </p>
        </Card>
      )}

      {/* Add/Edit Task Modal */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingTask(null)
          resetForm()
        }}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="HOUSEKEEPING">Housekeeping</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="ROOM_SERVICE">Room Service</option>
                      <option value="GUEST_REQUEST">Guest Request</option>
                      <option value="ADMINISTRATIVE">Administrative</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Priority *</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Assign To</label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Unassigned</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} - {member.position}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingTask(null)
                      resetForm()
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
      </Modal>
    </div>
  )
}










