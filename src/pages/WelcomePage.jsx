import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'

function WelcomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  const handleStartClick = () => {
    navigate('/app')
  }

  return (
    <div className="w-full h-full flex justify-center items-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="text-center">
        <h1 className="text-5xl text-white mb-8 drop-shadow-lg">Asensreshtupeevski</h1>
        <button 
          className="px-8 py-4 text-xl bg-white text-indigo-500 border-none rounded-lg cursor-pointer font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
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

