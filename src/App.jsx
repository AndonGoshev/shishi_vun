import { useCallback, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import GamePage from './pages/GamePage'
import backgroundMusicUrl from './assets/audio/background-music.mp3'

function App() {
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = new Audio(backgroundMusicUrl)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0.3
    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  const handleStartAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('Background music playback was prevented:', error)
      })
    }
  }, [])

  return (
    <div className="w-screen h-screen bg-white flex justify-center items-center overflow-hidden">
      <div className="relative overflow-hidden bg-gray-100 aspect-[430/932] w-full max-w-[500px] h-full max-h-[1083px]">
        <Router>
          <Routes>
            <Route path="/" element={<WelcomePage onStartAudio={handleStartAudio} />} />
            <Route path="/app" element={<GamePage />} />
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App

