import UnifiedPOS from '@/components/pos/unified-pos'

export const metadata = {
  title: 'Point of Sale | SmartHotel',
}

export default function AdminPOSPage() {
  return (
    <div className="flex-1 bg-background dark:bg-[#090A0C] flex flex-col min-h-screen">
      <div className="p-6 pb-0 border-b border-border dark:border-[#1C2025]">
        <h1 className="text-2xl font-bold text-foreground dark:text-white mb-1">Point of Sale Terminal</h1>
        <p className="text-muted-foreground dark:text-zinc-400 text-xs mb-4">Process orders, add to room charges, and checkout guests.</p>
      </div>
      <UnifiedPOS role="ADMIN" />
    </div>
  )
}
