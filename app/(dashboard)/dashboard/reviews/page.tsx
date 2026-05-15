"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Star, 
  MessageSquare, 
  Send,
  ThumbsUp,
  Award,
  Sparkles,
  Loader2
} from 'lucide-react'
import { GuestPageShell } from '@/components/dashboard/guest/guest-page-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ReviewsPage() {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<any[]>([])
  const [loyalty, setLoyalty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [revRes, loyRes] = await Promise.all([
        fetch('/api/hotel-reviews'),
        fetch('/api/loyalty')
      ])
      
      if (revRes.ok) {
        const revData = await revRes.json()
        // Filter reviews for this user
        setReviews(revData.reviews.filter((r: any) => r.userId === session?.user?.id))
      }
      if (loyRes.ok) {
        const loyData = await loyRes.json()
        setLoyalty(loyData)
      }
    } catch (err) {
      console.error("Failed to fetch reviews data")
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user?.id) {
      fetchData()
    }
  }, [session?.user?.id, fetchData])
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/hotel-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          overallRating: rating,
          comment: comment || 'Shared via Guest Dashboard'
        })
      })

      if (res.ok) {
        toast.success("Thank you for your feedback! You've earned loyalty points.")
        setComment('')
        setRating(5)
        fetchData()
      } else {
        throw new Error("Submission failed")
      }
    } catch (err) {
      toast.error("Could not post review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GuestPageShell
      title="Stay Memories"
      subtitle="Share your experience with us. Your feedback shapes the future of luxury hospitality."
      firstName={session?.user?.name?.split(' ')[0]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Review Form */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="bg-[#0c0c0c] border-white/5 p-10 rounded-[40px] space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
            
            <div className="space-y-2 relative z-10">
              <h4 className="text-2xl font-serif font-bold text-white">Share Your Thoughts</h4>
              <p className="text-sm text-white/40">How would you rate your current stay?</p>
            </div>

            <div className="space-y-10 relative z-10">
              <div className="flex items-center gap-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setRating(s)}
                    className="group transition-all"
                    disabled={submitting}
                  >
                    <Star className={cn(
                      "w-10 h-10 transition-transform",
                      s <= rating ? 'fill-primary text-primary' : 'text-white/10',
                      !submitting && "group-hover:scale-110"
                    )} />
                  </button>
                ))}
                <span className="ml-4 text-xl font-serif font-bold text-white">{rating}.0</span>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Your Experience</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What made your stay special? (Optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none h-48 resize-none"
                  disabled={submitting}
                />
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-16 bg-gold-gradient text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-luxury transition-all hover:scale-[1.02]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Send className="w-4 h-4 mr-3" />}
                Publish Review
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Insights & Past Reviews */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="bg-primary/5 border-primary/20 p-8 rounded-[40px] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <Award className="w-6 h-6" />
            </div>
            <h5 className="font-bold text-white">{loyalty?.tier?.toUpperCase() || 'ELITE'} Contributor</h5>
            <p className="text-xs text-white/40 leading-relaxed">
              Your reviews help us maintain our standards. You currently have <span className="text-primary font-bold">{loyalty?.points || 0} Points</span> in your loyalty account.
            </p>
          </Card>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Your History</h4>
            {loading ? (
               <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : reviews.map((rev) => (
              <Card key={rev.id} className="bg-[#0c0c0c] border-white/5 p-8 rounded-[30px] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {Array.from({ length: rev.overallRating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-[10px] text-white/20 font-black">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h5 className="font-bold text-white">{rev.title || 'Grand Palace Stay'}</h5>
                <p className="text-xs text-white/40 italic leading-relaxed">"{rev.comment}"</p>
              </Card>
            ))}
            {!loading && reviews.length === 0 && (
              <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                <p className="text-xs text-white/20 uppercase font-black tracking-widest">No review history</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </GuestPageShell>
  )
}
