import { NextRequest, NextResponse } from 'next/server'

// Cloudinary configuration check
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

// Lazy load Cloudinary only if configured
let cloudinary: any = null
if (isCloudinaryConfigured) {
  try {
    const cloudinaryModule = require('cloudinary')
    cloudinary = cloudinaryModule.v2
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  } catch (error) {
    console.warn('Cloudinary module not available:', error)
  }
}

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

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured || !cloudinary) {
      console.warn('Cloudinary not configured - using base64 fallback for image upload')
      
      // Fallback: Convert to base64 data URL
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      
      // In production, you might want to store this in a database or local storage
      // For now, return the data URL (note: this is not ideal for large files)
      return NextResponse.json({
        success: true,
        url: dataUrl,
        publicId: `local-${Date.now()}-${file.name}`,
        warning: 'Cloudinary not configured - using base64 encoding. Configure Cloudinary for production use.',
      })
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
            resource_type: 'auto',
          },
          (error: any, result: any) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })

    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

