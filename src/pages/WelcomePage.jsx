import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import parliamentBg from '../assets/images/parliament-bg.png'
import logo from '../assets/images/logo.png'

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
    <div
      className="relative w-full h-full flex justify-center items-center bg-cover bg-center"
      style={{ backgroundImage: `url(${parliamentBg})` }}
    >
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
      <div className="relative z-10 mx-6 text-center">
        <h1 className="text-4xl sm:text-4xl font-bold text-white mb-2 drop-shadow-md leading-tight">
          Готов ли си за протеста?
        </h1>
        <p className="mb-6 text-base sm:text-lg text-white/90 drop-shadow">
          Помогни на Асен да изкара Пеевски от парламента
        </p>
        <button
          className="px-6 py-3 text-[1.1rem] bg-white text-[#8B0000] border-none rounded-full cursor-pointer font-bold whitespace-nowrap shadow-lg transition-all hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md"
          onClick={() => setIsModalOpen(true)}
        >
          Начало
        </button>
      </div>
      <a
        href="https://www.webstudio28.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 inline-flex"
      >
        <img
          src={logo}
          alt="WebStudio28"
          className="h-12 w-auto drop-shadow-lg transition-transform hover:-translate-y-0.5"
        />
      </a>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStart={handleStartClick}
      />
    </div>
  )
}

export default WelcomePage

