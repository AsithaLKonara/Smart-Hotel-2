import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filename, contentType } = await request.json()
    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and contentType are required' }, { status: 400 })
    }

    const s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      }
    })

    const extension = filename.split('.').pop()
    const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}.${extension}`
    const key = `rooms/${uniqueFilename}`

    const { createPresignedPost } = require('@aws-sdk/s3-presigned-post')
    
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 5 * 1024 * 1024], // 5MB limit
        ['starts-with', '$Content-Type', 'image/'], // Must be an image
      ],
      Fields: {
        'Content-Type': contentType,
      },
      Expires: 3600, // 1 hour
    })

    const endpointUrl = new URL(process.env.S3_ENDPOINT || '')
    const publicUrl = `${endpointUrl.protocol}//${process.env.S3_BUCKET_NAME}.${endpointUrl.host}/${key}`

    console.log('✅ Generated POST Policy:', url)

    return NextResponse.json({ url, fields, publicUrl, key })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
