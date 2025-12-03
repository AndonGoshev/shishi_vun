function Modal({ isOpen, onClose, onStart }) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-[1000]"
      onClick={onClose}
    >
      <div 
        className="bg-white p-8 rounded-xl max-w-[500px] w-[90%] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-gray-800 text-3xl">Правила</h2>
        <div className="mb-8 text-gray-600 leading-relaxed">
          <p>Правилата ще бъдат добавени по-късно...</p>
        </div>
        <div className="flex justify-center">
          <button 
            className="px-8 py-3 text-lg bg-indigo-500 text-white border-none rounded-lg cursor-pointer font-bold transition-all hover:bg-indigo-600 hover:-translate-y-0.5 active:translate-y-0"
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

