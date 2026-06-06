import POSSystem from '@/components/pos/pos-system'

export const metadata = {
  title: 'Kitchen POS | SmartHotel',
}

export default function KitchenPOSPage() {
  return (
    <div className="flex-1 bg-[#0c0c0c]">
      <div className="p-6 pb-0 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white mb-2">Kitchen Point of Sale</h1>
        <p className="text-white/60 text-sm mb-4">Process food and beverage orders directly from the kitchen.</p>
      </div>
      <POSSystem role="KITCHEN" />
    </div>
  )
}
