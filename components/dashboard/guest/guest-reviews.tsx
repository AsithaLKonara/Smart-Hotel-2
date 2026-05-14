"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, MessageSquare, Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

export function GuestReviews() {
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!comment) {
      toast.error('Please share your thoughts.')
      return
    }
    setIsSubmitting(true)
    try {
      // Simulate submission
      await new Promise(r => setTimeout(r, 1000))
      toast.success('Thank you for your feedback! It means the world to us.', {
        style: { background: '#0c0c0c', color: '#fff', border: '1px solid #c5a059' },
        icon: '✨'
      })
      setComment('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-10 bg-[#0c0c0c] border-white/[0.05] rounded-[40px] space-y-8">
      <div className="space-y-1">
        <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Your Experience</h3>
        <p className="text-xs text-white/40 font-medium">How are we doing? Your voice shapes our future.</p>
      </div>

      <div className="flex items-center gap-4 py-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star 
              className={`w-10 h-10 ${
                (hoveredRating || rating) >= star 
                  ? 'fill-primary text-primary drop-shadow-[0_0_8px_rgba(197,160,89,0.4)]' 
                  : 'text-white/10'
              } transition-colors`} 
            />
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Textarea 
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="bg-white/[0.03] border-white/10 rounded-[24px] p-6 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[120px]"
        />
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-16 bg-gold-gradient text-white rounded-[24px] uppercase tracking-[0.2em] text-[10px] font-black border-none shadow-luxury flex items-center gap-3"
        >
          {isSubmitting ? 'Submitting...' : (
            <>Submit Review <Send className="w-4 h-4" /></>
          )}
        </Button>
      </div>
    </Card>
  )
}
