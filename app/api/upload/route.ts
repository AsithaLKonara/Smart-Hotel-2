import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Determine type (image or video)
    const isVideo = file.type.startsWith('video/')
    const baseDir = isVideo ? 'videos' : 'images'
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const extension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
    const fileName = `${crypto.randomUUID()}-${Date.now()}.${extension}`
    
    // Define public upload directory path
    // For VPS storage in Next.js, we save to the public folder so it can be served statically
    const uploadDir = join(process.cwd(), 'public', 'uploads', baseDir, folder)
    const filePath = join(uploadDir, fileName)

    // Ensure directories exist
    await mkdir(uploadDir, { recursive: true })

    // Write file locally
    await writeFile(filePath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/${baseDir}/${folder}/${fileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      publicId: fileName,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

