"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
 AlertTriangle, 
 MessageSquare, 
 Send,
 Clock,
 CheckCircle,
 PhoneCall,
 Loader2
} from 'lucide-react'
import { GuestPageShell } from '@/components/dashboard/guest/guest-page-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ComplaintsPage() {
 const { data: session } = useSession()
 const [complaints, setComplaints] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [submitting, setSubmitting] = useState(false)
 const [formData, setFormData] = useState({ subject: '', description: '', category: 'FACILITIES' })

 useEffect(() => {
 if (session?.user?.id) fetchComplaints()
 }, [session])

 const fetchComplaints = async () => {
 try {
 const res = await fetch('/api/complaints')
 if (res.ok) {
 const data = await res.json()
 setComplaints(data)
 }
 } catch (err) {
 console.error("Failed to fetch complaints")
 } finally {
 setLoading(false)
 }
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!formData.subject || !formData.description) {
 toast.error("Please fill in all required fields")
 return
 }

 setSubmitting(true)
 try {
 const res = await fetch('/api/complaints', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(formData)
 })

 if (res.ok) {
 toast.success("Issue reported. Management has been alerted.")
 setFormData({ subject: '', description: '', category: 'FACILITIES' })
 fetchComplaints()
 } else {
 throw new Error("Failed to submit")
 }
 } catch (err) {
 toast.error("Network error. Please try again or call front desk.")
 } finally {
 setSubmitting(false)
 }
 }

 return (
 <GuestPageShell
 title="Guest Resolution"
 subtitle="Your satisfaction is our priority. Report any issues directly to management for immediate resolution."
 firstName={session?.user?.name?.split(' ')[0]}
 >
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
 {/* Left: Resolution Form */}
 <div className="lg:col-span-7 space-y-8">
 <Card className="bg-card border-border p-10 rounded-xl space-y-8">
 <div className="space-y-2">
 <div className="flex items-center gap-3 text-red-500">
 <AlertTriangle className="w-5 h-5" />
 <h4 className="text-xl font-serif font-bold text-white">Report an Issue</h4>
 </div>
 <p className="text-sm text-muted-foreground">We typically respond within 15 minutes.</p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="space-y-2">
 <label className="text-xs font-bold text-muted-foreground ml-2">Subject</label>
 <input 
 type="text" 
 value={formData.subject}
 onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
 placeholder="What is the issue?"
 className="w-full bg-muted/50 border border-border rounded-lg p-4 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none"
 disabled={submitting}
 />
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-muted-foreground ml-2">Details</label>
 <textarea 
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 placeholder="Describe the problem in detail..."
 className="w-full bg-muted/50 border border-border rounded-lg p-4 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none h-40 resize-none"
 disabled={submitting}
 />
 </div>

 <Button 
 type="submit"
 disabled={submitting}
 className="w-full h-16 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold tracking-[0.2em] text-xs transition-all shadow-lg shadow-red-900/20"
 >
 {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Send className="w-4 h-4 mr-3" />}
 Escalate Issue
 </Button>
 </form>
 </Card>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Card className="bg-primary/5 border-primary/20 p-8 rounded-[30px] flex items-center gap-6">
 <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary">
 <PhoneCall className="w-6 h-6" />
 </div>
 <div>
 <h5 className="font-bold text-white">Emergency</h5>
 <p className="text-xs text-muted-foreground italic">Dial 007 from room phone</p>
 </div>
 </Card>
 <Card className="bg-muted/50 border-border p-8 rounded-[30px] flex items-center gap-6">
 <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white">
 <MessageSquare className="w-6 h-6" />
 </div>
 <div>
 <h5 className="font-bold text-white">Live Chat</h5>
 <p className="text-xs text-muted-foreground italic">Connect with duty manager</p>
 </div>
 </Card>
 </div>
 </div>

 {/* Right: History */}
 <div className="lg:col-span-5 space-y-6">
 <h4 className="text-xs font-bold text-muted-foreground px-2">Resolution History</h4>
 {loading ? (
 <div className="flex justify-center p-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
 ) : complaints.map((cmp) => (
 <Card key={cmp.id} className="bg-card border-border p-8 rounded-[30px] space-y-4">
 <div className="flex items-center justify-between">
 <Badge className={cn(
 "px-3 py-1",
 cmp.status === 'RESOLVED' ? "bg-emerald-500/10 text-emerald-500 border-border" : 
 cmp.status === 'OPEN' ? "bg-amber-500/10 text-amber-500 border-border" : 
 "bg-muted/50 text-muted-foreground"
 )}>
 {cmp.status}
 </Badge>
 <span className="text-xs text-muted-foreground font-bold">
 {new Date(cmp.createdAt).toLocaleDateString()}
 </span>
 </div>
 <div>
 <h5 className="font-bold text-white">{cmp.subject}</h5>
 {cmp.resolvedAt && (
 <p className="text-sm text-muted-foreground mt-2 italic">"{cmp.resolution || 'Issue resolved by management.'}"</p>
 )}
 </div>
 </Card>
 ))}
 {!loading && complaints.length === 0 && (
 <div className="p-10 text-center border-2 border-dashed border-border rounded-xl">
 <p className="text-xs text-muted-foreground font-bold ">No previous issues</p>
 </div>
 )}
 </div>
 </div>
 </GuestPageShell>
 )
}
