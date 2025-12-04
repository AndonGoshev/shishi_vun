import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'

function WelcomePage({ onStartAudio }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  const handleStartClick = () => {
    if (onStartAudio) {
      onStartAudio()
    }
    navigate('/app')
  }

  return (
    <div className="w-full h-full flex justify-center items-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div className="text-center">
        <h1 className="text-5xl text-white mb-8 drop-shadow-md">Asensreshtupeevski</h1>
        <button
          className="px-8 py-4 text-xl bg-white text-[#667eea] border-none rounded-lg cursor-pointer font-bold transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg active:translate-y-0"
          onClick={() => setIsModalOpen(true)}
        >
          Правила
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStart={handleStartClick}
      />
    </div>
  )
}

export default WelcomePage

