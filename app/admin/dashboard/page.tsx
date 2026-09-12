"use client"

// NOTE: `export const dynamic` and `export const runtime` are Server Component
// route segment configs. They are illegal in Client Components ('use client')
// and were removed to prevent build failures and unpredictable runtime behavior.
// (Batch 4 audit — Fix 2)

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
 TrendingUp,
 Users,
 DollarSign,
 Bed,
 Star,
 Activity,
 ArrowUpRight,
 ShieldAlert,
 RefreshCw,
 ChevronRight,
 User
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

function AdminDashboardContent() {
 const { data: session, status } = useSession()
 const router = useRouter()

 // Fix 3: Use React Query instead of a manual useEffect+fetch pattern.
 // Gains automatic caching, background refetching (polls every 30s),
 // deduplication, and a stable refetch() handle for the refresh button.
 const {
 data: dashboardData,
 isLoading,
 refetch,
 } = useQuery({
 queryKey: ['dashboard'],
 queryFn: async () => {
 const res = await fetch('/api/analytics/dashboard', { cache: 'no-store' })
 if (!res.ok) throw new Error('Failed to load dashboard data')
 return res.json()
 },
 enabled: status === 'authenticated' && !!session,
 refetchInterval: 30_000, // Live dashboard: poll every 30 seconds
 staleTime: 10_000,
 })

 const formatCurrency = (amount: number) => {
 return new Intl.NumberFormat('en-LK', {
 style: 'currency',
 currency: 'LKR',
 minimumFractionDigits: 0
 }).format(amount)
 }

 if (status === 'loading' || isLoading) {
 return (
 <div className="flex items-center justify-center py-20">
 <PremiumSpinner size="lg" text="Loading Command Deck..." />
 </div>
 )
 }

 const summary = dashboardData?.summary || {}
 const recentBookings = dashboardData?.recentActivity?.bookings || []

 return (
 <AdminPageShell
 title="Admin Command Deck"
 subtitle="High-level revenue tracking and system-wide governance."
 onRefresh={() => refetch()}
 >
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
 <Card className="bg-card border-border p-6 rounded-xl shadow-sm transition-all">
 <div className="flex justify-between items-center">
 <div>
 <p className="text-sm font-medium text-muted-foreground">Revenue</p>
 <h3 className="text-2xl font-bold mt-1">{formatCurrency(summary.totalRevenue || 0)}</h3>
 </div>
 <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
 <DollarSign className="w-6 h-6" />
 </div>
 </div>
 </Card>
 <Card className="bg-card border-border p-6 rounded-xl shadow-sm transition-all">
 <div className="flex justify-between items-center">
 <div>
 <p className="text-sm font-medium text-muted-foreground">Bookings</p>
 <h3 className="text-2xl font-bold mt-1">{summary.totalBookings || 0}</h3>
 </div>
 <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
 <TrendingUp className="w-6 h-6" />
 </div>
 </div>
 </Card>
 <Card className="bg-card border-border p-6 rounded-xl shadow-sm transition-all">
 <div className="flex justify-between items-center">
 <div>
 <p className="text-sm font-medium text-muted-foreground">Occupancy</p>
 <h3 className="text-2xl font-bold mt-1">{summary.occupancyRate || 0}%</h3>
 </div>
 <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
 <Bed className="w-6 h-6" />
 </div>
 </div>
 </Card>
 <Card className="bg-card border-border p-6 rounded-xl shadow-sm transition-all">
 <div className="flex justify-between items-center">
 <div>
 <p className="text-sm font-medium text-muted-foreground">Service Score</p>
 <h3 className="text-2xl font-bold mt-1">{summary.serviceScore ?? 0}%</h3>
 </div>
 <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
 <Star className="w-6 h-6" />
 </div>
 </div>
 </Card>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-8">
 <Card className="bg-card border-border rounded-xl shadow-sm overflow-hidden">
 <div className="p-6 border-b border-border flex items-center justify-between">
 <h3 className="font-semibold flex items-center gap-3"><Activity className="w-5 h-5 text-muted-foreground" /> Recent Activity</h3>
 <Badge variant="secondary" className="text-xs">Live Feed</Badge>
 </div>
 <div className="divide-y divide-border">
 {recentBookings.slice(0, 5).map((booking: any) => (
 <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
 <User className="w-5 h-5" />
 </div>
 <div>
 <p className="font-medium text-sm">{booking.guestName}</p>
 <p className="text-xs text-muted-foreground">Room {booking.roomNumber} • {booking.roomType}</p>
 </div>
 </div>
 <div className="text-right">
 <Badge variant="outline" className="text-xs capitalize">{booking.status.toLowerCase().replace('_', ' ')}</Badge>
 <p className="text-sm font-medium mt-1">{formatCurrency(booking.totalAmount)}</p>
 </div>
 </div>
 ))}
 </div>
 </Card>

 <Card className="bg-card border-border p-6 rounded-xl shadow-sm space-y-6">
 <div className="flex items-center gap-3 text-destructive">
 <ShieldAlert className="w-5 h-5" />
 <h3 className="text-lg font-semibold">VIP Complaint Escalation</h3>
 </div>
 {dashboardData?.vipComplaints && dashboardData.vipComplaints.length > 0 ? (
 <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex justify-between items-center">
 <div>
 <h5 className="text-sm font-medium">{dashboardData.vipComplaints[0].subject}</h5>
 <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{dashboardData.vipComplaints[0].roomNumber ? `Room ${dashboardData.vipComplaints[0].roomNumber}: ` : ''}{dashboardData.vipComplaints[0].description}</p>
 </div>
 <Button variant="destructive" className="shrink-0 ml-4" onClick={() => router.push('/admin/complaints')}>Resolve Now</Button>
 </div>
 ) : (
 <div className="p-4 bg-emerald-500/10 border border-border rounded-lg flex items-center justify-center">
 <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">All Clear - No Active Escalations</p>
 </div>
 )}
 </Card>
 </div>

 <div className="space-y-8">
 <Card className="bg-card border-border p-6 rounded-xl shadow-sm space-y-6">
 <div className="flex items-center gap-3">
 <Users className="w-5 h-5 text-muted-foreground" />
 <h3 className="font-semibold">Personnel</h3>
 </div>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
 <div>
 <p className="text-sm font-medium">{dashboardData?.guestStats?.totalStaff ?? 0} Staff Active</p>
 <p className="text-xs text-muted-foreground">All Sectors Operational</p>
 </div>
 <div className="w-2 h-2 bg-emerald-500 rounded-full" />
 </div>
 <div className="grid grid-cols-1 gap-3">
 <Button variant="outline" className="w-full" onClick={() => router.push('/admin/staff')}>
 Staff Directory
 </Button>
 <Button variant="outline" className="w-full" onClick={() => router.push('/admin/roles')}>
 Role Permissions
 </Button>
 </div>
 </div>
 </Card>

 <Card className="bg-card border-border p-6 rounded-xl shadow-sm space-y-6">
 <div className="flex items-center gap-3 text-muted-foreground">
 <ArrowUpRight className="w-5 h-5" />
 <h3 className="font-semibold text-sm">Internal Links</h3>
 </div>
 <div className="grid grid-cols-1 gap-2">
 <Button variant="ghost" className="justify-between text-sm px-4" onClick={() => router.push('/admin/rooms')}>
 Room Control <ChevronRight className="w-4 h-4 text-muted-foreground" />
 </Button>
 <Button variant="ghost" className="justify-between text-sm px-4" onClick={() => router.push('/admin/ota')}>
 OTA Management <ChevronRight className="w-4 h-4 text-muted-foreground" />
 </Button>
 <Button variant="ghost" className="justify-between text-sm px-4" onClick={() => router.push('/admin/settings')}>
 System Config <ChevronRight className="w-4 h-4 text-muted-foreground" />
 </Button>
 </div>
 </Card>
 </div>
 </div>
 </AdminPageShell>
 )
}

function AdminDashboardLoading() {
 return (
 <div className="flex items-center justify-center py-20">
 <PremiumSpinner size="lg" text="Decompressing system matrices..." />
 </div>
 )
}

export default function AdminDashboard() {
 return (
 <Suspense fallback={<AdminDashboardLoading />}>
 <AdminDashboardContent />
 </Suspense>
 )
}
