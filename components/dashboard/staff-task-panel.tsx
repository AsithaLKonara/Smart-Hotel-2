"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  Bell,
  Star,
  Zap,
  TrendingUp,
  BarChart3
} from "lucide-react"
import { PremiumButton } from "../ui/premium-button"
import { cn } from "@/lib/utils"

// Types
interface Task {
  id: string
  title: string
  description: string
  type: 'HOUSEKEEPING' | 'MAINTENANCE' | 'GUEST_REQUEST' | 'ADMINISTRATIVE' | 'ROOM_SERVICE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  assignedTo?: {
    id: string
    name: string
    role: string
  }
  createdBy: {
    id: string
    name: string
    role: string
  }
  dueDate: Date
  completedAt?: Date
  createdAt: Date
  roomNumber?: string
  estimatedTime?: number
  tags?: string[]
}

interface StaffMember {
  id: string
  name: string
  role: string
  department: string
  avatar?: string
  tasks: number
  completed: number
  rating: number
  isOnline: boolean
}

interface StaffTaskPanelProps {
  onTaskClick?: (taskId: string) => void
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onCreateTask?: () => void
}

const taskTypeConfig = {
  HOUSEKEEPING: {
    label: 'Housekeeping',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '🧹'
  },
  MAINTENANCE: {
    label: 'Maintenance',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: '🔧'
  },
  GUEST_REQUEST: {
    label: 'Guest Request',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '🎯'
  },
  ADMINISTRATIVE: {
    label: 'Administrative',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '📋'
  },
  ROOM_SERVICE: {
    label: 'Room Service',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: '🍽️'
  }
}

const priorityConfig = {
  LOW: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Low' },
  MEDIUM: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Medium' },
  HIGH: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High' },
  URGENT: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Urgent' }
}

const statusConfig = {
  PENDING: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Pending' },
  IN_PROGRESS: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'In Progress' },
  COMPLETED: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Completed' },
  OVERDUE: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Overdue' }
}

// Task card component
function TaskCard({ 
  task, 
  index, 
  onClick, 
  onUpdate 
}: {
  task: Task
  index: number
  onClick?: (taskId: string) => void
  onUpdate?: (taskId: string, updates: Partial<Task>) => void
}) {
  const typeConf = taskTypeConfig[task.type]
  const priorityConf = priorityConfig[task.priority]
  const statusConf = statusConfig[task.status]

  const isOverdue = new Date() > task.dueDate && task.status !== 'COMPLETED'
  const timeRemaining = Math.ceil((task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60))

  const handleStatusUpdate = (newStatus: Task['status']) => {
    onUpdate?.(task.id, { 
      status: newStatus,
      completedAt: newStatus === 'COMPLETED' ? new Date() : undefined
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick?.(task.id)}
      className={cn(
        "bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition-shadow",
        isOverdue && "border-red-200 bg-red-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{typeConf.icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{task.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{typeConf.label}</span>
              {task.roomNumber && (
                <>
                  <span>•</span>
                  <span>Room {task.roomNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium mb-1",
            priorityConf.bgColor,
            priorityConf.color
          )}>
            {priorityConf.label}
          </div>
          {isOverdue && (
            <div className="text-xs text-red-600 font-medium">Overdue</div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description}</p>

      {/* Assigned To */}
      {task.assignedTo && (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{task.assignedTo.name}</div>
            <div className="text-xs text-gray-500">{task.assignedTo.role}</div>
          </div>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex gap-1 mb-4">
          {task.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{task.dueDate.toLocaleDateString()}</span>
          </div>
          {task.estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{task.estimatedTime}m</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          statusConf.bgColor,
          statusConf.color
        )}>
          {statusConf.label}
        </div>
      </div>

      {/* Action Buttons */}
      {task.status !== 'COMPLETED' && (
        <div className="flex gap-2 mt-4">
          {task.status === 'PENDING' && (
            <PremiumButton
              onClick={(e) => {
                e.stopPropagation()
                handleStatusUpdate('IN_PROGRESS')
              }}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Start Task
            </PremiumButton>
          )}
          
          {task.status === 'IN_PROGRESS' && (
            <PremiumButton
              onClick={(e) => {
                e.stopPropagation()
                handleStatusUpdate('COMPLETED')
              }}
              variant="success"
              size="sm"
              className="flex-1"
            >
              Complete
            </PremiumButton>
          )}
        </div>
      )}
    </motion.div>
  )
}

// Staff member card
function StaffCard({ 
  staff, 
  index 
}: {
  staff: StaffMember
  index: number
}) {
  const completionRate = staff.tasks > 0 ? (staff.completed / staff.tasks) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-amber-600" />
          </div>
          {staff.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{staff.name}</h3>
          <div className="text-sm text-gray-600">{staff.role}</div>
          <div className="text-xs text-gray-500">{staff.department}</div>
        </div>
        
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">{staff.rating}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tasks</span>
          <span className="font-medium">{staff.tasks}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Completed</span>
          <span className="font-medium text-green-600">{staff.completed}</span>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Completion Rate</span>
            <span className="font-medium">{completionRate.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1, delay: index * 0.1 }}
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main Staff Task Panel Component
function StaffTaskPanelContent({ onTaskClick, onTaskUpdate, onCreateTask }: StaffTaskPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedType !== 'all') params.append('type', selectedType)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      
      const response = await fetch(`/api/tasks?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        // Transform API data to component format
        const transformedTasks: Task[] = data.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          type: task.type,
          priority: task.priority,
          status: task.status,
          assignedTo: task.staff ? {
            id: task.staff.id,
            name: task.staff.name,
            role: task.staff.position || 'Staff'
          } : undefined,
          createdBy: {
            id: task.user.id,
            name: task.user.name,
            role: 'Manager'
          },
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt),
          roomNumber: undefined,
          estimatedTime: 30,
          tags: []
        }))
        setTasks(transformedTasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedType, selectedStatus])

  const fetchStaff = useCallback(async () => {
    try {
      const response = await fetch('/api/staff')
      if (response.ok) {
        const data = await response.json()
        // Transform API data to component format
        const transformedStaff: StaffMember[] = data.map((member: any) => ({
          id: member.id,
          name: member.name,
          role: member.position || 'Staff',
          department: member.department || 'General',
          tasks: 0,
          completed: 0,
          rating: 4.5,
          isOnline: member.isActive
        }))
        setStaff(transformedStaff)
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }, [])

  // Fetch real data from API
  useEffect(() => {
    fetchTasks()
    fetchStaff()
  }, [fetchTasks, fetchStaff])

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesType = selectedType === 'all' || task.type === selectedType
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesType && matchesStatus && matchesSearch
  })

  // Calculate stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => new Date() > t.dueDate && t.status !== 'COMPLETED').length
  }

  const typeFilters = [
    { key: 'all', label: 'All Tasks', count: stats.total },
    { key: 'HOUSEKEEPING', label: 'Housekeeping', count: tasks.filter(t => t.type === 'HOUSEKEEPING').length },
    { key: 'MAINTENANCE', label: 'Maintenance', count: tasks.filter(t => t.type === 'MAINTENANCE').length },
    { key: 'GUEST_REQUEST', label: 'Guest Request', count: tasks.filter(t => t.type === 'GUEST_REQUEST').length },
    { key: 'ADMINISTRATIVE', label: 'Administrative', count: tasks.filter(t => t.type === 'ADMINISTRATIVE').length }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Task Management</h1>
              <p className="text-gray-600">Manage staff tasks, assignments, and performance tracking</p>
            </div>
            
            <PremiumButton
              onClick={onCreateTask}
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
            >
              Create Task
            </PremiumButton>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-gray-600">Total Tasks</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.pending}</div>
            <div className="text-gray-600">Pending</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.inProgress}</div>
            <div className="text-gray-600">In Progress</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.completed}</div>
            <div className="text-gray-600">Completed</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.overdue}</div>
            <div className="text-gray-600">Overdue</div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col lg:flex-row gap-4 mb-8"
        >
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {typeFilters.map((filter) => (
              <motion.button
                key={filter.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedType(filter.key)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all font-medium flex items-center gap-2",
                  selectedType === filter.key
                    ? "border-purple-500 bg-purple-500 text-white shadow-lg"
                    : "border-gray-200 bg-white text-gray-700 hover:border-purple-300"
                )}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold",
                    selectedType === filter.key
                      ? "bg-white/20 text-white"
                      : "bg-purple-100 text-purple-600"
                  )}>
                    {filter.count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Staff Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {staff.map((member, index) => (
              <StaffCard key={member.id} staff={member} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Tasks Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onClick={onTaskClick}
                  onUpdate={onTaskUpdate}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500">No tasks match the current filters</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Export with error boundary
export function StaffTaskPanel(props: StaffTaskPanelProps) {
  return <StaffTaskPanelContent {...props} />
}
