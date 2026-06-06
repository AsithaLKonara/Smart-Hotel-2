import POSSystem from '@/components/pos/pos-system'

export const metadata = {
  title: 'Point of Sale | SmartHotel',
}

export default function AdminPOSPage() {
  return (
    <div className="flex-1 bg-[#0c0c0c]">
      <div className="p-6 pb-0 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white mb-2">Point of Sale</h1>
        <p className="text-white/60 text-sm mb-4">Process orders, items, and billing for guests and walk-ins.</p>
      </div>
      <POSSystem role="ADMIN" />
    </div>
  )
}
