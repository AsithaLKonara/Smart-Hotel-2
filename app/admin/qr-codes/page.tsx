"use client"

import { useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { QrCode, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'

export default function AdminQRCodesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [qrData, setQrData] = useState<any>(null)
  const [formData, setFormData] = useState({
    roomNumber: '',
    guestId: '',
    type: 'room-service'
  })

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!canAccessReceptionistFeatures(session)) {
    router.push('/auth/signin')
    return null
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setQrData(null)

    try {
      const response = await fetch('/api/qr-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: formData.roomNumber,
          guestId: formData.guestId,
          type: formData.type
        })
      })

      if (!response.ok) throw new Error('Failed to generate QR code')

      const data = await response.json()
      setQrData(data.qrCode)
      toast.success('QR code generated successfully')
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrData?.dataUrl) return

    const link = document.createElement('a')
    link.href = qrData.dataUrl
    link.download = `qr-code-room-${formData.roomNumber}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('QR code downloaded')
  }

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      guestId: '',
      type: 'room-service'
    })
    setQrData(null)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">QR Code Generator</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate QR codes for room service ordering and guest services
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Room Number *</label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                  placeholder="e.g., 101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Guest ID *</label>
                <input
                  type="text"
                  value={formData.guestId}
                  onChange={(e) => setFormData({ ...formData, guestId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                  placeholder="e.g., guest123"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the booking/guest ID from the reservation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">QR Code Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="room-service">Room Service Ordering</option>
                  <option value="concierge">Concierge Services</option>
                  <option value="feedback">Guest Feedback</option>
                  <option value="checkout">Express Checkout</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* QR Code Display */}
        <Card>
          <CardHeader>
            <CardTitle>Generated QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            {qrData ? (
              <div className="space-y-4">
                <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <Image
                    src={qrData.dataUrl}
                    alt="Generated QR Code"
                    width={256}
                    height={256}
                    className="w-64 h-64"
                    unoptimized
                    priority
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Room:</span>
                    <span className="font-medium">{qrData.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Guest ID:</span>
                    <span className="font-medium">{qrData.guestId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium">{qrData.type}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">QR Code URL:</p>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs break-all">
                    {qrData.url}
                  </div>
                </div>

                <Button
                  onClick={handleDownload}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <QrCode className="w-24 h-24 mb-4" />
                <p className="text-lg font-medium">No QR Code Generated</p>
                <p className="text-sm">Fill in the form to generate a QR code</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use QR Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">For Room Service:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>Generate QR code for guest's room</li>
                <li>Print and place in room</li>
                <li>Guest scans to access ordering menu</li>
                <li>Orders automatically linked to room</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Best Practices:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>Generate fresh QR codes for each guest</li>
                <li>Place codes in visible, accessible locations</li>
                <li>Test QR codes before printing</li>
                <li>Keep digital copies for reprinting</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}










