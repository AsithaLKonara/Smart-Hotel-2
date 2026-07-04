"use client"

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Star, Trash2, ArrowLeft } from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { useRouter } from 'next/navigation'

export default function FeedbackDashboard() {
  const router = useRouter()

  const { data: feedbacks, isLoading, refetch } = useQuery({
    queryKey: ['guest-feedback'],
    queryFn: async () => {
      const res = await fetch('/api/feedback')
      return res.json()
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Loading Feedback..." />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Button variant="ghost" className="-ml-4 text-slate-500 hover:text-slate-900 mb-2" onClick={() => router.push('/admin/crm')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Button>
          <h1 className="text-3xl font-serif text-slate-900 tracking-tight flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-primary" /> Guest Feedback
          </h1>
          <p className="text-slate-500 mt-1">Review and manage guest reviews and ratings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feedbacks?.map((fb: any) => (
          <Card key={fb.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b bg-slate-50/50 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">{fb.title || 'Untitled Review'}</CardTitle>
                <p className="text-xs text-slate-500 mt-1">{fb.user?.name || 'Anonymous Guest'}</p>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < fb.overallRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
              </div>
              <Badge variant="outline" className="text-xs bg-white text-slate-600">
                {fb.targetType}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm text-slate-700 italic line-clamp-3">"{fb.comment}"</p>
              
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-xs text-slate-400">{new Date(fb.createdAt).toLocaleDateString()}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 h-8"
                  onClick={async () => {
                    if (confirm('Delete this feedback?')) {
                      await fetch(`/api/feedback/${fb.id}`, { method: 'DELETE' })
                      refetch()
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {feedbacks?.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-400 border-2 border-dashed rounded-xl">
            No feedback found.
          </div>
        )}
      </div>
    </div>
  )
}
