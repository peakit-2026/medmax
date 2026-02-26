import { useRef, useState, useCallback, useEffect } from 'react'
import api from '../api/client'

interface WebTransportState {
  isConnected: boolean
  isReconnecting: boolean
  hasCamera: boolean
  hasAudio: boolean
  isMuted: boolean
  isCameraOff: boolean
  hasRemoteVideo: boolean
  error: string | null
}

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  // Don't force sampleRate — many mobile devices only support 44100 Hz
  // and will reject the constraint. The AudioEncoder handles resampling.
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
  const audioTimeRef = useRef(0)
  const waitingKeyframeRef = useRef(true)
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null)

  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxReconnectAttempts = 3

  const [state, setState] = useState<WebTransportState>({
    isConnected: false,
    isReconnecting: false,
    hasCamera: false,
    hasAudio: false,
    isMuted: false,
    isCameraOff: false,
    hasRemoteVideo: false,
    error: null,
  })

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    abortRef.current?.abort()
    abortRef.current = null

    if (videoEncoderRef.current?.state === 'configured') videoEncoderRef.current.close()
    videoEncoderRef.current = null
    if (audioEncoderRef.current?.state === 'configured') audioEncoderRef.current.close()
    audioEncoderRef.current = null
    if (videoDecoderRef.current?.state === 'configured') videoDecoderRef.current.close()
    videoDecoderRef.current = null
    if (audioDecoderRef.current?.state === 'configured') audioDecoderRef.current.close()
    audioDecoderRef.current = null

    audioContextRef.current?.close()
    audioContextRef.current = null

    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    transportRef.current?.close()
    transportRef.current = null

    audioTimeRef.current = 0
    waitingKeyframeRef.current = true
    canvasCtxRef.current = null
    reconnectAttemptRef.current = 0

    setState((s) => ({ ...s, isConnected: false, isReconnecting: false, error: null }))
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
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          reconnectAttemptRef.current++
          const delay = Math.min(1000 * 2 ** (reconnectAttemptRef.current - 1), 4000)
          setState((s) => ({ ...s, isConnected: false, isReconnecting: true }))
          reconnectTimerRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          setState((s) => ({ ...s, isConnected: false, isReconnecting: false }))
        }
      }).catch(() => {})

      setState((s) => ({ ...s, isConnected: true, isReconnecting: false, error: null }))
      reconnectAttemptRef.current = 0

      const abort = new AbortController()
      abortRef.current = abort

      let hasVideo = false
      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: 30 },
          audio: AUDIO_CONSTRAINTS,
        })
        hasVideo = stream.getVideoTracks().length > 0
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: AUDIO_CONSTRAINTS,
          })
        } catch (mediaErr: any) {
          if (mediaErr.name === 'NotAllowedError') {
            setState((s) => ({
              ...s,
              error: 'Нет доступа к камере/микрофону. Разрешите доступ в настройках браузера (значок 🔒 слева от адресной строки).',
            }))
          } else {
            setState((s) => ({
              ...s,
              error: 'Не удалось получить доступ к камере или микрофону.',
            }))
          }
          // Continue without local media — user can still receive
        }
      }
      streamRef.current = stream
      const hasAudio = (stream?.getAudioTracks().length ?? 0) > 0
      setState((s) => ({ ...s, hasCamera: hasVideo, hasAudio }))

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      const biStream = await transport.createBidirectionalStream()
      const videoWriter = biStream.writable.getWriter()

      if (hasVideo) {
        const videoEncoder = new VideoEncoder({
          output: (chunk) => {
            const isKey = chunk.type === 'key'
            const buf = new ArrayBuffer(4 + 1 + 1 + chunk.byteLength)
            const view = new DataView(buf)
            view.setUint32(0, 1 + 1 + chunk.byteLength)
            view.setUint8(4, 0x02)
            view.setUint8(5, isKey ? 0x01 : 0x00)
            const chunkBuf = new Uint8Array(buf, 6)
            chunk.copyTo(chunkBuf)
            videoWriter.write(new Uint8Array(buf)).catch(() => {})
          },
          error: (e) => console.error('VideoEncoder error:', e),
        })

        videoEncoder.configure({
          codec: 'vp8',
          width: 640,
          height: 480,
          bitrate: 500_000,
          framerate: 30,
          latencyMode: 'realtime',
        })
        videoEncoderRef.current = videoEncoder
      }

      const videoTrack = stream?.getVideoTracks()[0]
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
              if (videoEncoder.encodeQueueSize > 5) {
                frame.close()
                continue
              }
              const keyFrame = frameCountRef.current % 30 === 0
              frameCountRef.current++
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
            const keyFrame = frameCountRef.current % 30 === 0
            frameCountRef.current++
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

      const audioTrack = stream?.getAudioTracks()[0]
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
          // Fallback for browsers without MediaStreamTrackProcessor (some mobile browsers)
          const trackSettings = audioTrack.getSettings()
          const captureSampleRate = trackSettings.sampleRate || 48000
          const audioCtx2 = new AudioContext({ sampleRate: captureSampleRate })
          // Critical on mobile: AudioContext starts suspended, must resume via user gesture context
          audioCtx2.resume().catch(() => {})
          const source = audioCtx2.createMediaStreamSource(new MediaStream([audioTrack]))
          const scriptNode = audioCtx2.createScriptProcessor(4096, 1, 1)
          source.connect(scriptNode)
          scriptNode.connect(audioCtx2.destination)
          scriptNode.onaudioprocess = (e) => {
            if (abort.signal.aborted || audioEncoder.state !== 'configured') return
            const input = e.inputBuffer.getChannelData(0)
            const audioData = new AudioData({
              format: 'f32',
              sampleRate: captureSampleRate,
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
      audioCtx.resume().catch(() => {})
      audioTimeRef.current = audioCtx.currentTime

      const videoDecoder = new VideoDecoder({
        output: (frame) => {
          const canvas = remoteCanvasRef.current
          if (!canvas) {
            frame.close()
            return
          }
          if (canvas.width !== frame.displayWidth) canvas.width = frame.displayWidth
          if (canvas.height !== frame.displayHeight) canvas.height = frame.displayHeight
          if (!canvasCtxRef.current) {
            canvasCtxRef.current = canvas.getContext('2d')
          }
          canvasCtxRef.current?.drawImage(frame, 0, 0)
          frame.close()
          setState((s) => s.hasRemoteVideo ? s : { ...s, hasRemoteVideo: true })
        },
        error: (e) => {
          console.error('VideoDecoder error:', e)
          waitingKeyframeRef.current = true
        },
      })

      videoDecoder.configure({
        codec: 'vp8',
      })
      videoDecoderRef.current = videoDecoder

      const audioDecoder = new AudioDecoder({
        output: (audioData) => {
          const duration = audioData.numberOfFrames / audioData.sampleRate
          const now = audioCtx.currentTime
          if (audioTimeRef.current < now) {
            audioTimeRef.current = now + 0.01
          }

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
          source.start(audioTimeRef.current)
          audioTimeRef.current += duration
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
            if (len === 0 || len > 1_000_000) {
              buffer = new Uint8Array(0)
              waitingKeyframeRef.current = true
              break
            }
            if (buffer.length < 4 + len) break

            const packet = buffer.slice(4, 4 + len)
            buffer = buffer.slice(4 + len)

            if (packet.length < 2) continue
            const idLen = packet[0]
            if (packet.length < 1 + idLen + 1) continue
            const pktType = packet[1 + idLen]

            if (pktType === 0x02 && videoDecoder.state === 'configured') {
              const payload = packet.slice(1 + idLen + 1)
              if (payload.length < 2) continue

              const frameTypeByte = payload[0]
              const videoData = payload.slice(1)
              const isKey = frameTypeByte === 0x01

              if (waitingKeyframeRef.current) {
                if (!isKey) continue
                waitingKeyframeRef.current = false
              }

              try {
                const chunk = new EncodedVideoChunk({
                  type: isKey ? 'key' : 'delta',
                  timestamp: performance.now() * 1000,
                  data: videoData,
                })
                videoDecoder.decode(chunk)
              } catch {
                waitingKeyframeRef.current = true
              }
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
              try {
                const chunk = new EncodedAudioChunk({
                  type: 'key',
                  timestamp: performance.now() * 1000,
                  data: audioData,
                })
                audioDecoder.decode(chunk)
              } catch {}
            }
          }
        }
        dgramReader.releaseLock()
      })()

    } catch (e: any) {
      console.error('VideoCall connect error:', e)
      let errorMsg = 'Не удалось подключиться к видеозвонку.'
      if (e.name === 'NotAllowedError' || e.message?.includes('Permission denied')) {
        errorMsg = 'Нет доступа к камере/микрофону. Разрешите доступ в настройках браузера.'
      } else if (e.response?.status === 401 || e.response?.status === 403) {
        errorMsg = 'Ошибка авторизации. Попробуйте перезайти в систему.'
      } else if (e.message) {
        errorMsg = e.message
      }
      setState((s) => ({ ...s, error: errorMsg, isConnected: false }))
    }
  }, [roomId, cleanup])

  const disconnect = useCallback(() => {
    cleanup()
  }, [cleanup])

  const toggleMute = useCallback(() => {
    const audioTrack = streamRef.current?.getAudioTracks()[0]
    if (!audioTrack) return
    audioTrack.enabled = !audioTrack.enabled
    setState((s) => ({ ...s, isMuted: !audioTrack.enabled }))
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
