"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'

interface WebcamCaptureProps {
  onCapture: (base64Image: string) => void
  onCancel: () => void
}

export function WebcamCapture({ onCapture, onCancel }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    const startWebcam = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("WebRTC is not supported in this browser or requires HTTPS/localhost.")
        }

        // Try high quality first, fallback to basic if overconstrained
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          })
        } catch (initialErr) {
          console.warn("High quality camera request failed, falling back to basic camera", initialErr)
          // Fallback to basic
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false
          })
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setIsInitializing(false)
      } catch (err: any) {
        console.error("Webcam error:", err)
        setError(err.message || "Could not access camera. Please check your browser permissions.")
        setIsInitializing(false)
      }
    }

    startWebcam()

    return () => {
      stopWebcam()
    }
  }, [stopWebcam])

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        // Set canvas dimensions to match the video frame
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Extract base64
        const base64Image = canvas.toDataURL('image/jpeg', 0.85)
        stopWebcam()
        onCapture(base64Image)
      }
    }
  }

  const handleCancel = () => {
    stopWebcam()
    onCancel()
  }

  const handleManualRetry = () => {
    setError(null)
    setIsInitializing(true)
    const startWebcam = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("WebRTC is not supported in this browser or requires HTTPS/localhost.")
        }

        let stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false
        })

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setIsInitializing(false)
      } catch (err: any) {
        console.error("Webcam error:", err)
        setError(err.name === 'NotAllowedError' 
          ? "Permission denied. The camera might be locked by another application (like Zoom or OBS) or missing." 
          : err.message || "Could not access camera.")
        setIsInitializing(false)
      }
    }
    startWebcam()
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black/50 border border-white/10 flex flex-col items-center justify-center min-h-[300px]">
      
      {isInitializing && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-black/50 z-10">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <p className="text-xs">Initializing Camera...</p>
        </div>
      )}

      {error ? (
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
            <Camera className="w-6 h-6 text-rose-400" />
          </div>
          <p className="text-sm font-semibold text-rose-400 mb-1">Camera Access Blocked</p>
          <p className="text-xs text-white/50 mb-6 max-w-[250px]">{error}</p>
          <div className="flex gap-3">
            <button onClick={handleCancel} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg transition-all">
              Cancel
            </button>
            <button onClick={handleManualRetry} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all">
              Request Permission
            </button>
          </div>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-auto object-cover max-h-[400px]"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-20">
            <button
              onClick={handleCancel}
              className="p-3 bg-black/60 hover:bg-black/80 text-white/70 hover:text-white rounded-xl backdrop-blur-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleCapture}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <Camera className="w-5 h-5" /> Capture ID
            </button>
          </div>
        </>
      )}
    </div>
  )
}
