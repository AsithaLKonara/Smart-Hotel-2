'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Utensils, Wine, Sparkles, Coffee, Briefcase, ShoppingBag } from 'lucide-react'

const CATEGORIES = [
  { id: 'KITCHEN', label: 'Kitchen', icon: Utensils },
  { id: 'BAR', label: 'Bar', icon: Wine },
  { id: 'SPA', label: 'Spa', icon: Sparkles },
  { id: 'MINIBAR', label: 'Minibar', icon: Coffee },
  { id: 'FACILITIES', label: 'Facilities', icon: Briefcase },
  { id: 'MISC', label: 'Misc', icon: ShoppingBag },
]

export default function ProductGrid({ orderType, setOrderType, onAddToCart }: { orderType: string, setOrderType: (t: string) => void, onAddToCart: (product: any) => void }) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pos/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || [])
        setLoading(false)
      })
  }, [])

  // Filter products based on orderType mapped to categories (or outlet types)
  const filteredProducts = products.filter(p => {
    if (orderType === 'KITCHEN') return p.category === 'Food' || p.outlet?.type === 'RESTAURANT'
    if (orderType === 'BAR') return p.category === 'Beverage' || p.outlet?.type === 'BAR'
    if (orderType === 'SPA') return p.outlet?.type === 'SPA'
    return p.category === orderType || p.outlet?.type === orderType
  })

  return (
    <Card className="flex flex-col h-full bg-[#1a1325] border-purple-500/20">
      <CardHeader className="pb-0 border-b border-gray-800">
        <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setOrderType(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  orderType === cat.id 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-black/50 text-gray-400 hover:bg-black hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">No products found for this category.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => onAddToCart(product)}
                className="bg-black/40 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-500 hover:bg-purple-900/20 transition-all flex flex-col group"
              >
                <div className="flex-1 mb-2">
                  <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">{product.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{product.outlet?.name || product.category}</div>
                </div>
                <div className="font-mono text-purple-400">${Number(product.price || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
