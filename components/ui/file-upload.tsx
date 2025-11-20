"use client"

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface FileUploadProps {
  onUploadComplete: (url: string) => void
  folder?: string
  currentUrl?: string
  accept?: string
  maxSize?: number // in MB
  label?: string
  required?: boolean
}

export function FileUpload({
  onUploadComplete,
  folder = 'general',
  currentUrl,
  accept = 'image/*',
  maxSize = 5,
  label = 'Upload Image',
  required = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (accept === 'image/*' && !file.type.startsWith('image/')) {
      const errorMsg = 'Please select an image file'
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    // Validate file size (maxSize in MB)
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      const errorMsg = `File must be smaller than ${maxSize}MB`
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      toast.success('File uploaded successfully!')
      onUploadComplete(data.url)
      setPreview(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload file'
      setError(errorMsg)
      toast.error(errorMsg)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setPreview(null)
    setError(null)
    onUploadComplete('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {preview ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeFile}
            disabled={uploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <>
                <Loader2 className="w-10 h-10 text-gray-400 mb-3 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {accept === 'image/*' ? 'PNG, JPG, GIF' : 'Any file'} up to {maxSize}MB
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            required={required && !preview}
          />
        </label>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {preview && !uploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Change Image
        </Button>
      )}
    </div>
  )
}

