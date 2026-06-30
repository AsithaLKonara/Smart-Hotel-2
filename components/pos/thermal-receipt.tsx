'use client'
import { useEffect } from 'react'

export default function ThermalReceipt({ order }: { order: any }) {
  // Automatically trigger print dialog when component renders (which happens after successful order)
  useEffect(() => {
    if (order) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [order])

  if (!order) return null

  return (
    <div className="bg-white text-black font-mono text-sm p-4 w-[80mm] mx-auto absolute top-0 left-0 -z-50 print:z-50 print:block print:w-full print:h-full print:bg-white print:p-0">
      <div className="text-center mb-4">
        <h1 className="font-bold text-xl uppercase mb-1">Smart Hotel POS</h1>
        <div className="text-xs">123 Hotel Avenue, Tech City</div>
        <div className="text-xs">Tel: +1 234 567 890</div>
      </div>
      
      <div className="border-b border-dashed border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Order #:</span>
          <span>{order.id?.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Room:</span>
          <span>{order.room?.number || 'Walk-in'}</span>
        </div>
        <div className="flex justify-between">
          <span>Guest:</span>
          <span className="truncate max-w-[120px] text-right">{order.room?.guestName || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{order.cashierName || 'System'}</span>
        </div>
      </div>

      <div className="mb-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left font-normal py-1">Qty</th>
              <th className="text-left font-normal py-1">Item</th>
              <th className="text-right font-normal py-1">Amt</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any, i: number) => (
              <tr key={i}>
                <td className="py-1 align-top">{item.quantity}</td>
                <td className="py-1 pr-2 align-top break-words max-w-[120px]">{item.name}</td>
                <td className="text-right py-1 align-top">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-black pt-2 mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${order.subtotal?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (10%):</span>
          <span>${order.tax?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-1 pt-1 border-t border-dashed border-black">
          <span>TOTAL:</span>
          <span>${order.total?.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center mt-4">
        <div className="uppercase font-bold mb-1">Payment: {order.paymentMethod?.replace('_', ' ')}</div>
        {order.paymentMethod === 'ROOM_CHARGE' && (
          <div className="text-xs mb-4">Posted to Room Folio</div>
        )}
        <div className="text-xs mt-4">Thank you for your business!</div>
      </div>
    </div>
  )
}
