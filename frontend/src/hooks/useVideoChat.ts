import { useRef, useState, useCallback } from 'react'

export function useVideoChat(roomId: string) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    streamRef.current = stream
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/videochat/${roomId}`)
    ws.binaryType = 'blob'
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      intervalRef.current = window.setInterval(() => {
        if (localVideoRef.current && ws.readyState === WebSocket.OPEN) {
          canvas.width = 320
          canvas.height = 240
          ctx.drawImage(localVideoRef.current, 0, 0, 320, 240)
          canvas.toBlob(
            (blob) => {
              if (blob && ws.readyState === WebSocket.OPEN) {
                ws.send(blob)
              }
            },
            'image/jpeg',
            0.5,
          )
        }
      }, 150)
    }

    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        const url = URL.createObjectURL(event.data)
        setRemoteImageUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [roomId])

  const disconnect = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    wsRef.current?.close()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setIsConnected(false)
    setRemoteImageUrl(null)
  }, [])

  return { localVideoRef, canvasRef, remoteImageUrl, isConnected, connect, disconnect }
}
