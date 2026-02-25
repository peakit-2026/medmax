import { useRef, useState, useCallback, useEffect } from 'react'
import api from '../api/client'

interface WebTransportState {
  isConnected: boolean
  isMuted: boolean
  isCameraOff: boolean
  error: string | null
}

export function useWebTransport(roomId: string) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteCanvasRef = useRef<HTMLCanvasElement>(null)
  const transportRef = useRef<WebTransport | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoEncoderRef = useRef<VideoEncoder | null>(null)
  const audioEncoderRef = useRef<AudioEncoder | null>(null)
  const videoDecoderRef = useRef<VideoDecoder | null>(null)
  const audioDecoderRef = useRef<AudioDecoder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const frameCountRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const [state, setState] = useState<WebTransportState>({
    isConnected: false,
    isMuted: false,
    isCameraOff: false,
    error: null,
  })

  const cleanup = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null

    videoEncoderRef.current?.close()
    videoEncoderRef.current = null
    audioEncoderRef.current?.close()
    audioEncoderRef.current = null
    videoDecoderRef.current?.close()
    videoDecoderRef.current = null
    audioDecoderRef.current?.close()
    audioDecoderRef.current = null

    audioContextRef.current?.close()
    audioContextRef.current = null

    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    transportRef.current?.close()
    transportRef.current = null

    setState((s) => ({ ...s, isConnected: false, error: null }))
  }, [])

  const connect = useCallback(async () => {
    try {
      cleanup()

      if (typeof WebTransport === 'undefined') {
        setState((s) => ({ ...s, error: 'Ваш браузер не поддерживает видеозвонки. Используйте Chrome или Edge на ПК.' }))
        return
      }

      const { data } = await api.post('/videochat/ticket', { room_id: roomId })
      const { ticket, sfu_url } = data

      const url = `${sfu_url}/?ticket=${ticket}`
      const transport = new WebTransport(url)
      transportRef.current = transport

      await Promise.race([
        transport.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Не удалось подключиться к серверу видео')), 10000)),
      ])

      transport.closed.then(() => {
        setState((s) => ({ ...s, isConnected: false }))
      }).catch(() => {})

      setState((s) => ({ ...s, isConnected: true, error: null }))

      const abort = new AbortController()
      abortRef.current = abort

      let hasVideo = false
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: 30 },
          audio: { sampleRate: 48000, channelCount: 1 },
        })
        hasVideo = stream.getVideoTracks().length > 0
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: { sampleRate: 48000, channelCount: 1 },
        })
      }
      streamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      const biStream = await transport.createBidirectionalStream()
      const videoWriter = biStream.writable.getWriter()

      if (hasVideo) {
        const videoEncoder = new VideoEncoder({
          output: (chunk) => {
            const buf = new ArrayBuffer(4 + 1 + chunk.byteLength)
            const view = new DataView(buf)
            view.setUint32(0, 1 + chunk.byteLength)
            view.setUint8(4, 0x02)
            const chunkBuf = new Uint8Array(buf, 5)
            chunk.copyTo(chunkBuf)
            videoWriter.write(new Uint8Array(buf)).catch(() => {})
          },
          error: (e) => console.error('VideoEncoder error:', e),
        })

        videoEncoder.configure({
          codec: 'avc1.42001e',
          width: 640,
          height: 480,
          bitrate: 500_000,
          framerate: 30,
          latencyMode: 'realtime',
          avc: { format: 'annexb' },
        })
        videoEncoderRef.current = videoEncoder
      }

      const videoTrack = stream.getVideoTracks()[0]
      const videoEncoder = videoEncoderRef.current
      if (videoTrack && videoEncoder) {
        if (typeof MediaStreamTrackProcessor !== 'undefined') {
          const processor = new MediaStreamTrackProcessor({ track: videoTrack })
          const reader = processor.readable.getReader()
          ;(async () => {
            while (!abort.signal.aborted) {
              const { value: frame, done } = await reader.read()
              if (done || !frame) break
              if (videoEncoder.state !== 'configured') {
                frame.close()
                continue
              }
              frameCountRef.current++
              const keyFrame = frameCountRef.current % 60 === 0
              videoEncoder.encode(frame, { keyFrame })
              frame.close()
            }
            reader.releaseLock()
          })()
        } else {
          const canvas = document.createElement('canvas')
          canvas.width = 640
          canvas.height = 480
          const ctx = canvas.getContext('2d')!
          const video = document.createElement('video')
          video.srcObject = new MediaStream([videoTrack])
          video.muted = true
          video.play()
          const interval = setInterval(() => {
            if (abort.signal.aborted || videoEncoder.state !== 'configured') {
              if (abort.signal.aborted) clearInterval(interval)
              return
            }
            ctx.drawImage(video, 0, 0, 640, 480)
            const frame = new VideoFrame(canvas, { timestamp: performance.now() * 1000 })
            frameCountRef.current++
            const keyFrame = frameCountRef.current % 60 === 0
            videoEncoder.encode(frame, { keyFrame })
            frame.close()
          }, 33)
          abort.signal.addEventListener('abort', () => clearInterval(interval))
        }
      }

      const dgramWriter = transport.datagrams.writable.getWriter()

      const audioEncoder = new AudioEncoder({
        output: (chunk) => {
          const buf = new Uint8Array(1 + chunk.byteLength)
          buf[0] = 0x01
          chunk.copyTo(buf.subarray(1))
          dgramWriter.write(buf).catch(() => {})
        },
        error: (e) => console.error('AudioEncoder error:', e),
      })

      audioEncoder.configure({
        codec: 'opus',
        sampleRate: 48000,
        numberOfChannels: 1,
        bitrate: 32_000,
      })
      audioEncoderRef.current = audioEncoder

      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        if (typeof MediaStreamTrackProcessor !== 'undefined') {
          const processor = new MediaStreamTrackProcessor({ track: audioTrack })
          const reader = processor.readable.getReader()
          ;(async () => {
            while (!abort.signal.aborted) {
              const { value: frame, done } = await reader.read()
              if (done || !frame) break
              if (audioEncoder.state !== 'configured') {
                frame.close()
                continue
              }
              audioEncoder.encode(frame)
              frame.close()
            }
            reader.releaseLock()
          })()
        } else {
          const audioCtx2 = new AudioContext({ sampleRate: 48000 })
          const source = audioCtx2.createMediaStreamSource(new MediaStream([audioTrack]))
          const scriptNode = audioCtx2.createScriptProcessor(4096, 1, 1)
          source.connect(scriptNode)
          scriptNode.connect(audioCtx2.destination)
          scriptNode.onaudioprocess = (e) => {
            if (abort.signal.aborted || audioEncoder.state !== 'configured') return
            const input = e.inputBuffer.getChannelData(0)
            const audioData = new AudioData({
              format: 'f32',
              sampleRate: 48000,
              numberOfFrames: input.length,
              numberOfChannels: 1,
              timestamp: performance.now() * 1000,
              data: input,
            })
            audioEncoder.encode(audioData)
            audioData.close()
          }
          abort.signal.addEventListener('abort', () => {
            scriptNode.disconnect()
            source.disconnect()
            audioCtx2.close()
          })
        }
      }

      const audioCtx = new AudioContext({ sampleRate: 48000 })
      audioContextRef.current = audioCtx

      const videoDecoder = new VideoDecoder({
        output: (frame) => {
          const canvas = remoteCanvasRef.current
          if (canvas) {
            canvas.width = frame.displayWidth
            canvas.height = frame.displayHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(frame, 0, 0)
            }
          }
          frame.close()
        },
        error: (e) => console.error('VideoDecoder error:', e),
      })

      videoDecoder.configure({
        codec: 'avc1.42001e',
        optimizeForLatency: true,
      })
      videoDecoderRef.current = videoDecoder

      const audioDecoder = new AudioDecoder({
        output: (audioData) => {
          const buf = audioCtx.createBuffer(
            audioData.numberOfChannels,
            audioData.numberOfFrames,
            audioData.sampleRate,
          )
          for (let ch = 0; ch < audioData.numberOfChannels; ch++) {
            const channelData = new Float32Array(audioData.numberOfFrames)
            audioData.copyTo(channelData, { planeIndex: ch, format: 'f32-planar' })
            buf.copyToChannel(channelData, ch)
          }
          const source = audioCtx.createBufferSource()
          source.buffer = buf
          source.connect(audioCtx.destination)
          source.start()
          audioData.close()
        },
        error: (e) => console.error('AudioDecoder error:', e),
      })

      audioDecoder.configure({
        codec: 'opus',
        sampleRate: 48000,
        numberOfChannels: 1,
      })
      audioDecoderRef.current = audioDecoder

      const videoReader = biStream.readable.getReader()
      ;(async () => {
        let buffer = new Uint8Array(0)
        while (!abort.signal.aborted) {
          const { value, done } = await videoReader.read()
          if (done) break
          if (!value) continue

          const combined = new Uint8Array(buffer.length + value.length)
          combined.set(buffer)
          combined.set(value, buffer.length)
          buffer = combined

          while (buffer.length >= 4) {
            const len = new DataView(buffer.buffer, buffer.byteOffset).getUint32(0)
            if (buffer.length < 4 + len) break

            const packet = buffer.slice(4, 4 + len)
            buffer = buffer.slice(4 + len)

            if (packet.length < 2) continue
            const idLen = packet[0]
            if (packet.length < 1 + idLen + 1) continue
            const pktType = packet[1 + idLen]

            if (pktType === 0x02 && videoDecoder.state === 'configured') {
              const videoData = packet.slice(1 + idLen + 1)
              const isKey = detectKeyframe(videoData)
              const chunk = new EncodedVideoChunk({
                type: isKey ? 'key' : 'delta',
                timestamp: performance.now() * 1000,
                data: videoData,
              })
              videoDecoder.decode(chunk)
            }
          }
        }
        videoReader.releaseLock()
      })()

      const dgramReader = transport.datagrams.readable.getReader()
      ;(async () => {
        while (!abort.signal.aborted) {
          const { value, done } = await dgramReader.read()
          if (done) break
          if (!value || value.length < 3) continue

          const idLen = value[0]
          if (value.length < 1 + idLen + 1) continue
          const pktType = value[1 + idLen]

          if (pktType === 0x01 && audioDecoder.state === 'configured') {
            const audioData = value.slice(1 + idLen + 1)
            if (audioData.length > 0) {
              const chunk = new EncodedAudioChunk({
                type: 'key',
                timestamp: performance.now() * 1000,
                data: audioData,
              })
              audioDecoder.decode(chunk)
            }
          }
        }
        dgramReader.releaseLock()
      })()

    } catch (e: any) {
      setState((s) => ({ ...s, error: e.message || 'Connection failed', isConnected: false }))
    }
  }, [roomId, cleanup])

  const disconnect = useCallback(() => {
    cleanup()
  }, [cleanup])

  const toggleMute = useCallback(() => {
    const audioTrack = streamRef.current?.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setState((s) => ({ ...s, isMuted: !audioTrack.enabled }))
    }
  }, [])

  const toggleCamera = useCallback(() => {
    const videoTrack = streamRef.current?.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setState((s) => ({ ...s, isCameraOff: !videoTrack.enabled }))
    }
  }, [])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return {
    localVideoRef,
    remoteCanvasRef,
    ...state,
    connect,
    disconnect,
    toggleMute,
    toggleCamera,
  }
}

function detectKeyframe(data: Uint8Array): boolean {
  if (data.length < 5) return false

  for (let i = 0; i < Math.min(data.length - 4, 200); i++) {
    if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] === 1) {
      const nalType = data[i + 4] & 0x1f
      if (nalType === 5 || nalType === 7 || nalType === 8) return true
    }
    if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 1 && i + 3 < data.length) {
      const nalType = data[i + 3] & 0x1f
      if (nalType === 5 || nalType === 7 || nalType === 8) return true
    }
  }
  return false
}
