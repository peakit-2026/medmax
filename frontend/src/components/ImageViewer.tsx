interface Props {
  src: string
  onClose: () => void
}

function ImageViewer({ src, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-3xl"
        onClick={onClose}
      >
        &times;
      </button>
      <img
        src={src}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export default ImageViewer
