function Modal({ isOpen, onClose, onStart }) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-[1000]"
      onClick={onClose}
    >
      <div 
        className="bg-white/95 backdrop-blur-sm p-7 rounded-3xl max-w-[520px] w-[90%] max-h-[80vh] overflow-y-auto shadow-2xl border border-white/40"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-gray-900 text-2xl font-semibold text-center">Внимание</h2>
        <div className="mb-8 text-gray-700 leading-relaxed text-center text-base">
          <p>
            Играта е интерактивна и включва звук и внезапно появяващи се визуални елементи.
            Нищо стряскащо, но бъди готов за динамично преживяване.
          </p>
        </div>
        <div className="flex justify-center">
          <button 
            className="px-6 py-3 text-[1.1rem] bg-white text-[#8B0000] border-none rounded-full cursor-pointer font-bold whitespace-nowrap shadow-lg transition-all hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md"
            onClick={onStart}
          >
            Започни
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal

