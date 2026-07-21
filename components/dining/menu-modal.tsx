"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { Badge } from '@/components/ui/badge'
import { Utensils, Info } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  category: string
  price: number
  available: boolean
  preparationTime: number
}

interface MenuModalProps {
  isOpen: boolean
  onClose: () => void
  venueName: string
}

export function MenuModal({ isOpen, onClose, venueName }: MenuModalProps) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchMenuItems()
    }
  }, [isOpen])

  const fetchMenuItems = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/restaurant/menu')
      const data = await res.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const categories = Array.from(new Set(items.map(item => item.category)))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0c0c0c] border-white/10 text-white max-w-2xl rounded-[32px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold text-white">{venueName} Menu</DialogTitle>
          <DialogDescription className="text-white/40">
            A curated selection of our finest culinary creations.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <PremiumSpinner text="Curating flavors..." />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Utensils className="w-12 h-12 text-white/10 mx-auto" />
            <p className="text-white/40">The menu is being updated. Please check back soon.</p>
          </div>
        ) : (
          <div className="space-y-12 py-6">
            {categories.map(category => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary">{category}</h3>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {items.filter(item => item.category === category).map(item => (
                    <div key={item.id} className="group space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{item.name}</h4>
                        <span className="text-sm font-serif italic text-primary">${Number(item.price || 0).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-white/40 font-light leading-relaxed">{item.description}</p>
                      <div className="flex items-center gap-3 pt-2">
                        {item.preparationTime && (
                          <span className="text-[9px] uppercase tracking-tighter text-white/20 font-bold">
                            Prep: {item.preparationTime} mins
                          </span>
                        )}
                        {!item.available && (
                          <Badge variant="outline" className="text-[8px] border-red-500/20 text-red-500 bg-red-500/5">Temporarily Unavailable</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
          <Info className="w-4 h-4 text-primary mt-0.5" />
          <p className="text-[10px] text-white/40 leading-relaxed font-medium">
            Please inform your server of any food allergies or dietary restrictions. Prices are in USD and exclude applicable taxes and service charges.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
