"use client"

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  maxImages?: number
}

export function ImageUpload({
  value = [],
  onChange,
  disabled,
  maxImages = 5
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (value.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`)
      return
    }

    setIsUploading(true)
    const newUrls: string[] = [...value]

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'rooms')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('Upload failed')
        
        const data = await response.json()
        newUrls.push(data.url)
      }

      onChange(newUrls)
      toast.success('Images uploaded successfully')
    } catch (error) {
      console.error('Upload Error:', error)
      toast.error('Failed to upload one or more images')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onRemove = (url: string) => {
    onChange(value.filter((current) => current !== url))
  }

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {value.map((url) => {
          const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
          
          return (
            <div 
              key={url} 
              className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shadow-sm transition-all hover:shadow-md"
            >
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  onClick={() => onRemove(url)}
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7 rounded-full shadow-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {isVideo ? (
                <video 
                  src={url} 
                  className="w-full h-full object-cover" 
                  controls 
                  muted 
                />
              ) : (
                <Image
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  alt="Room Media"
                  src={url}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              )}
            </div>
          )
        })}

        {value.length < maxImages && (
          <div
            tabIndex={0}
            role="button"
            aria-label="Upload media"
            onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (!disabled && !isUploading) {
                  fileInputRef.current?.click()
                }
              }
            }}
            className={cn(
              "relative aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:border-primary-400 group focus:outline-none focus:ring-2 focus:ring-primary-500",
              disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-primary-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {value.length === 0 ? "Add Media" : "Add More"}
                </span>
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*, video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={onUpload}
              disabled={disabled || isUploading}
            />
          </div>
        )}
      </div>
      
      {value.length === 0 && !isUploading && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
          <ImageIcon className="h-4 w-4" />
          <span>At least one image or video is recommended for best guest experience.</span>
        </div>
      )}
    </div>
  )
}
