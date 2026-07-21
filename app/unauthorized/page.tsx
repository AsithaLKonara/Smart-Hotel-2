'use client'

import Link from 'next/link'
import { ShieldOff, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldOff className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Error Code */}
        <p className="text-sm font-semibold uppercase tracking-widest text-red-400 mb-3">
          Access Denied · 403
        </p>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Not Authorized
        </h1>

        {/* Description */}
        <p className="text-white/50 text-base mb-10 leading-relaxed">
          You don&apos;t have permission to access this page. If you believe this is a mistake, please contact your system administrator.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white/60 hover:text-white border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-white font-semibold">
            <Link href="/admin/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
