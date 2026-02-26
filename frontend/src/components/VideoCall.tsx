import { useEffect, useRef, useState, useCallback } from 'react'
import { Video, VideoOff, Phone, Mic, MicOff, Globe } from 'lucide-react'
import { useWebTransport } from '../hooks/useWebTransport'

interface VideoCallProps {
  roomId: string
  calleeName: string
  calleeRole?: string // 'doctor' | 'surgeon'
  onClose: () => void
  onCallEnd?: () => void
}

/* ── Helpers ── */

function getAvatarGradient(role?: string): string {
  if (role === 'surgeon') return 'linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)'
  if (role === 'doctor') return 'linear-gradient(135deg, #4ECDC4 0%, #2ECC71 100%)'
  return 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/* ── Styles ── */

const MODAL_SHADOW =
  '0px 4px 2px 0px rgba(16,16,18,0.01), 0px 2px 2px 0px rgba(16,16,18,0.02), 0px 1px 1px 0px rgba(16,16,18,0.04), 0px 0px 1px 0px rgba(16,16,18,0.12)'

const BUTTON_INNER_SHADOW = 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)'

const btnBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 16,
  padding: 16,
  border: 'none',
  cursor: 'pointer',
  boxShadow: BUTTON_INNER_SHADOW,
  fontFamily: 'var(--font-sans), Geist, sans-serif',
  fontSize: 16,
  fontWeight: 500,
  color: '#fff',
  lineHeight: 1,
  whiteSpace: 'nowrap',
}

const btnCamera: React.CSSProperties = {
  ...btnBase,
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), rgb(0,122,255)',
}

const btnEndCall: React.CSSProperties = {
  ...btnBase,
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), rgb(255,59,48)',
}

const btnMic: React.CSSProperties = {
  ...btnBase,
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), rgb(16,16,18)',
}

/* ── Component ── */

function VideoCall({ roomId, calleeName, calleeRole, onClose, onCallEnd }: VideoCallProps) {
  const {
    localVideoRef,
    remoteCanvasRef,
    isConnected,
    isMuted,
    isCameraOff,
    error,
    connect,
    disconnect,
    toggleMute,
    toggleCamera,
  } = useWebTransport(roomId)

  // Track whether we ever connected (to distinguish "connecting" vs "lost connection")
  const wasConnectedRef = useRef(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-connect on mount
  useEffect(() => {
    connect()
  }, [connect])

  // Track "was ever connected"
  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true
    }
  }, [isConnected])

  // Call timer: start when connected, stop when disconnected
  useEffect(() => {
    if (isConnected) {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isConnected])

  // End call handler
  const handleEndCall = useCallback(() => {
    disconnect()
    onCallEnd?.()
    onClose()
  }, [disconnect, onCallEnd, onClose])

  // Determine mode
  const showCameraMode = isConnected && !isCameraOff

  // Connection status
  const connectionLost = wasConnectedRef.current && !isConnected
  const isConnecting = !wasConnectedRef.current && !isConnected

  const firstLetter = calleeName.charAt(0).toUpperCase()

  /* ── Buttons (shared between both modes) ── */
  const buttons = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={toggleCamera} style={btnCamera} title={isCameraOff ? 'Включить камеру' : 'Выключить камеру'}>
        {isCameraOff ? <VideoOff size={24} color="#fff" /> : <Video size={24} color="#fff" />}
      </button>
      <button onClick={handleEndCall} style={btnEndCall}>
        <Phone size={24} color="#fff" style={{ transform: 'rotate(135deg)' }} />
        <span>{'Завершить звонок'}</span>
      </button>
      <button onClick={toggleMute} style={btnMic} title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}>
        {isMuted ? <MicOff size={24} color="#fff" /> : <Mic size={24} color="#fff" />}
      </button>
    </div>
  )

  /* ── Hidden elements for local video & remote canvas ── */
  const hiddenMedia = (
    <>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />
      {/* Remote canvas: hidden in mode 1, visible in mode 2 */}
    </>
  )

  /* ── MODE 1: No camera / Connecting / Camera off ── */
  if (!showCameraMode) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.6)' }}
      >
        {hiddenMedia}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            background: '#fff',
            borderRadius: 32,
            boxShadow: MODAL_SHADOW,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '48px 40px 40px',
            fontFamily: 'var(--font-sans), Geist, sans-serif',
          }}
        >
          {/* Status indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 32,
            }}
          >
            {connectionLost ? (
              <>
                <Globe size={16} color="#ff3b30" />
                <span style={{ fontSize: 14, color: '#ff3b30', fontWeight: 400 }}>
                  {'Соединение потеряно'}
                </span>
              </>
            ) : isConnecting ? (
              <>
                <Globe size={16} color="#8E8E93" />
                <span style={{ fontSize: 14, color: '#8E8E93', fontWeight: 400 }}>
                  {'Подключение...'}
                </span>
              </>
            ) : (
              <>
                <Globe size={16} color="#34c759" />
                <span style={{ fontSize: 14, color: '#34c759', fontWeight: 400 }}>
                  {'Подключено'}
                </span>
              </>
            )}
          </div>

          {/* Avatar */}
          <div
            style={{
              width: 176,
              height: 176,
              borderRadius: '50%',
              background: getAvatarGradient(calleeRole),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 72, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
              {firstLetter}
            </span>
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: '#101012',
              letterSpacing: -1,
              marginBottom: 4,
              textAlign: 'center',
            }}
          >
            {calleeName}
          </div>

          {/* Timer / status text */}
          {isConnected ? (
            <div style={{ fontSize: 16, fontWeight: 400, color: '#34c759', marginBottom: 32 }}>
              {`Звонок ${formatTimer(elapsedSeconds)}`}
            </div>
          ) : error ? (
            <div style={{ fontSize: 16, fontWeight: 400, color: '#ff3b30', marginBottom: 32 }}>
              {error}
            </div>
          ) : (
            <div style={{ fontSize: 16, fontWeight: 400, color: '#8E8E93', marginBottom: 32 }}>
              {'Подключение...'}
            </div>
          )}

          {/* Buttons */}
          {buttons}

          {/* Hidden remote canvas for when we switch to mode 2 */}
          <canvas
            ref={remoteCanvasRef}
            style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
          />
        </div>
      </div>
    )
  }

  /* ── MODE 2: Camera active ── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
    >
      {hiddenMedia}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 800,
          aspectRatio: '4/3',
          borderRadius: 32,
          overflow: 'hidden',
          boxShadow: MODAL_SHADOW,
          background: '#000',
        }}
      >
        {/* Remote video canvas fills container */}
        <canvas
          ref={remoteCanvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Top gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
            borderRadius: '32px 32px 0 0',
            pointerEvents: 'none',
          }}
        />

        {/* Bottom gradient overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 200,
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
            borderRadius: '0 0 32px 32px',
            pointerEvents: 'none',
          }}
        />

        {/* Top-left: avatar + name */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: getAvatarGradient(calleeRole),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
              {firstLetter}
            </span>
          </div>
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#fff',
                lineHeight: 1.2,
                fontFamily: 'var(--font-sans), Geist, sans-serif',
              }}
            >
              {calleeName}
            </div>
            {isConnected && (
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: '#34c759',
                  fontFamily: 'var(--font-sans), Geist, sans-serif',
                }}
              >
                {`Звонок ${formatTimer(elapsedSeconds)}`}
              </div>
            )}
          </div>
        </div>

        {/* Top-right: connection status */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            zIndex: 1,
          }}
        >
          {connectionLost ? (
            <Globe size={24} color="#ff3b30" />
          ) : (
            <Globe size={24} color="#34c759" />
          )}
        </div>

        {/* Bottom center: buttons */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {buttons}
        </div>
      </div>
    </div>
  )
}

export default VideoCall
