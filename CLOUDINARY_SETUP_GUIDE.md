# 📸 Cloudinary Image Upload Configuration Guide

## Overview
Configure Cloudinary for handling image uploads in SmartHotel (rooms, gallery, menu items).

---

## Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com
2. Sign up for a free account
3. Verify your email
4. Access your dashboard

---

## Step 2: Get API Credentials

From your Cloudinary Dashboard:

```
Cloud Name: your-cloud-name
API Key: 123456789012345
API Secret: your-api-secret-key
```

---

## Step 3: Update Environment Variables

Add to `.env.local`:

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret-key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

---

## Step 4: Install Cloudinary SDK

Already in package.json, but if needed:

```bash
npm install cloudinary
npm install @types/cloudinary --save-dev
```

---

## Step 5: Create Upload API

Create `app/api/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'smarthotel'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `smarthotel/${folder}`,
            resource_type: 'auto'
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })

    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
      publicId: (result as any).public_id
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
```

---

## Step 6: Create Upload Component

Create `components/ui/image-upload.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function ImageUpload({
  onUploadComplete,
  folder = 'general'
}: {
  onUploadComplete: (url: string) => void
  folder?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      toast.success('Image uploaded successfully!')
      onUploadComplete(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setPreview(null)
    onUploadComplete('')
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
          <Image src={preview} alt="Preview" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <>
                <Loader2 className="w-10 h-10 text-gray-400 mb-3 animate-spin" />
                <p className="text-sm text-gray-500">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  )
}
```

---

## Step 7: Update Admin Pages

### For Room Management (`app/admin/rooms/page.tsx`)

Add image upload to the room form:

```typescript
import ImageUpload from '@/components/ui/image-upload'

// In the form
<div>
  <label className="block text-sm font-medium mb-2">Room Image</label>
  <ImageUpload
    folder="rooms"
    onUploadComplete={(url) => {
      // Add to room images array
      setFormData({
        ...formData,
        images: [...formData.images, url]
      })
    }}
  />
</div>
```

### For Menu Management (`app/admin/menu/page.tsx`)

```typescript
<div>
  <label className="block text-sm font-medium mb-2">Menu Item Image</label>
  <ImageUpload
    folder="menu"
    onUploadComplete={(url) => {
      setFormData({ ...formData, image: url })
    }}
  />
</div>
```

### For Gallery Management (`app/admin/gallery/page.tsx`)

```typescript
<div>
  <label className="block text-sm font-medium mb-2">Upload Image</label>
  <ImageUpload
    folder="gallery"
    onUploadComplete={(url) => {
      setFormData({ ...formData, imageUrl: url })
    }}
  />
</div>
```

---

## Step 8: Image Transformation

Cloudinary provides powerful image transformations:

```typescript
// Generate thumbnail
const thumbnailUrl = url.replace('/upload/', '/upload/w_200,h_200,c_fill/')

// Optimize for web
const optimizedUrl = url.replace('/upload/', '/upload/f_auto,q_auto/')

// Responsive images
const responsiveUrl = url.replace('/upload/', '/upload/w_auto,c_scale/')
```

### Helper Function

Create in `lib/cloudinary-helpers.ts`:

```typescript
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: 'fill' | 'scale' | 'fit'
    quality?: 'auto' | number
    format?: 'auto' | 'jpg' | 'png' | 'webp'
  } = {}
) {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  let transformations = []

  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  if (crop) transformations.push(`c_${crop}`)
  if (quality) transformations.push(`q_${quality}`)
  if (format) transformations.push(`f_${format}`)

  const transformString = transformations.join(',')

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`
}
```

---

## Step 9: Delete Images

Create `app/api/upload/delete/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      )
    }

    await cloudinary.uploader.destroy(publicId)

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
```

---

## Step 10: Organize Uploads

### Folder Structure

```
smarthotel/
├── rooms/          # Room images
├── gallery/        # Gallery images
├── menu/           # Food menu images
├── staff/          # Staff photos
└── misc/           # Other uploads
```

### Upload Preset (Optional)

In Cloudinary Dashboard:
1. Go to **Settings** → **Upload**
2. Create upload preset
3. Configure transformations
4. Use in upload API

---

## Testing

### Test Upload

```bash
# Test image upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg" \
  -F "folder=test"
```

---

## Best Practices

1. **Optimize Images**
   - Use `f_auto` for automatic format
   - Use `q_auto` for automatic quality
   - Resize images appropriately

2. **Lazy Loading**
   - Use Next.js Image component
   - Enable lazy loading for better performance

3. **Responsive Images**
   - Generate multiple sizes
   - Use srcset for different screen sizes

4. **Security**
   - Validate file types
   - Limit file sizes
   - Use signed uploads for sensitive content

5. **Organization**
   - Use clear folder structure
   - Add metadata to uploads
   - Tag images appropriately

---

## Production Checklist

- [ ] Create Cloudinary account
- [ ] Get API credentials
- [ ] Add to environment variables
- [ ] Create upload API endpoint
- [ ] Create ImageUpload component
- [ ] Integrate into admin pages
- [ ] Test upload functionality
- [ ] Configure upload presets
- [ ] Setup folder structure
- [ ] Test image transformations
- [ ] Implement delete functionality
- [ ] Add image optimization

---

## Pricing

**Free Tier Includes:**
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month

**Upgrade when:**
- You need more storage
- High traffic requires more bandwidth
- Advanced transformations needed

---

**Status:** Configuration guide complete. Cloudinary is optional but recommended for production image management.





