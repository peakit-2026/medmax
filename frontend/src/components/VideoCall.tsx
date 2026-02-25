import { useVideoChat } from '../hooks/useVideoChat'

function VideoCall({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const { localVideoRef, canvasRef, remoteImageUrl, isConnected, connect, disconnect } =
    useVideoChat(roomId)

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
      <div className="relative w-full max-w-2xl">
        {remoteImageUrl ? (
          <img src={remoteImageUrl} className="w-full rounded" alt="" />
        ) : (
          <div className="w-full aspect-video bg-gray-800 rounded flex items-center justify-center text-white">
            Ожидание собеседника...
          </div>
        )}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute bottom-2 right-2 w-32 rounded border-2 border-white"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="mt-4 flex gap-4">
        {!isConnected ? (
          <button onClick={connect} className="bg-green-600 text-white px-6 py-2 rounded">
            Подключиться
          </button>
        ) : (
          <button onClick={disconnect} className="bg-red-600 text-white px-6 py-2 rounded">
            Отключиться
          </button>
        )}
        <button onClick={onClose} className="bg-gray-600 text-white px-6 py-2 rounded">
          Закрыть
        </button>
      </div>
      <p className="text-gray-400 text-sm mt-2">Аудио через телефонную связь</p>
    </div>
  )
}

export default VideoCall
