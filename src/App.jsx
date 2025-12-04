import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import GamePage from './pages/GamePage'
import backgroundMusicUrl from './assets/audio/background-music.mp3'

function App() {
  const audioRef = useRef(null)
  const [isMuted, setIsMuted] = useState(false)

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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
    }
  }, [isMuted])

  // Handle page visibility changes (tab switch, browser minimize, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (audioRef.current) {
        if (document.hidden) {
          // Page is hidden - pause audio
          audioRef.current.pause()
        } else if (!isMuted && audioRef.current.paused) {
          // Page is visible again and not muted - resume if it was playing
          const playPromise = audioRef.current.play()
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.warn('Background music playback was prevented:', error)
            })
          }
        }
      }
    }

    // Handle browser close/refresh
    const handleBeforeUnload = () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }

    const handleUnload = () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleUnload)
    window.addEventListener('pagehide', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
    }
  }, [isMuted])

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

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  const handleStopBackgroundMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  return (
    <div className="w-screen h-screen bg-white flex justify-center items-center overflow-hidden">
      <div className="relative overflow-hidden bg-gray-100 aspect-[430/932] w-full max-w-[500px] h-full max-h-[1083px]">
        <Router>
          <Routes>
            <Route path="/" element={<WelcomePage onStartAudio={handleStartAudio} />} />
            <Route path="/app" element={<GamePage isMuted={isMuted} onToggleMute={handleToggleMute} onStopBackgroundMusic={handleStopBackgroundMusic} />} />
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App

