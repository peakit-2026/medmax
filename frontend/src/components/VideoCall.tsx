import { useEffect, useRef, useState, useCallback } from 'react'
import { Video, VideoOff, Phone, Mic, MicOff, Globe } from 'lucide-react'
import { useWebTransport } from '../hooks/useWebTransport'

interface VideoCallProps {
  roomId: string
  calleeName: string
  calleeRole?: string // 'doctor' | 'surgeon'
  stream?: MediaStream | null // Pre-acquired media stream from click handler
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

const btnCameraDisabled: React.CSSProperties = {
  ...btnBase,
  background: 'rgba(120,120,128,0.24)',
  cursor: 'default',
  opacity: 0.5,
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

const btnMicDisabled: React.CSSProperties = {
  ...btnBase,
  background: 'rgba(120,120,128,0.24)',
  cursor: 'default',
  opacity: 0.5,
}

/* ── Status badge ── */

function StatusBadge({ isReconnecting, connectionLost, isConnecting }: {
  isReconnecting: boolean
  connectionLost: boolean
  isConnecting: boolean
}) {
  if (isReconnecting) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Globe size={16} color="#ff9500" />
        <span style={{ fontSize: 14, color: '#ff9500', fontWeight: 400 }}>
          Переподключение...
        </span>
      </div>
    )
  }
  if (connectionLost) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Globe size={16} color="#ff3b30" />
        <span style={{ fontSize: 14, color: '#ff3b30', fontWeight: 400 }}>
          Соединение потеряно
        </span>
      </div>
    )
  }
  if (isConnecting) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Globe size={16} color="#8E8E93" />
        <span style={{ fontSize: 14, color: '#8E8E93', fontWeight: 400 }}>
          Подключение...
        </span>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Globe size={16} color="#34c759" />
      <span style={{ fontSize: 14, color: '#34c759', fontWeight: 400 }}>
        Подключено
      </span>
    </div>
  )
}

/* ── Component ── */

function VideoCall({ roomId, calleeName, calleeRole, stream: preAcquiredStream, onClose, onCallEnd }: VideoCallProps) {
  const {
    localVideoRef,
    remoteCanvasRef,
    isConnected,
    isReconnecting,
    hasCamera,
    hasAudio,
    isMuted,
    isCameraOff,
    hasRemoteVideo,
    error,
    debugVideoSent,
    debugVideoRecv,
    connect,
    disconnect,
    toggleMute,
    toggleCamera,
  } = useWebTransport(roomId)

  // Track whether we ever connected (to distinguish "connecting" vs "lost connection")
  const wasConnectedRef = useRef(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-connect on mount, passing pre-acquired stream if available
  useEffect(() => {
    const stream = preAcquiredStream ?? null
    console.log('[VideoCall] mount, preAcquiredStream:', stream,
      'video:', stream?.getVideoTracks().length,
      'audio:', stream?.getAudioTracks().length,
      'active:', stream?.active)
    connect(stream)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Connection status
  const connectionLost = wasConnectedRef.current && !isConnected && !isReconnecting
  const isConnecting = !wasConnectedRef.current && !isConnected && !isReconnecting

  const firstLetter = calleeName.charAt(0).toUpperCase()

  // Local camera is active and showing
  const localCameraActive = hasCamera && !isCameraOff && isConnected

  /* ── Local video element — PIP preview when camera is active, hidden otherwise ── */
  const localVideo = (
    <video
      ref={localVideoRef}
      autoPlay
      muted
      playsInline
      style={localCameraActive ? {
        position: 'absolute',
        bottom: 96,
        right: 24,
        width: 120,
        height: 90,
        borderRadius: 12,
        objectFit: 'cover',
        zIndex: 2,
        border: '2px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        background: '#000',
      } : {
        position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' as const,
      }}
    />
  )

  /* ── Buttons (shared between all modes) ── */
  const canToggleCamera = hasCamera
  const canToggleMic = hasAudio
  const buttons = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={canToggleCamera ? toggleCamera : undefined}
        style={canToggleCamera ? btnCamera : btnCameraDisabled}
        title={!canToggleCamera ? 'Камера недоступна' : isCameraOff ? 'Включить камеру' : 'Выключить камеру'}
      >
        {!canToggleCamera || isCameraOff
          ? <VideoOff size={24} color="#fff" />
          : <Video size={24} color="#fff" />}
      </button>
      <button onClick={handleEndCall} style={btnEndCall}>
        <Phone size={24} color="#fff" style={{ transform: 'rotate(135deg)' }} />
        <span>Завершить</span>
      </button>
      <button
        onClick={canToggleMic ? toggleMute : undefined}
        style={canToggleMic ? btnMic : btnMicDisabled}
        title={!canToggleMic ? 'Микрофон недоступен' : isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
      >
        {!canToggleMic || isMuted ? <MicOff size={24} color="#fff" /> : <Mic size={24} color="#fff" />}
      </button>
    </div>
  )

  /* ── MODE: Video active (local camera on, or remote video incoming) ── */
  if (localCameraActive || hasRemoteVideo) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.6)' }}
      >
        {localVideo}
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

          {/* Avatar placeholder when no remote video */}
          {!hasRemoteVideo && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: getAvatarGradient(calleeRole),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 48, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
                  {firstLetter}
                </span>
              </div>
            </div>
          )}

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
            {isReconnecting ? (
              <Globe size={24} color="#ff9500" />
            ) : connectionLost ? (
              <Globe size={24} color="#ff3b30" />
            ) : (
              <Globe size={24} color="#34c759" />
            )}
          </div>

          {/* No camera badge */}
          {!hasCamera && (
            <div
              style={{
                position: 'absolute',
                top: 24,
                right: 56,
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <VideoOff size={16} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                Камера выкл.
              </span>
            </div>
          )}

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

  /* ── MODE: Card (connecting, or audio-only without remote video) ── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
    >
      {localVideo}
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
        <div style={{ marginBottom: 32 }}>
          <StatusBadge
            isReconnecting={isReconnecting}
            connectionLost={connectionLost}
            isConnecting={isConnecting}
          />
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

        {/* Media availability hints */}
        {isConnected && (!hasCamera || !hasAudio) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', marginBottom: 4 }}>
            {!hasCamera && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 8,
                  background: 'rgba(120,120,128,0.08)',
                }}
              >
                <VideoOff size={14} color="rgba(60,60,67,0.6)" />
                <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(60,60,67,0.6)' }}>
                  Камера недоступна
                </span>
              </div>
            )}
            {!hasAudio && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,59,48,0.08)',
                }}
              >
                <MicOff size={14} color="rgba(255,59,48,0.8)" />
                <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,59,48,0.8)' }}>
                  Микрофон недоступен
                </span>
              </div>
            )}
          </div>
        )}

        {/* Timer / status text */}
        {isConnected ? (
          <div style={{ fontSize: 16, fontWeight: 400, color: '#34c759', marginBottom: 32 }}>
            {`Звонок ${formatTimer(elapsedSeconds)}`}
          </div>
        ) : error ? (
          <div style={{ fontSize: 16, fontWeight: 400, color: '#ff3b30', marginBottom: 32, textAlign: 'center', maxWidth: 360 }}>
            {error}
          </div>
        ) : (
          <div style={{ fontSize: 16, fontWeight: 400, color: '#8E8E93', marginBottom: 32 }}>
            Подключение...
          </div>
        )}

        {/* Debug info — temporary */}
        <div style={{ fontSize: 11, color: '#999', textAlign: 'center', marginBottom: 12, fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: 360 }}>
          cam:{hasCamera?'Y':'N'} mic:{hasAudio?'Y':'N'} conn:{isConnected?'Y':'N'} vSent:{debugVideoSent} vRecv:{debugVideoRecv} err:{error ?? 'none'}
        </div>

        {/* Buttons */}
        {buttons}

        {/* Hidden remote canvas (receives frames, will trigger switch to video mode) */}
        <canvas
          ref={remoteCanvasRef}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
      </div>
    </div>
  )
}

export default VideoCall
