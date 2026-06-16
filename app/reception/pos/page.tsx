import UnifiedPOS from '@/components/pos/unified-pos'

export const metadata = {
  title: 'Reception POS | SmartHotel',
}

export default function ReceptionPOSPage() {
  return (
    <div className="flex-1 bg-[#0c0c0c]">
      <div className="p-6 pb-0 border-b border-white/5 hide-on-print">
        <h1 className="text-2xl font-bold text-white mb-2">Reception Point of Sale</h1>
        <p className="text-white/60 text-sm mb-4">Process guest service items, spa passes, merchandise, and general charges.</p>
      </div>
      <UnifiedPOS role="RECEPTION" />
    </div>
  )
}
