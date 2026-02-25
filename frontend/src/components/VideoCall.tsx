import { Mic, MicOff, Video, VideoOff, PhoneOff, Wifi, WifiOff } from 'lucide-react'
import { useWebTransport } from '../hooks/useWebTransport'

function VideoCall({ roomId, onClose }: { roomId: string; onClose: () => void }) {
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

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
      <div className="relative w-full max-w-2xl">
        <canvas
          ref={remoteCanvasRef}
          className="w-full rounded bg-gray-800"
          style={{ aspectRatio: '4/3' }}
        />
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
            {error || 'Ожидание подключения...'}
          </div>
        )}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute bottom-2 right-2 w-32 rounded border-2 border-white"
        />
        {isConnected && (
          <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-green-400">
            <Wifi size={14} />
            Подключено
          </div>
        )}
        {!isConnected && error && (
          <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-red-400">
            <WifiOff size={14} />
            Ошибка
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-3">
        {!isConnected ? (
          <button onClick={connect} className="bg-green-600 text-white px-6 py-2 rounded">
            Подключиться
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700'} text-white`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button
              onClick={toggleCamera}
              className={`p-3 rounded-full ${isCameraOff ? 'bg-red-600' : 'bg-gray-700'} text-white`}
            >
              {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
            <button
              onClick={disconnect}
              className="p-3 rounded-full bg-red-600 text-white"
            >
              <PhoneOff size={20} />
            </button>
          </>
        )}
        <button onClick={onClose} className="bg-gray-600 text-white px-6 py-2 rounded">
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default VideoCall
