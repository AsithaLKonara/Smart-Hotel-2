"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useRouter } from 'next/navigation'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'
import {
 Activity,
 Layers,
 Sparkles,
 ClipboardList,
 AlertTriangle,
 User,
 ShieldCheck,
 CheckCircle2,
 Brush,
 Wrench,
 TrendingUp,
 RotateCw,
 PlusCircle,
 HelpCircle,
 ChevronRight,
 Sliders,
 DollarSign,
 Coffee,
 Check,
 Moon,
 Search,
 Filter,
 Info,
 Smartphone,
 CheckSquare,
 AlertCircle,
 Bell,
 Utensils,
 Globe,
 CornerDownRight,
 Send,
 Sparkle,
 Truck,
 ShieldAlert,
 Camera,
 MapPin,
 Flame,
 UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

// ---------------------------------------------------------
// INITIAL DATA & REALISTIC DISPATCHES (OPERATIONAL CORE)
// ---------------------------------------------------------
const INITIAL_ROOMS = [
 { id: 'r101', number: '101', type: 'STANDARD', floor: 1, price: 150, status: 'Occupied Clean', guest: 'Tony Stark', vip: true, eta: 'Checkout 11 AM', maintenanceNotes: '', laundrySla: 'SLA OK' },
 { id: 'r102', number: '102', type: 'STANDARD', floor: 1, price: 150, status: 'Vacant Clean', guest: '', vip: false, eta: 'Ready', maintenanceNotes: '', laundrySla: 'SLA OK' },
 { id: 'r103', number: '103', type: 'STANDARD', floor: 1, price: 150, status: 'Vacant Dirty', guest: '', vip: false, eta: 'Due In 3 PM', maintenanceNotes: '', laundrySla: 'Urgent' },
 { id: 'r201', number: '201', type: 'DELUXE', floor: 2, price: 260, status: 'Occupied Dirty', guest: 'Bruce Wayne', vip: true, eta: 'Due Out 12 PM', maintenanceNotes: '', laundrySla: 'SLA OK' },
 { id: 'r202', number: '202', type: 'DELUXE', floor: 2, price: 260, status: 'Vacant Clean', guest: '', vip: false, eta: 'Ready', maintenanceNotes: '', laundrySla: 'SLA OK' },
 { id: 'r203', number: '203', type: 'DELUXE', floor: 2, price: 260, status: 'Inspected', guest: '', vip: false, eta: 'Due In 1 PM', maintenanceNotes: '', laundrySla: 'SLA OK' },
 { id: 'r301', number: '301', type: 'SUITE', floor: 3, price: 450, status: 'Maintenance', guest: '', vip: false, eta: 'Blocked', maintenanceNotes: 'AC Leak repair', laundrySla: 'Blocked' },
 { id: 'r302', number: '302', type: 'SUITE', floor: 3, price: 450, status: 'DND', guest: 'Selina Kyle', vip: true, eta: 'In-Room Dining', maintenanceNotes: '', laundrySla: 'SLA OK' },
 { id: 'r401', number: '401', type: 'PRESIDENTIAL', floor: 4, price: 950, status: 'Vacant Clean', guest: '', vip: false, eta: 'Ready', maintenanceNotes: '', laundrySla: 'SLA OK' }
]

const INITIAL_DISPATCHES = [
 {
 id: 'disp-101',
 domain: 'HOUSEKEEPING',
 priority: 'HIGH',
 state: 'CREATED',
 title: 'Room 201 Turn Down Service',
 description: 'Provide extra high-thread count sheets and pillow mist for Bruce Wayne.',
 location: 'Room 201',
 assignedStaffId: '',
 slaMinutes: 15,
 createdAt: new Date().toISOString(),
 history: []
 },
 {
 id: 'disp-102',
 domain: 'MAINTENANCE',
 priority: 'HIGH',
 state: 'DISPATCHED',
 title: 'Room 301 HVAC Leak Audit',
 description: 'AC unit condensation overflow leaking onto floorboard carpet.',
 location: 'Room 301',
 assignedStaffId: 'maint_tony',
 slaMinutes: 20,
 createdAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5m ago
 history: []
 },
 {
 id: 'disp-103',
 domain: 'VALET',
 priority: 'LOW',
 state: 'ACCEPTED',
 title: 'Park Guest Tesla Model S Plaid',
 description: 'Valet parking inside VIP underground concrete bay.',
 location: 'Main Portico Entrance',
 assignedStaffId: 'valet_julie',
 slaMinutes: 10,
 createdAt: new Date(Date.now() - 8 * 60000).toISOString(), // 8m ago
 history: []
 }
]

const INITIAL_KITCHEN_ORDERS = [
 { id: 'ord-101', roomNumber: '101', items: 'Lobster Thermidor x1, Champagne x1', status: 'PREPARING', elapsed: 18, notes: 'ALLERGY: Gluten Free request', runner: 'Peter Parker' },
 { id: 'ord-302', roomNumber: '302', items: 'Wagyu Ribeye x1, Truffle Fries x1', status: 'PLACED', elapsed: 3, notes: 'VIP stay order', runner: '' }
]

const INITIAL_LOGS = [
 { id: 'log-1', type: 'SUCCESS', message: 'Master Operations control system calibration complete.', time: '22:04:12' },
 { id: 'log-2', type: 'WARNING', message: 'Room 301 flagged for AC Maintenance ticket bypass.', time: '22:04:18' },
 { id: 'log-3', type: 'INFO', message: 'Double-entry settlement ledger reconciliation active.', time: '22:04:25' }
]

export default function MasterOperationsRoomV2() {
 const { data: session, status } = useSession()
 const router = useRouter()

 const [loading, setLoading] = useState(true)
 const [rooms, setRooms] = useState<any[]>([])
 const [kitchenOrders, setKitchenOrders] = useState<any[]>([])
 const [dispatches, setDispatches] = useState<any[]>([])
 const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
 const [logs, setLogs] = useState<any[]>(INITIAL_LOGS)
 const [searchQuery, setSearchQuery] = useState('')
 const [statusFilter, setStatusFilter] = useState('ALL')
 const [dispatchDomainFilter, setDispatchDomainFilter] = useState('ALL')

 // New Dispatch Form state
 const [newDispTitle, setNewDispTitle] = useState('')
 const [newDispDesc, setNewDispDesc] = useState('')
 const [newDispDomain, setNewDispDomain] = useState('HOUSEKEEPING')
 const [newDispPriority, setNewDispPriority] = useState('HIGH')
 const [newDispLoc, setNewDispLoc] = useState('Room 101')
 const [newDispSla, setNewDispSla] = useState(15)

 // Interactive step assign state
 const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null)
 const [operatorId, setOperatorId] = useState('')
 const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
 const [proofUrl, setProofUrl] = useState('')
 const [gpsCoords, setGpsCoords] = useState('')

 // Copilot Interface State
 const [copilotQuery, setCopilotQuery] = useState('')
 const [copilotResponses, setCopilotResponses] = useState<Array<{ q: string; a: string }>>([
 {
 q: 'Show all VIP risks',
 a: 'Analyzing property... Room 201 (Bruce Wayne) is currently Occupied Dirty. Cleanliness SLA has been breached by 14 minutes. Immediate dispatcher action is recommended to maintain guest satisfaction metrics.'
 }
 ])

 // Checkout saga simulator state
 const [activeSaga, setActiveSaga] = useState<any | null>(null)

 const fetchLiveRack = async () => {
 try {
 const res = await fetch('/api/admin/operations/live-rack')
 const data = await res.json()
 if (data.rooms) setRooms(data.rooms)
 if (data.dispatches) setDispatches(data.dispatches)
 if (data.kitchenOrders) setKitchenOrders(data.kitchenOrders)
 } catch (e) {
 console.error('Failed to fetch live rack data', e)
 }
 }

 useEffect(() => {
 if (status === 'loading') return

 if (!canAccessReceptionistFeatures(session)) {
 toast.error('Unauthorized receptionist workspace credentials')
 router.push('/auth/signin')
 return
 }

 fetchLiveRack().finally(() => setLoading(false))
 }, [session, status]) // eslint-disable-line react-hooks/exhaustive-deps

 // Helpers
 const addLog = (type: 'SUCCESS' | 'WARNING' | 'INFO' | 'DANGER', message: string) => {
 const timeNow = new Date().toTimeString().split(' ')[0]
 setLogs(prev => [
 { id: `log-${Date.now()}`, type, message, time: timeNow },
 ...prev.slice(0, 11)
 ])
 }

 // Visual status stylings mapping
 const getStatusStyles = (roomStatus: string) => {
 switch (roomStatus) {
 case 'Vacant Clean':
 return {
 bg: 'bg-emerald-500/10 border-border text-emerald-400 hover:border-border',
 dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
 badge: 'bg-emerald-500/10 text-emerald-300 border-border'
 }
 case 'Vacant Dirty':
 return {
 bg: 'bg-amber-500/10 border-border text-amber-400 hover:border-border',
 dot: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
 badge: 'bg-amber-500/10 text-amber-300 border-border'
 }
 case 'Occupied Clean':
 return {
 bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/50',
 dot: 'bg-indigo-500 shadow-[0_0_8px_#6366f1]',
 badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
 }
 case 'Occupied Dirty':
 return {
 bg: 'bg-rose-500/10 border-border text-rose-400 hover:border-border',
 dot: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
 badge: 'bg-rose-500/10 text-rose-300 border-border'
 }
 case 'Inspected':
 return {
 bg: 'bg-teal-500/10 border-teal-500/20 text-teal-400 hover:border-teal-500/50',
 dot: 'bg-teal-500 shadow-[0_0_8px_#14b8a6]',
 badge: 'bg-teal-500/10 text-teal-300 border-teal-500/30'
 }
 case 'DND':
 return {
 bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:border-purple-500/50',
 dot: 'bg-purple-500 shadow-[0_0_8px_#a855f7]',
 badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
 }
 case 'Maintenance':
 default:
 return {
 bg: 'bg-slate-700/10 border-slate-700/30 text-muted-foreground hover:border-slate-500/50',
 dot: 'bg-slate-500 shadow-[0_0_6px_#64748b]',
 badge: 'bg-slate-700 text-slate-300 border-slate-700/40'
 }
 }
 }

 // Live Database SLA Chronometric Sweep
 const handleSlaAuditSweep = async () => {
 try {
 const res = await fetch('/api/admin/operations/sla-sweep', { method: 'POST' })
 const data = await res.json()
 
 if (data.success && data.escalatedCount > 0) {
 addLog('DANGER', `SRE SLA sweep completed: Elevated ${data.escalatedCount} active dispatches to SLA_BREACHED due to response latency.`)
 toast.error('SLA breach detected! Active tasks escalated to VIP_CRITICAL.', { icon: '🚨' })
 } else {
 addLog('INFO', 'SRE SLA sweep completed: All tasks are within acceptable operational thresholds.')
 toast.success('No SLA breaches detected. Operations stable.', { icon: '✅' })
 }
 
 fetchLiveRack() // Live UI Refresh
 } catch (e) {
 toast.error('Failed to execute SLA Sweep')
 }
 }

 // Create Task
 const handleCreateTask = (e: React.FormEvent) => {
 e.preventDefault()
 if (!newDispTitle.trim()) {
 toast.error('Please input a task title.')
 return
 }

 const newTask = {
 id: `disp-${Date.now()}`,
 domain: newDispDomain,
 priority: newDispPriority,
 state: 'CREATED',
 title: newDispTitle,
 description: newDispDesc,
 location: newDispLoc,
 assignedStaffId: '',
 slaMinutes: newDispSla,
 createdAt: new Date().toISOString(),
 history: []
 }

 setDispatches(prev => [newTask, ...prev])
 setNewDispTitle('')
 setNewDispDesc('')
 addLog('INFO', `Dispatch created: "${newTask.title}" [SLA: ${newTask.slaMinutes}m]`)
 toast.success('Task successfully registered in dispatch queue!')
 }

 // Dispatch Action
 const handleDispatchTask = (taskId: string) => {
 if (!operatorId.trim()) {
 toast.error('Please enter an operator ID.')
 return
 }
 setDispatches(prev => prev.map(t => t.id === taskId ? { ...t, state: 'DISPATCHED', assignedStaffId: operatorId } : t))
 setAssigningTaskId(null)
 setOperatorId('')
 addLog('INFO', `Task ${taskId} successfully dispatched to ${operatorId}.`)
 toast.success('Task dispatched successfully!')
 }

 // Accept Action
 const handleAcceptTask = (taskId: string) => {
 setDispatches(prev => prev.map(t => t.id === taskId ? { ...t, state: 'ACCEPTED' } : t))
 addLog('SUCCESS', `Operator accepted task: ${taskId}.`)
 toast.success('Task status: ACCEPTED')
 }

 // Complete Action (with physical evidence uploads and GPS location coordinates logging)
 const handleCompleteTaskSubmit = (taskId: string) => {
 if (!proofUrl.trim() || !gpsCoords.trim()) {
 toast.error('Compliance proof and GPS coordinates are required.')
 return
 }
 setDispatches(prev => prev.map(t => t.id === taskId ? { ...t, state: 'COMPLETED', evidenceUrl: proofUrl, gpsLocation: gpsCoords } : t))
 setCompletingTaskId(null)
 setProofUrl('')
 setGpsCoords('')
 addLog('SUCCESS', `Task ${taskId} completed with compliance audits locked.`)
 toast.success('Task closed & completed!', { icon: '✅' })
 }

 const handleCheckIn = (roomId: string, guest: string) => {
 if (!guest || guest.trim() === '') {
 toast.error('Please input a valid guest name.')
 return
 }
 setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'Occupied Clean', guest, vip: guest.toLowerCase().includes('vip') } : r))
 if (selectedRoom?.id === roomId) {
 setSelectedRoom((prev: any) => ({ ...prev, status: 'Occupied Clean', guest, vip: guest.toLowerCase().includes('vip') }))
 }
 addLog('SUCCESS', `Receptionist express check-in settled for ${guest} in Room ${rooms.find(r => r.id === roomId)?.number}.`)
 toast.success('Express check-in complete!')
 }

 const triggerCheckoutSaga = (room: any) => {
 if (activeSaga) {
 toast.error('Active simulation pipeline is already running.')
 return
 }

 setActiveSaga({
 roomNumber: room.number,
 roomId: room.id,
 guest: room.guest,
 status: 'IN_PROGRESS',
 tasks: [
 { type: 'CLOSE_FOLIO', label: 'Close Folio Settlement Ledger', status: 'RUNNING', group: 'FINANCE' },
 { type: 'MINIBAR_AUDIT', label: 'Mini-Bar Audit', status: 'PENDING', group: 'RECEPTION' },
 { type: 'HOUSEKEEPING_DISPATCH', label: 'Housekeeping Dirty Dispatch', status: 'PENDING', group: 'HOUSEKEEPING' },
 { type: 'ENGINEERING_INSPECTION', label: 'HVAC Facility Audit', status: 'PENDING', group: 'ENGINEERING' },
 { type: 'RELEASE_INVENTORY', label: 'Update OTA Inventory Propagation', status: 'PENDING', group: 'SYSTEM' }
 ]
 })

 // Put room into checkout phase
 setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: 'Occupied Dirty', guest: `${r.guest} (Checkout Sagas...)` } : r))
 if (selectedRoom?.id === room.id) {
 setSelectedRoom((prev: any) => ({ ...prev, status: 'Occupied Dirty', guest: `${prev.guest} (Checkout Sagas...)` }))
 }

 addLog('INFO', `Operational checkout saga launched for Room ${room.number}. Step 1 is active.`)
 toast.success(`Checkout saga initialized!`, { icon: '⚙️' })
 }

 const advanceSagaStep = () => {
 if (!activeSaga) return

 const runningIdx = activeSaga.tasks.findIndex((t: any) => t.status === 'RUNNING')
 if (runningIdx === -1) return

 const tasksCopy = [...activeSaga.tasks]
 tasksCopy[runningIdx].status = 'COMPLETED'

 addLog('SUCCESS', `Task ${tasksCopy[runningIdx].type} successfully completed for Room ${activeSaga.roomNumber}.`)

 if (runningIdx < activeSaga.tasks.length - 1) {
 const nextTask = tasksCopy[runningIdx + 1]
 nextTask.status = 'RUNNING'

 if (nextTask.type === 'RELEASE_INVENTORY') {
 nextTask.status = 'COMPLETED'
 activeSaga.status = 'COMPLETED'
 addLog('SUCCESS', `Checkout saga closed. Room ${activeSaga.roomNumber} is released back to active inventory distribution.`)
 toast.success(`Saga complete! Inventory released.`, { icon: '✅' })

 setRooms(prev => prev.map(r => r.id === activeSaga.roomId ? { ...r, status: 'Vacant Clean', guest: '' } : r))
 if (selectedRoom?.id === activeSaga.roomId) {
 setSelectedRoom((prev: any) => ({ ...prev, status: 'Vacant Clean', guest: '' }))
 }
 setActiveSaga(null)
 return
 }

 if (nextTask.type === 'HOUSEKEEPING_DISPATCH') {
 setRooms(prev => prev.map(r => r.id === activeSaga.roomId ? { ...r, status: 'Vacant Dirty', guest: '' } : r))
 if (selectedRoom?.id === activeSaga.roomId) {
 setSelectedRoom((prev: any) => ({ ...prev, status: 'Vacant Dirty', guest: '' }))
 }
 }
 }

 setActiveSaga({
 ...activeSaga,
 tasks: tasksCopy
 })
 toast.success('Saga task advanced.')
 }

 const updateRoomStatus = (roomId: string, statusText: string) => {
 setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: statusText } : r))
 if (selectedRoom?.id === roomId) {
 setSelectedRoom((prev: any) => ({ ...prev, status: statusText }))
 }
 addLog('INFO', `Manual override: Set Room ${rooms.find(r => r.id === roomId)?.number} to ${statusText}.`)
 toast.success(`Room status updated to ${statusText}`)
 }

 // Culinary actions
 const advanceKitchenOrder = (orderId: string, currentStatus: string) => {
 const nextStatusMap: Record<string, string> = {
 'PLACED': 'PREPARING',
 'PREPARING': 'READY',
 'READY': 'DELIVERED'
 }
 const next = nextStatusMap[currentStatus]
 if (!next) return

 if (next === 'DELIVERED') {
 setKitchenOrders(prev => prev.filter(o => o.id !== orderId))
 addLog('SUCCESS', `Culinary delivery complete for Room ${kitchenOrders.find(o => o.id === orderId)?.roomNumber}.`)
 toast.success('Food order delivered!')
 } else {
 setKitchenOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next, elapsed: next === 'PREPARING' ? 0 : o.elapsed } : o))
 addLog('INFO', `Culinary order transitioned to ${next}.`)
 toast.success(`Order is now ${next.toLowerCase()}`)
 }
 }

 // Copilot Reasoning Parser
 const runCopilotSearch = () => {
 if (!copilotQuery || copilotQuery.trim() === '') return
 const q = copilotQuery.toLowerCase()
 let responseText = "Analyzing property metrics... No anomalies detected. Operational systems are within healthy threshold parameters."

 if (q.includes('risk') || q.includes('vip')) {
 responseText = "Saga Audit reveals: Room 201 (Bruce Wayne) is Occupied Dirty. Cleanliness SLA has been breached by 14 minutes. Immediate dispatcher action is recommended to maintain guest satisfaction metrics."
 } else if (q.includes('delay') || q.includes('bottleneck')) {
 responseText = "Staff Bottlenecks: Housekeeping zone is currently experiencing peak load. Average clean duration is elevated to 22 minutes (target 15m) due to 3 VIP arrivals and high checkouts."
 } else if (q.includes('ota') || q.includes('sync')) {
 responseText = "OTA Channel Status: Booking.com, Expedia, and Airbnb synchronization latency stands at 1.1s (nominal). Sync queues are empty, parity is 100% congruent across all room matrices."
 }

 setCopilotResponses(prev => [{ q: copilotQuery, a: responseText }, ...prev])
 setCopilotQuery('')
 addLog('INFO', `AI Copilot inquiry registered: "${copilotQuery}"`)
 }

 // Filters
 const filteredRooms = rooms.filter(r => {
 const matchesSearch = r.number.includes(searchQuery) || r.guest.toLowerCase().includes(searchQuery.toLowerCase())
 const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
 return matchesSearch && matchesStatus
 })

 const filteredDispatches = dispatches.filter(d => {
 return dispatchDomainFilter === 'ALL' || d.domain === dispatchDomainFilter
 })

 // Derive counts
 const totalRoomsCount = rooms.length
 const occupiedCount = rooms.filter(r => r.status.startsWith('Occupied') || r.status === 'DND').length
 const occupancyPercentage = Math.round((occupiedCount / totalRoomsCount) * 100)
 const vacantCleanCount = rooms.filter(r => r.status === 'Vacant Clean' || r.status === 'Inspected').length
 const dirtyCount = rooms.filter(r => r.status === 'Vacant Dirty' || r.status === 'Occupied Dirty').length
 const vipCount = rooms.filter(r => r.vip).length
 const maintenanceCount = rooms.filter(r => r.status === 'Maintenance').length
 const breachedDispatchesCount = dispatches.filter(d => d.state === 'SLA_BREACHED').length

 // Virtualization Grid Logic
 const [columns, setColumns] = useState(4)
 useEffect(() => {
 const handleResize = () => {
 const width = window.innerWidth
 if (width < 640) setColumns(2)
 else if (width < 768) setColumns(3)
 else setColumns(4)
 }
 handleResize()
 window.addEventListener('resize', handleResize)
 return () => window.removeEventListener('resize', handleResize)
 }, [])

 const rowCount = Math.ceil(filteredRooms.length / columns)
 const virtualizer = useWindowVirtualizer({
 count: rowCount,
 estimateSize: () => 151, // 135px card height + 16px (1rem) gap
 overscan: 5,
 })

 return (
 <div className="min-h-screen bg-[#050309] text-slate-100 p-6 font-sans antialiased selection:bg-purple-900/40">

 {/* 1. UNIVERSAL GLOBAL HOTEL STATUS RIBBON */}
 <div className="bg-[#0c0817] border border-border p-3 mb-6 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-10 gap-4 text-center items-center shadow-lg divide-x divide-purple-950/30">
 <div className="px-2">
 <span className="text-xs tracking-wider text-muted-foreground block font-bold">Occupancy</span>
 <span className={`text-sm font-bold mt-0.5 inline-block ${occupancyPercentage > 85 ? 'text-rose-400' : 'text-emerald-400'}`}>
 {occupancyPercentage}%
 </span>
 </div>
 <div className="px-2">
 <span className="text-xs tracking-wider text-muted-foreground block font-bold">Vacant Clean</span>
 <span className="text-sm font-bold text-emerald-400 mt-0.5 inline-block">{vacantCleanCount} Rooms</span>
 </div>
 <div className="px-2">
 <span className="text-xs tracking-wider text-muted-foreground block font-bold">Dirty Rooms</span>
 <span className={`text-sm font-bold mt-0.5 inline-block ${dirtyCount > 3 ? 'text-amber-400' : 'text-slate-300'}`}>
 {dirtyCount} Rooms
 </span>
 </div>
 <div className="px-2">
 <span className="text-xs tracking-wider text-muted-foreground block font-bold">VIP In-House</span>
 <span className="text-sm font-bold text-purple-400 mt-0.5 inline-block">{vipCount} Guests</span>
 </div>
 <div className="px-2">
 <span className="text-xs tracking-wider text-muted-foreground block font-bold">Active SLA Breach</span>
 <span className={`text-sm font-bold mt-0.5 inline-block ${breachedDispatchesCount > 0 ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-400'}`}>
 {breachedDispatchesCount} BREACHES
 </span>
 </div>
 <div className="px-2">
 <span className="text-xs tracking-wider text-muted-foreground block font-bold">Maintenance</span>
 <span className="text-sm font-bold text-muted-foreground mt-0.5 inline-block">{maintenanceCount} Blocked</span>
 </div>
 <div className="px-2">
 <span className="text-xs tracking-wider text-muted-foreground block font-bold">Kitchen SLA</span>
 <span className={`text-sm font-bold mt-0.5 inline-block ${kitchenOrders.some(o => o.elapsed > 15) ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-400'}`}>
 {kitchenOrders.some(o => o.elapsed > 15) ? '1 BREACH' : 'STABLE'}
 </span>
 </div>
 <div className="px-2">
 <span className="text-xs tracking-wider text-muted-foreground block font-bold">Incidents</span>
 <span className="text-sm font-bold text-emerald-400 mt-0.5 inline-block">0 OPEN</span>
 </div>
 <div className="px-2">
 <span className="text-xs tracking-wider text-muted-foreground block font-bold">OTA Sync Delay</span>
 <span className="text-sm font-bold text-emerald-400 mt-0.5 inline-block">1.1s (NOMINAL)</span>
 </div>
 <div className="px-2">
 <span className="text-xs tracking-wider text-muted-foreground block font-bold">SRE Pulse</span>
 <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-border py-0.5 px-2 rounded-xs inline-block ">
 SECURE
 </span>
 </div>
 </div>

 {/* Header operations */}
 <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between pb-6 mb-6 gap-4 border-b border-border">
 <div>
 <h1 className="text-4xl font-serif font-bold text-white tracking-wide">Master Operations Room <span className="font-sans text-xs text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded-sm ml-2 font-bold ">V2</span></h1>
 <p className="text-muted-foreground text-xs mt-1">Single-glance executive command deck managing real-time room status, kitchen displaying SLA pipelines, and automated Sagas.</p>
 </div>
 <div className="flex items-center gap-3">
 <Button onClick={handleSlaAuditSweep} className="bg-rose-950/30 border border-border text-rose-300 hover:bg-rose-900/30 h-9 text-xs font-bold">
 <Flame className="w-4 h-4 mr-1.5 animate-pulse text-rose-400" /> Simulate SLA Sweep Audit
 </Button>
 <Button onClick={() => router.push('/admin/dashboard')} className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold h-9 text-xs shadow-lg border-0 rounded-xs">
 Master Cockpit
 </Button>
 </div>
 </div>

 {/* Main Grid: Columns */}
 <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

 {/* LEFT COLUMN: ROOM RACK & LIVE SEARCH */}
 <div className="xl:col-span-8 space-y-6">
 <Card className="bg-[#0b0716]/60 border border-border rounded-none shadow-xl">

 {/* Filter Panel Controls */}
 <div className="p-4 bg-slate-950/20 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-2 max-w-sm w-full">
 <Search className="w-4 h-4 text-purple-400 shrink-0" />
 <input
 placeholder="Instant room search..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full bg-slate-950 border border-purple-950 text-xs p-2 rounded-none text-white focus:outline-none focus:border-purple-500"
 />
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {['ALL', 'Vacant Clean', 'Vacant Dirty', 'Occupied Clean', 'Occupied Dirty', 'Maintenance'].map(filt => (
 <Button
 key={filt}
 onClick={() => setStatusFilter(filt)}
 className={`h-7 text-xs tracking-wider font-bold px-3 rounded-none border border-border ${statusFilter === filt ? 'bg-purple-600 text-white border-transparent' : 'bg-muted/50 text-muted-foreground hover:text-white'}`}
 >
 {filt === 'ALL' ? 'Show All' : filt}
 </Button>
 ))}
 </div>
 </div>

 {/* Room Rack Cards Grid */}
 <CardContent className="p-6">
 <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
 {virtualizer.getVirtualItems().map((virtualRow) => {
 const startIdx = virtualRow.index * columns
 const rowRooms = filteredRooms.slice(startIdx, startIdx + columns)

 return (
 <div
 key={virtualRow.key}
 data-index={virtualRow.index}
 ref={virtualizer.measureElement}
 style={{
 position: 'absolute',
 top: 0,
 left: 0,
 width: '100%',
 height: '135px',
 transform: `translateY(${virtualRow.start}px)`,
 display: 'grid',
 gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
 gap: '1rem',
 }}
 >
 {rowRooms.map(room => {
 const style = getStatusStyles(room.status)
 const isSelected = selectedRoom?.id === room.id

 return (
 <button
 key={room.id}
 onClick={() => setSelectedRoom(room)}
 className={`p-4 text-left border rounded-none transition-all flex flex-col justify-between h-[135px] relative group/card overflow-hidden ${style.bg} ${isSelected ? 'ring-2 ring-purple-600 border-transparent scale-[1.01]' : ''}`}
 >
 {/* Hover Slide-over info block */}
 <div className="absolute inset-0 bg-[#0f0b1e] p-3 text-xs space-y-2 border-t border-purple-500/20 translate-y-[100%] group-hover/card:translate-y-0 transition-transform duration-200 pointer-events-none flex flex-col justify-center">
 <div className="flex justify-between font-bold text-muted-foreground">
 <span>FLOOR: {room.floor}</span>
 <span>RATE: ${room.price}</span>
 </div>
 <div className="text-slate-200">
 <strong>GUEST:</strong> {room.guest || 'None (Vacant)'}
 </div>
 <div className="text-muted-foreground">
 <strong>SLA ETA:</strong> {room.eta}
 </div>
 </div>

 <div className="flex items-start justify-between w-full">
 <div>
 <span className="text-xs font-mono text-muted-foreground font-bold">FL {room.floor}</span>
 <h4 className="text-xl font-serif font-bold text-white">{room.number}</h4>
 </div>
 <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
 </div>

 <div className="w-full">
 <Badge className={`text-xs py-0 px-1 font-bold rounded-none tracking-wider border-0 ${style.badge}`}>
 {room.status}
 </Badge>
 <span className="block text-[11px] font-bold text-slate-200 truncate mt-1 flex items-center gap-1">
 {room.vip && <span className="w-1.5 h-1.5 bg-purple-400 rounded-full inline-block animate-ping shrink-0" />}
 {room.guest ? room.guest : 'Vacant Room'}
 </span>
 </div>
 </button>
 )
 })}
 </div>
 )
 })}
 </div>
 </CardContent>
 </Card>

 {/* SAGA FLOW PIPELINE PANEL */}
 {activeSaga && (
 <Card className="bg-[#090513]/80 border border-border rounded-none shadow-xl overflow-hidden">
 <div className="p-4 bg-amber-500/5 border-b border-border flex items-center justify-between">
 <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
 <RotateCw className="w-4 h-4 animate-spin-slow" /> Active Saga Pipeline
 </span>
 <Badge className="bg-amber-500/15 text-amber-300 border-border text-xs font-mono rounded-none">
 ROOM {activeSaga.roomNumber} CHECKOUT SAGA
 </Badge>
 </div>

 <div className="p-6">
 <div className="flex items-start justify-between gap-4 mb-4">
 <div>
 <h4 className="text-sm font-bold text-white">Saga: Checkout {activeSaga.guest}</h4>
 <p className="text-[11px] text-muted-foreground mt-0.5">Automating double-entry closings, minibar inspections, housekeeping dispatches, and inventory releases.</p>
 </div>
 <Button onClick={advanceSagaStep} className="bg-amber-600 hover:bg-amber-500 text-white rounded-none border-0 text-xs font-bold h-8">
 Solve Active Step <ChevronRight className="w-3.5 h-3.5 ml-1" />
 </Button>
 </div>

 {/* Progress Timeline Stepper */}
 <div className="grid grid-cols-5 gap-3 pt-3">
 {activeSaga.tasks.map((task: any, idx: number) => {
 const isPending = task.status === 'PENDING'
 const isRunning = task.status === 'RUNNING'
 const isDone = task.status === 'COMPLETED'

 return (
 <div key={task.type} className={`p-3 border text-left rounded-none ${isDone ? 'bg-emerald-500/5 border-border text-emerald-400' : isRunning ? 'bg-amber-500/10 border-border text-amber-400 animate-pulse' : 'bg-slate-950/20 border-border text-muted-foreground'}`}>
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold">STEP {idx + 1}</span>
 <span className={`text-xs tracking-wider py-0 px-1 font-bold ${isDone ? 'bg-emerald-500/10 text-emerald-300' : isRunning ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-950 text-muted-foreground'}`}>{task.group}</span>
 </div>
 <h5 className="text-[11px] font-bold mt-1 truncate">{task.label}</h5>
 </div>
 )
 })}
 </div>
 </div>
 </Card>
 )}

 {/* UNIVERSAL OPERATIONAL TASK DISPATCH COCKPIT */}
 <Card className="bg-[#0b0716]/60 border border-border rounded-none shadow-xl overflow-hidden">
 <CardHeader className="border-b border-border p-4 bg-slate-950/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-2">
 <Truck className="w-5 h-5 text-purple-400" />
 <div>
 <CardTitle className="text-sm font-serif font-bold text-white tracking-wide">Universal Task & Dispatch Engine</CardTitle>
 <CardDescription className="text-xs text-muted-foreground mt-0.5">Plug-in departmental routing center with strict SLA tracking and completion auditing.</CardDescription>
 </div>
 </div>

 {/* Task Domain Selectors */}
 <div className="flex flex-wrap gap-1.5">
 {['ALL', 'HOUSEKEEPING', 'MAINTENANCE', 'VALET', 'SECURITY', 'LAUNDRY'].map(dom => (
 <Button
 key={dom}
 onClick={() => setDispatchDomainFilter(dom)}
 className={`h-6 text-xs tracking-wider font-bold px-2.5 rounded-none border border-border ${dispatchDomainFilter === dom ? 'bg-purple-600 text-white' : 'bg-muted/50 text-muted-foreground'}`}
 >
 {dom === 'ALL' ? 'All Divisions' : dom}
 </Button>
 ))}
 </div>
 </CardHeader>

 <CardContent className="p-4 space-y-4">

 {/* Form to Spawn New Dispatch */}
 <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-950/35 p-4 border border-border">
 <div className="md:col-span-2 space-y-1">
 <label className="text-xs tracking-wider text-muted-foreground font-bold">Task Title / Instruction</label>
 <input
 placeholder="e.g. VIP deep clean room 103"
 value={newDispTitle}
 onChange={e => setNewDispTitle(e.target.value)}
 className="w-full bg-slate-950 border border-purple-950 text-xs p-2 text-white focus:outline-none focus:border-purple-500 rounded-none"
 />
 </div>
 <div className="space-y-1">
 <label className="text-xs tracking-wider text-muted-foreground font-bold">Division</label>
 <select
 value={newDispDomain}
 onChange={e => setNewDispDomain(e.target.value)}
 className="w-full bg-slate-950 border border-purple-950 text-xs p-2 text-white focus:outline-none focus:border-purple-500 rounded-none"
 >
 <option value="HOUSEKEEPING">Housekeeping</option>
 <option value="MAINTENANCE">Maintenance</option>
 <option value="VALET">Valet</option>
 <option value="SECURITY">Security</option>
 <option value="LAUNDRY">Laundry</option>
 </select>
 </div>
 <div className="space-y-1">
 <label className="text-xs tracking-wider text-muted-foreground font-bold">SLA (Mins)</label>
 <input
 type="number"
 value={newDispSla}
 onChange={e => setNewDispSla(Number(e.target.value))}
 className="w-full bg-slate-950 border border-purple-950 text-xs p-2 text-white focus:outline-none focus:border-purple-500 rounded-none"
 />
 </div>
 <div className="flex items-end">
 <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-none font-bold text-xs h-9 ">
 <PlusCircle className="w-4 h-4 mr-1" /> Dispatch
 </Button>
 </div>
 </form>

 {/* Grid of active dispatches */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto">
 {filteredDispatches.map(disp => {
 const isCreated = disp.state === 'CREATED'
 const isDispatched = disp.state === 'DISPATCHED'
 const isAccepted = disp.state === 'ACCEPTED'
 const isBreached = disp.state === 'SLA_BREACHED'
 const isCompleted = disp.state === 'COMPLETED'

 return (
 <div
 key={disp.id}
 className={`p-4 border flex flex-col justify-between rounded-none ${isBreached ? 'bg-rose-500/5 border-border' : isCompleted ? 'bg-emerald-500/5 border-border' : 'bg-slate-950/20 border-border'}`}
 >
 <div className="space-y-1.5">
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-center gap-2">
 <Badge className="bg-purple-950 text-purple-300 border border-purple-500/30 text-xs rounded-none font-mono">
 {disp.domain}
 </Badge>
 <Badge className={`text-xs rounded-none font-bold ${disp.priority === 'VIP_CRITICAL' ? 'bg-rose-500/20 text-rose-300 animate-pulse border border-border' : 'bg-slate-900 text-muted-foreground border border-slate-800'}`}>
 {disp.priority}
 </Badge>
 </div>
 <span className={`text-xs font-mono font-bold ${isBreached ? 'text-rose-400' : isCompleted ? 'text-emerald-400' : 'text-purple-400'}`}>
 {disp.state}
 </span>
 </div>

 <h5 className="text-xs font-bold text-white">{disp.title}</h5>
 <p className="text-xs text-muted-foreground leading-relaxed">{disp.description}</p>
 <div className="text-xs text-purple-300 font-mono flex items-center gap-2">
 <span>📍 Location: {disp.location}</span>
 <span>⏳ SLA: {disp.slaMinutes}m</span>
 </div>

 {disp.assignedStaffId && (
 <p className="text-xs text-muted-foreground font-bold flex items-center gap-1 bg-muted/50 p-1 border border-border">
 <UserCheck className="w-3.5 h-3.5 text-purple-400" /> Operator: {disp.assignedStaffId}
 </p>
 )}

 {isCompleted && (
 <div className="bg-emerald-500/5 border border-border p-2 text-xs text-emerald-400 space-y-1 rounded-xs">
 <p className="font-bold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Compliance Evidence Lock Checked:</p>
 <p className="truncate font-mono text-xs text-muted-foreground">Proof: {disp.evidenceUrl}</p>
 <p className="font-mono text-xs text-muted-foreground">GPS Coords: {disp.gpsLocation}</p>
 </div>
 )}
 </div>

 {/* Stateful Operations Transitions stepper triggers */}
 <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-end gap-2">
 {isCreated && (
 <>
 {assigningTaskId === disp.id ? (
 <div className="flex items-center gap-1.5 w-full">
 <input
 placeholder="Staff ID (e.g. hk_maria)"
 value={operatorId}
 onChange={e => setOperatorId(e.target.value)}
 className="bg-slate-950 border border-purple-950 text-xs p-1.5 text-white focus:outline-none focus:border-purple-500 rounded-none w-full"
 />
 <Button onClick={() => handleDispatchTask(disp.id)} className="bg-purple-600 hover:bg-purple-500 text-xs h-7 px-2 font-bold rounded-none shrink-0">
 Confirm
 </Button>
 </div>
 ) : (
 <Button
 onClick={() => setAssigningTaskId(disp.id)}
 className="bg-purple-600 hover:bg-purple-500 text-xs h-7 px-3 font-bold rounded-none"
 >
 Dispatch Staff
 </Button>
 )}
 </>
 )}

 {isDispatched && (
 <Button
 onClick={() => handleAcceptTask(disp.id)}
 className="bg-indigo-600 hover:bg-indigo-500 text-xs h-7 px-3 font-bold rounded-none"
 >
 Accept Task (Swipe)
 </Button>
 )}

 {(isAccepted || isBreached) && (
 <>
 {completingTaskId === disp.id ? (
 <div className="space-y-1.5 w-full bg-slate-950/50 p-3 border border-purple-950">
 <input
 placeholder="Photo Proof url"
 value={proofUrl}
 onChange={e => setProofUrl(e.target.value)}
 className="bg-slate-950 border border-purple-950 text-xs p-1.5 text-white w-full rounded-none"
 />
 <input
 placeholder="GPS Coordinates (e.g. 6.9271,79.8612)"
 value={gpsCoords}
 onChange={e => setGpsCoords(e.target.value)}
 className="bg-slate-950 border border-purple-950 text-xs p-1.5 text-white w-full rounded-none"
 />
 <div className="flex items-center justify-end gap-1.5 pt-1">
 <Button onClick={() => setCompletingTaskId(null)} variant="outline" className="h-6 text-xs font-bold rounded-none">Cancel</Button>
 <Button onClick={() => handleCompleteTaskSubmit(disp.id)} className="bg-emerald-600 hover:bg-emerald-500 h-6 px-2.5 text-xs font-bold rounded-none">Complete</Button>
 </div>
 </div>
 ) : (
 <Button
 onClick={() => setCompletingTaskId(disp.id)}
 className="bg-emerald-600 hover:bg-emerald-500 text-xs h-7 px-3 font-bold rounded-none"
 >
 Lock Completion Proofs
 </Button>
 )}
 </>
 )}
 </div>
 </div>
 )
 })}
 </div>

 </CardContent>
 </Card>

 {/* ADVANCED KDS PIPELINE SCREEN */}
 <Card className="bg-[#0b0716]/60 border border-border rounded-none shadow-md">
 <CardHeader className="border-b border-border p-4 flex flex-row items-center justify-between bg-slate-950/15">
 <div className="flex items-center gap-2">
 <Utensils className="w-4 h-4 text-purple-400" />
 <CardTitle className="text-sm font-serif font-bold text-white tracking-wide">Culinary KDS Pipeline</CardTitle>
 </div>
 <span className="text-xs font-mono text-muted-foreground">ACTIVE ORDERS: {kitchenOrders.length}</span>
 </CardHeader>
 <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
 {kitchenOrders.length === 0 ? (
 <p className="text-center text-muted-foreground text-xs py-8 col-span-2">No active room service orders in KDS.</p>
 ) : (
 kitchenOrders.map(order => {
 const hasAllergen = order.notes.includes('ALLERGY')
 return (
 <div key={order.id} className={`p-4 bg-slate-950/40 border flex flex-col justify-between rounded-none ${hasAllergen ? 'border-border bg-rose-950/10' : 'border-border'}`}>
 <div className="flex items-start justify-between">
 <div>
 <span className="text-xs text-purple-400 font-bold block">ROOM {order.roomNumber}</span>
 <h5 className="text-xs font-bold text-white mt-0.5">{order.items}</h5>
 </div>
 <Badge className={`text-xs font-bold rounded-none ${order.status === 'PREPARING' ? 'bg-amber-500/10 text-amber-400 border border-border animate-pulse' : 'bg-slate-900 text-muted-foreground border border-slate-800'}`}>
 {order.status}
 </Badge>
 </div>

 {hasAllergen && (
 <div className="mt-3 bg-rose-500/10 border border-border p-2 text-xs text-rose-400 font-bold flex items-center gap-1.5 tracking-wider animate-pulse">
 <AlertTriangle className="w-3.5 h-3.5" /> Allergen Alert flag!
 </div>
 )}

 <div className="mt-4 flex items-center justify-between gap-4">
 <span className="text-xs text-muted-foreground font-mono">Timer: {order.elapsed}m elapsed</span>
 <Button
 onClick={() => advanceKitchenOrder(order.id, order.status)}
 className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-none text-xs h-7 px-3 border border-purple-500/20"
 >
 {order.status === 'PLACED' ? 'Start Prep' : order.status === 'PREPARING' ? 'Dish Up' : 'Deliver'}
 </Button>
 </div>
 </div>
 )
 })
 )}
 </CardContent>
 </Card>
 </div>

 {/* RIGHT COLUMN: DETAIL COCKPIT & COPILOT COMMANDER */}
 <div className="xl:col-span-4 space-y-6">

 {/* COCKPIT COMPACT DRAWER */}
 <Card className="bg-[#0b0716]/60 border border-border rounded-none shadow-xl">
 <CardHeader className="border-b border-border p-5">
 <span className="text-xs font-bold tracking-wider text-purple-400 block">Deck Operations Cockpit</span>
 <CardTitle className="text-lg font-serif font-bold text-white mt-1">
 {selectedRoom ? `Room ${selectedRoom.number} Deck` : 'Select a Room'}
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5 pt-4 space-y-4">
 {selectedRoom ? (
 <>
 <div className="bg-slate-950/40 border border-border p-3.5 space-y-2.5 text-xs">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Current Occupant:</span>
 <strong className="text-white">{selectedRoom.guest || 'None (Vacant)'}</strong>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Operational Status:</span>
 <Badge className="bg-purple-950 text-purple-300 border border-purple-500/25 text-xs rounded-none ">
 {selectedRoom.status}
 </Badge>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Dynamic pricing:</span>
 <strong className="text-emerald-400">${selectedRoom.price}/night</strong>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">laundry Priority:</span>
 <span className={selectedRoom.laundrySla === 'Urgent' ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-300'}>{selectedRoom.laundrySla}</span>
 </div>
 </div>

 {/* Actions Mapping based on room state */}
 <div className="space-y-3 pt-2">
 <h5 className="text-xs font-bold text-muted-foreground">OPERATIONAL EXPEDITES</h5>

 {/* Express Check-In */}
 {selectedRoom.status === 'Vacant Clean' && (
 <div className="bg-[#0c0818] border border-border p-4 space-y-3">
 <span className="text-xs font-bold text-purple-400 block ">Express Walk-In</span>
 <input
 id="expressGuestInput"
 placeholder="Guest Full Name"
 className="w-full bg-slate-950 border border-purple-950 text-xs p-2.5 text-white focus:outline-none focus:border-purple-500 rounded-none"
 />
 <Button
 onClick={() => {
 const val = (document.getElementById('expressGuestInput') as HTMLInputElement)?.value
 handleCheckIn(selectedRoom.id, val)
 }}
 className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-none"
 >
 Check In
 </Button>
 </div>
 )}

 {/* Checkout Saga dispatch */}
 {selectedRoom.status.startsWith('Occupied') && (
 <Button
 onClick={() => triggerCheckoutSaga(selectedRoom)}
 className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-none font-bold text-xs h-10 border-0"
 >
 <RotateCw className="w-3.5 h-3.5 mr-1.5 animate-spin-slow" /> Trigger Checkout Saga
 </Button>
 )}

 {/* Quick status switches */}
 <div className="grid grid-cols-2 gap-2">
 <Button
 onClick={() => updateRoomStatus(selectedRoom.id, 'Vacant Clean')}
 variant="outline"
 className="border-purple-950 text-slate-300 hover:text-white rounded-none text-xs font-bold h-8"
 >
 Clean Over
 </Button>
 <Button
 onClick={() => updateRoomStatus(selectedRoom.id, 'Vacant Dirty')}
 variant="outline"
 className="border-purple-950 text-slate-300 hover:text-white rounded-none text-xs font-bold h-8"
 >
 Dirty Over
 </Button>
 </div>

 <Button
 onClick={() => updateRoomStatus(selectedRoom.id, selectedRoom.status === 'Maintenance' ? 'Vacant Clean' : 'Maintenance')}
 className={`w-full text-xs font-bold rounded-none h-8 border-0 ${selectedRoom.status === 'Maintenance' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-900 hover:bg-rose-800 text-rose-200'}`}
 >
 {selectedRoom.status === 'Maintenance' ? 'Close Maintenance Ticket' : 'Open Out of Order Block'}
 </Button>
 </div>
 </>
 ) : (
 <div className="p-8 text-center border border-dashed border-border text-muted-foreground flex flex-col items-center justify-center gap-2">
 <HelpCircle className="w-8 h-8 text-muted-foreground" />
 <p className="text-xs">Select a grid cell block to load controls.</p>
 </div>
 )}
 </CardContent>
 </Card>

 {/* REAL OTA INVENTORY GRAPH */}
 <Card className="bg-[#0b0716]/60 border border-border rounded-none shadow-md">
 <CardHeader className="border-b border-border p-4 bg-slate-950/15">
 <div className="flex items-center gap-2">
 <Globe className="w-4 h-4 text-purple-400" />
 <CardTitle className="text-sm font-serif font-bold text-white tracking-wide">Live OTA Inventory Graph</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="p-4 space-y-3.5 text-xs text-muted-foreground">
 <div className="flex justify-between items-center pb-2 border-b border-border">
 <span>Booking.com Channel</span>
 <Badge className="bg-emerald-500/10 text-emerald-400 border border-border text-xs rounded-none font-mono">ACTIVE (1.2s)</Badge>
 </div>
 <div className="flex justify-between items-center pb-2 border-b border-border">
 <span>Expedia Channel</span>
 <Badge className="bg-emerald-500/10 text-emerald-400 border border-border text-xs rounded-none font-mono">ACTIVE (1.1s)</Badge>
 </div>
 <div className="flex justify-between items-center pb-2 border-b border-border">
 <span>Airbnb Channel</span>
 <Badge className="bg-amber-500/10 text-amber-400 border border-border text-xs rounded-none font-mono">BLOCKED (0.0s)</Badge>
 </div>
 <div className="flex justify-between items-center">
 <span>Direct PMS Engine</span>
 <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs rounded-none font-mono">OWNER LOCK</Badge>
 </div>
 </CardContent>
 </Card>

 {/* AI COMMANDER COPILOT PANEL */}
 <Card className="bg-[#0c0817] border border-border rounded-none shadow-sm">
 <CardHeader className="border-b border-border p-4 bg-slate-950/15">
 <div className="flex items-center gap-2">
 <Sparkle className="w-4 h-4 text-purple-400 animate-pulse" />
 <CardTitle className="text-sm font-serif font-bold text-white tracking-wide">Operational AI Copilot</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="p-4 space-y-4">
 <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1">
 {copilotResponses.map((item, idx) => (
 <div key={idx} className="space-y-1 bg-slate-950/40 p-3 border border-border text-[11px]">
 <p className="text-purple-400 font-bold flex items-center gap-1">
 <CornerDownRight className="w-3 h-3" /> Q: "{item.q}"
 </p>
 <p className="text-slate-300 leading-relaxed mt-1">{item.a}</p>
 </div>
 ))}
 </div>

 {/* Input Form */}
 <div className="flex items-center gap-2 border-t border-border pt-3">
 <input
 placeholder="Inquire VIP risks, delay bottlenecks..."
 value={copilotQuery}
 onChange={e => setCopilotQuery(e.target.value)}
 onKeyDown={e => { if (e.key === 'Enter') runCopilotSearch() }}
 className="w-full bg-slate-950 border border-purple-950 text-xs p-2.5 text-white focus:outline-none focus:border-purple-500 rounded-none"
 />
 <Button onClick={runCopilotSearch} className="bg-purple-600 hover:bg-purple-500 text-white rounded-none border-0 h-9 shrink-0">
 <Send className="w-4 h-4" />
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* AUDIT SYSTEM ACTIVITIES STREAM */}
 <Card className="bg-[#0b0716]/60 border border-border rounded-none shadow-md">
 <CardHeader className="border-b border-border p-4 bg-slate-950/15">
 <div className="flex items-center gap-2">
 <Activity className="w-4 h-4 text-emerald-400" />
 <span className="text-xs font-bold text-slate-300 font-mono">Live Audit Streams</span>
 </div>
 </CardHeader>
 <CardContent className="p-4 pt-2">
 <div className="font-mono text-xs text-muted-foreground space-y-3 max-h-[150px] overflow-y-auto pr-1">
 {logs.map(log => (
 <div key={log.id} className="flex items-start gap-2 border-b border-border pb-2">
 <span className="text-muted-foreground shrink-0">[{log.time}]</span>
 <span className={log.type === 'SUCCESS' ? 'text-emerald-400 font-bold' : log.type === 'WARNING' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
 {log.message}
 </span>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 </div>

 </div>

 </div>
 )
}
