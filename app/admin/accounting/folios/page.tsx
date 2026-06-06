'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FileText, Search, CreditCard, Hotel } from 'lucide-react'

export default function AdvancedFolioManager() {
  const [bookingId, setBookingId] = useState('')
  const [folios, setFolios] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchFolios = () => {
    if (!bookingId) return
    setLoading(true)
    fetch(`/api/admin/accounting/folios?bookingId=${bookingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.folios) setFolios(data.folios)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const createFolio = (type: string) => {
    fetch('/api/admin/accounting/folios', {
      method: 'POST',
      body: JSON.stringify({ bookingId, folioType: type }),
      headers: { 'Content-Type': 'application/json' }
    }).then(() => fetchFolios())
  }

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Folio Manager</h1>
          <p className="text-white/60 text-sm">Split bills, route charges, and manage guest accounts.</p>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Enter Booking ID..." 
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            className="w-64 bg-white/5 border-white/10 text-white"
          />
          <Button onClick={fetchFolios} disabled={loading || !bookingId} className="bg-primary hover:bg-primary/90 text-white">
            <Search className="w-4 h-4 mr-2" /> Load
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-x-auto custom-scrollbar pb-4">
        {folios.length === 0 && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-white/30 border-2 border-dashed border-white/10 rounded-2xl">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p>Enter a Booking ID to load folios</p>
          </div>
        )}

        {folios.map((folio: any) => (
          <Card key={folio.id} className="min-w-[350px] w-[350px] bg-[#1a1a1a] border-white/10 flex flex-col">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="text-white flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {folio.folioType}
                </span>
                <span className="text-xs text-white/40">{folio.invoiceNo}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
              {folio.lineItems?.length === 0 ? (
                <div className="text-center text-white/30 my-8">No charges on this folio</div>
              ) : (
                folio.lineItems?.map((item: any) => (
                  <div key={item.id} className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center cursor-grab hover:bg-white/10 transition-colors">
                    <div>
                      <p className="text-sm text-white font-medium">{item.description}</p>
                      <p className="text-xs text-white/50">{item.category}</p>
                    </div>
                    <p className="text-primary font-bold">${item.totalPrice.toFixed(2)}</p>
                  </div>
                ))
              )}
            </CardContent>
            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="flex justify-between text-lg font-bold text-white mb-4">
                <span>Total Due</span>
                <span className="text-primary">${folio.grandTotal.toFixed(2)}</span>
              </div>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white" disabled={folio.grandTotal <= 0}>
                Settle Folio
              </Button>
            </div>
          </Card>
        ))}

        {folios.length > 0 && (
          <div className="min-w-[350px] w-[350px] flex flex-col gap-4">
            <Button variant="outline" className="h-32 border-dashed border-white/20 bg-transparent text-white/60 hover:text-white hover:bg-white/5" onClick={() => createFolio('INCIDENTALS')}>
              + Add Incidentals Folio
            </Button>
            <Button variant="outline" className="h-32 border-dashed border-white/20 bg-transparent text-white/60 hover:text-white hover:bg-white/5" onClick={() => createFolio('COMPANY')}>
              + Add Company Routing Folio
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
