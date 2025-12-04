import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import confetti from 'canvas-confetti'
import parliamentBg from '../assets/images/parliament-bg.png'
import asen from '../assets/images/asen.png'
import peevski from '../assets/images/peevski.png'
import rope from '../assets/images/rope-texture.png'
import protest1 from '../assets/images/protest2.png'
import protest2 from '../assets/images/protest1.png'
import pullSound1Url from '../assets/audio/pull1.wav'
import pullSound2Url from '../assets/audio/pull2.wav'
import pullSound3Url from '../assets/audio/pull3.wav'
import applauseUrl from '../assets/audio/applause.mp3'
import pullVideoStage1Url from '../assets/video/Pull-Special1.mp4'
import pullVideoStage2Url from '../assets/video/pull-special2.mp4'
import pullVideoStage3Url from '../assets/video/pull-special3.mp4'
import pullVideoStage4Url from '../assets/video/pull-special4.mp4'
import pullVideoStage5Url from '../assets/video/pull-special5.mp4'
import './GamePage.css'

const TOTAL_PULLS = 30
const HIGHLIGHT_VIDEOS = {
  10: pullVideoStage1Url,
  20: pullVideoStage4Url,
  30: pullVideoStage5Url,
}
const PEEVSKI_CLICK_OPACITY = [0, 0.33, 0.66, 0.66, 1]
const INITIAL_ROPE_START = { x: 35.17, y: 98.07 }
const INITIAL_ROPE_END = { x: 49.49, y: 56.0 }
const FINAL_ROPE_END = { x: 65.09, y: 67.94 }
const INITIAL_PEEVSKI_HEIGHT = 20
const FINAL_PEEVSKI_HEIGHT = 320
// Fixed point on Asen's image where the rope starts (as percentage of image dimensions)
// These represent where Asen's hand is on his image (0-1 range, where 0.5 = center)
// Detected: 81.5% from left, 50.6% from top of Asen's image
const ASEN_HAND_POINT = { x: 0.815, y: 0.506 }
const SHAKE_DURATION = 200
const ASEN_SHAKE_STRENGTH = 5
const ROPE_SHAKE_STRENGTH = 3
const PEEVSKI_SHAKE_STRENGTH = 2
const LOADER_MIN_DURATION = 2000
const PULL_TO_REFRESH_THRESHOLD = 80

function GamePage({ isMuted, onToggleMute, onStopBackgroundMusic }) {
  const navigate = useNavigate()
  const [clickPosition, setClickPosition] = useState(null)
  const [debugMode, setDebugMode] = useState(true)
  const containerRef = useRef(null)
  const asenRef = useRef(null)
  const [ropeStart, setRopeStart] = useState(INITIAL_ROPE_START)
  const [ropeEnd, setRopeEnd] = useState(INITIAL_ROPE_END)
  const [ropeEditMode, setRopeEditMode] = useState(true)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [ropeImage] = useImage(rope)
  const ropeStrokeColor = '#c49a6c'
  const [pullCount, setPullCount] = useState(0)
  const [peevskiHeight, setPeevskiHeight] = useState(INITIAL_PEEVSKI_HEIGHT)
  const [assetsLoaded, setAssetsLoaded] = useState(false)
  const [showLoaderOverlay, setShowLoaderOverlay] = useState(true)
  const [shakeOffsets, setShakeOffsets] = useState({
    asen: { x: 0, y: 0 },
    peevski: { x: 0, y: 0 },
    rope: { x: 0, y: 0 },
  })
  const shakeTimeoutRef = useRef(null)
  const pullSound1Ref = useRef(null)
  const pullSound2Ref = useRef(null)
  const pullSound3Ref = useRef(null)
  const applauseRef = useRef(null)
  const pullStartYRef = useRef(null)
  const pullTriggeredRef = useRef(false)
  const pullVideoRef = useRef(null)
  const video1Ref = useRef(null)
  const video4Ref = useRef(null)
  const video5Ref = useRef(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showPullVideo, setShowPullVideo] = useState(false)
  const [pullVideoVisible, setPullVideoVisible] = useState(false)
  const [currentPullVideoUrl, setCurrentPullVideoUrl] = useState(null)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [showVictoryModal, setShowVictoryModal] = useState(false)

  const peevskiOpacity = useMemo(() => {
    const index = Math.min(pullCount, PEEVSKI_CLICK_OPACITY.length - 1)
    return PEEVSKI_CLICK_OPACITY[index]
  }, [pullCount])

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return
      const container = containerRef.current
      setContainerSize({
        width: container.offsetWidth,
        height: container.offsetHeight,
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const pullAudio1 = new Audio(pullSound1Url)
    pullAudio1.volume = 0.25
    pullSound1Ref.current = pullAudio1

    const pullAudio2 = new Audio(pullSound2Url)
    pullAudio2.volume = 0.3
    pullSound2Ref.current = pullAudio2

    const pullAudio3 = new Audio(pullSound3Url)
    pullAudio3.volume = 0.35
    pullSound3Ref.current = pullAudio3

    const applauseAudio = new Audio(applauseUrl)
    applauseAudio.volume = 0.7
    applauseAudio.loop = false
    applauseRef.current = applauseAudio

    // Handle page visibility changes - pause all audio/video when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause all pull sounds
        if (pullSound1Ref.current) {
          pullSound1Ref.current.pause()
          pullSound1Ref.current.currentTime = 0
        }
        if (pullSound2Ref.current) {
          pullSound2Ref.current.pause()
          pullSound2Ref.current.currentTime = 0
        }
        if (pullSound3Ref.current) {
          pullSound3Ref.current.pause()
          pullSound3Ref.current.currentTime = 0
        }
        if (applauseRef.current) {
          applauseRef.current.pause()
          applauseRef.current.currentTime = 0
        }
        // Pause videos
        if (pullVideoRef.current) {
          pullVideoRef.current.pause()
        }
        if (video1Ref.current) {
          video1Ref.current.pause()
        }
        if (video4Ref.current) {
          video4Ref.current.pause()
        }
        if (video5Ref.current) {
          video5Ref.current.pause()
        }
      }
    }

    // Handle browser close/refresh
    const handleBeforeUnload = () => {
      if (pullSound1Ref.current) {
        pullSound1Ref.current.pause()
        pullSound1Ref.current.currentTime = 0
      }
      if (pullSound2Ref.current) {
        pullSound2Ref.current.pause()
        pullSound2Ref.current.currentTime = 0
      }
      if (pullSound3Ref.current) {
        pullSound3Ref.current.pause()
        pullSound3Ref.current.currentTime = 0
      }
      if (applauseRef.current) {
        applauseRef.current.pause()
        applauseRef.current.currentTime = 0
      }
      if (pullVideoRef.current) {
        pullVideoRef.current.pause()
        pullVideoRef.current.currentTime = 0
      }
      if (video1Ref.current) {
        video1Ref.current.pause()
        video1Ref.current.currentTime = 0
      }
      if (video4Ref.current) {
        video4Ref.current.pause()
        video4Ref.current.currentTime = 0
      }
      if (video5Ref.current) {
        video5Ref.current.pause()
        video5Ref.current.currentTime = 0
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
      
      pullAudio1.pause()
      pullSound1Ref.current = null
      pullAudio2.pause()
      pullSound2Ref.current = null
      pullAudio3.pause()
      pullSound3Ref.current = null
      if (applauseRef.current) {
        applauseRef.current.pause()
        applauseRef.current = null
      }
      if (pullVideoRef.current) {
        pullVideoRef.current.pause()
        pullVideoRef.current.currentTime = 0
      }
      if (video1Ref.current) {
        video1Ref.current.pause()
        video1Ref.current.currentTime = 0
      }
      if (video4Ref.current) {
        video4Ref.current.pause()
        video4Ref.current.currentTime = 0
      }
      if (video5Ref.current) {
        video5Ref.current.pause()
        video5Ref.current.currentTime = 0
      }
    }
  }, [])

  // Preload videos when component mounts
  useEffect(() => {
    // Force load all videos to preload them
    const preloadVideos = () => {
      if (video1Ref.current) {
        video1Ref.current.load()
      }
      if (video4Ref.current) {
        video4Ref.current.load()
      }
      if (video5Ref.current) {
        video5Ref.current.load()
      }
    }
    
    // Preload immediately
    preloadVideos()
    
    // Also preload after assets are loaded
    if (assetsLoaded) {
      setTimeout(preloadVideos, 100)
    }
  }, [assetsLoaded])

  useEffect(() => {
    let isMounted = true
    let loaderTimeout

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.src = src
        if (img.complete) {
          resolve()
          return
        }
        img.onload = resolve
        img.onerror = reject
      })

    Promise.all([asen, peevski, parliamentBg, rope].map(loadImage))
      .then(() => {
        if (!isMounted) return
        loaderTimeout = setTimeout(() => {
          if (isMounted) {
            setAssetsLoaded(true)
          }
        }, LOADER_MIN_DURATION)
      })
      .catch(() => {
        if (!isMounted) return
        loaderTimeout = setTimeout(() => {
          if (isMounted) {
            setAssetsLoaded(true)
          }
        }, LOADER_MIN_DURATION)
      })

    return () => {
      isMounted = false
      if (loaderTimeout) {
        clearTimeout(loaderTimeout)
      }
    }
  }, [])

  useEffect(() => {
    if (!assetsLoaded) {
      setShowLoaderOverlay(true)
      return
    }

    const fadeTimeout = setTimeout(() => {
      setShowLoaderOverlay(false)
    }, 500)

    return () => clearTimeout(fadeTimeout)
  }, [assetsLoaded])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow

    let scrollTimeout
    let lockTimeout

    if (!assetsLoaded) {
      html.style.overflow = 'auto'
      body.style.overflow = 'auto'

      scrollTimeout = setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }, 100)

      lockTimeout = setTimeout(() => {
        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
      }, 1100)
    } else {
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
    }

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      if (scrollTimeout) clearTimeout(scrollTimeout)
      if (lockTimeout) clearTimeout(lockTimeout)
    }
  }, [assetsLoaded])

  // Calculate rope start point based on fixed point on Asen's image
  useEffect(() => {
    if (
      !containerRef.current ||
      !asenRef.current ||
      !containerSize.width ||
      !containerSize.height ||
      !assetsLoaded
    ) {
      return
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    const asenRect = asenRef.current.getBoundingClientRect()

    // Calculate the hand position on Asen's image
    // asenHandPoint is a ratio (0-1) representing position on the image
    const handX = asenRect.left - containerRect.left + asenRect.width * ASEN_HAND_POINT.x
    const handY = asenRect.top - containerRect.top + asenRect.height * ASEN_HAND_POINT.y

    // Convert to container percentages
    const computedStart = {
      x: (handX / containerRect.width) * 100,
      y: (handY / containerRect.height) * 100,
    }

    setRopeStart(computedStart)
  }, [containerSize.width, containerSize.height, assetsLoaded])

  const ropePoints = useMemo(() => {
    if (!containerSize.width || !containerSize.height) {
      return []
    }

    const startX = (ropeStart.x / 100) * containerSize.width
    const startY = (ropeStart.y / 100) * containerSize.height
    const endX = (ropeEnd.x / 100) * containerSize.width
    const endY = (ropeEnd.y / 100) * containerSize.height

    return [startX, startY, endX, endY]
  }, [containerSize.width, containerSize.height, ropeStart.x, ropeStart.y, ropeEnd.x, ropeEnd.y])

  const adjustedRopePoints = useMemo(() => {
    if (ropePoints.length !== 4) return ropePoints
    const [startX, startY, endX, endY] = ropePoints
    return [
      startX + shakeOffsets.rope.x,
      startY + shakeOffsets.rope.y,
      endX + shakeOffsets.rope.x,
      endY + shakeOffsets.rope.y,
    ]
  }, [ropePoints, shakeOffsets.rope.x, shakeOffsets.rope.y])

  const desiredRopeThickness = 6

  const ropeSegments = useMemo(() => {
    if (!ropeImage || ropePoints.length !== 4) return []

    const [startX, startY, endX, endY] = ropePoints
    const deltaX = endX - startX
    const deltaY = endY - startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (distance === 0) return []

    const angleRad = Math.atan2(deltaY, deltaX)
    const angleDeg = (angleRad * 180) / Math.PI
    const unitX = deltaX / distance
    const unitY = deltaY / distance

    const scale = desiredRopeThickness / ropeImage.height
    const segmentLength = ropeImage.width * scale
    const segments = []

    // Ensure at least one segment even for very short ropes
    const cappedSegmentLength = segmentLength > 0 ? segmentLength : distance

    for (let traveled = 0; traveled < distance; traveled += cappedSegmentLength) {
      const centerDistance = Math.min(traveled + cappedSegmentLength / 2, distance)
      const x = startX + unitX * centerDistance
      const y = startY + unitY * centerDistance

      segments.push({
        x,
        y,
        rotation: angleDeg,
        scale,
      })
    }

    return segments
  }, [ropeImage, ropePoints])

  const triggerShake = () => {
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current)
    }

    const randomOffset = (strength, horizontalOnly = false) => ({
      x: (Math.random() - 0.5) * strength,
      y: horizontalOnly ? 0 : (Math.random() - 0.5) * strength,
    })

    // Asen, rope, and Peevski move left first (negative x), then return to original
    setShakeOffsets({
      asen: { x: -ASEN_SHAKE_STRENGTH, y: 0 },
      peevski: { x: -PEEVSKI_SHAKE_STRENGTH, y: 0 },
      rope: { x: -ROPE_SHAKE_STRENGTH, y: 0 },
    })

    // After half the duration, return all to original position
    setTimeout(() => {
      setShakeOffsets((prev) => ({
        ...prev,
        asen: { x: 0, y: 0 },
        peevski: { x: 0, y: 0 },
        rope: { x: 0, y: 0 },
      }))
    }, SHAKE_DURATION / 2)

    shakeTimeoutRef.current = setTimeout(() => {
      setShakeOffsets({
        asen: { x: 0, y: 0 },
        peevski: { x: 0, y: 0 },
        rope: { x: 0, y: 0 },
      })
      shakeTimeoutRef.current = null
    }, SHAKE_DURATION)
  }

  const playPullHighlightVideo = (videoUrl) => {
    if (!videoUrl) return
    
    setCurrentPullVideoUrl(videoUrl)
    setShowPullVideo(true)
    setIsVideoPlaying(true)
    requestAnimationFrame(() => {
      setPullVideoVisible(true)
      setTimeout(() => {
        const video = pullVideoRef.current
        if (video) {
          video.volume = 0.7
          video.currentTime = 0
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('Pull video playback blocked', err)
              handlePullVideoEnded()
            })
          }
        }
      }, 60)
    })
  }

  const handlePullVideoEnded = () => {
    setIsVideoPlaying(false)
    setPullVideoVisible(false)
    setTimeout(() => {
      if (pullVideoRef.current) {
        pullVideoRef.current.pause()
        pullVideoRef.current.currentTime = 0
      }
      setShowPullVideo(false)
      setCurrentPullVideoUrl(null)
      if (pullCount >= TOTAL_PULLS) {
        // Stop background music and play applause after final video
        if (onStopBackgroundMusic) {
          onStopBackgroundMusic()
        }
        if (applauseRef.current) {
          applauseRef.current.currentTime = 0
          const playPromise = applauseRef.current.play()
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('Applause playback blocked', err)
            })
          }
        }
        setGameCompleted(true)
        setShowVictoryModal(true)
      }
    }, 300)
  }

  // Trigger confetti when victory modal shows
  useEffect(() => {
    if (showVictoryModal) {
      const colors = ['#8B0000', '#FFD700', '#FF6B6B', '#4ECDC4']

      // Single initial burst from center
      confetti({
        particleCount: 500,
        spread: 160,
        origin: { x: 0.5, y: 0.5 },
        colors: colors,
      })

      // One more smaller burst after a delay
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { x: 0.5, y: 0.5 },
          colors: colors,
        })
      }, 1500)
    }
  }, [showVictoryModal])

  const handlePull = () => {
    if (isVideoPlaying) return
    if (pullCount >= TOTAL_PULLS) return

    const nextCount = pullCount + 1
    const progress = nextCount / TOTAL_PULLS

    const newRopeEnd = {
      x: INITIAL_ROPE_END.x + (FINAL_ROPE_END.x - INITIAL_ROPE_END.x) * progress,
      y: INITIAL_ROPE_END.y + (FINAL_ROPE_END.y - INITIAL_ROPE_END.y) * progress,
    }

    const newPeevskiHeight =
      INITIAL_PEEVSKI_HEIGHT + (FINAL_PEEVSKI_HEIGHT - INITIAL_PEEVSKI_HEIGHT) * progress

    setPullCount(nextCount)
    setRopeEnd(newRopeEnd)
    setPeevskiHeight(newPeevskiHeight)
    const isFinalPull = nextCount === TOTAL_PULLS
    const isTenthPull = nextCount % 10 === 0
    const isFifthPull = nextCount % 5 === 0

    let pullAudio = pullSound1Ref.current
    if (isFinalPull) {
      pullAudio = pullSound3Ref.current
    } else if (isTenthPull) {
      pullAudio = pullSound3Ref.current
    } else if (isFifthPull) {
      pullAudio = pullSound2Ref.current
    }

    if (pullAudio) {
      pullAudio.currentTime = 0
      pullAudio.play().catch((err) => {
        console.warn('Pull sound blocked', err)
      })
    }

    const highlightVideoUrl = HIGHLIGHT_VIDEOS[nextCount] || null

    if (highlightVideoUrl) {
      playPullHighlightVideo(highlightVideoUrl)
    }

    triggerShake()
  }

  const resetGame = () => {
    if (pullVideoRef.current) {
      pullVideoRef.current.pause()
      pullVideoRef.current.currentTime = 0
    }
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current)
      shakeTimeoutRef.current = null
    }
    setPullCount(0)
    setRopeEnd(INITIAL_ROPE_END)
    setPeevskiHeight(INITIAL_PEEVSKI_HEIGHT)
    setIsVideoPlaying(false)
    setShowPullVideo(false)
    setPullVideoVisible(false)
    setCurrentPullVideoUrl(null)
    setGameCompleted(false)
    setShowVictoryModal(false)
    setShakeOffsets({
      asen: { x: 0, y: 0 },
      peevski: { x: 0, y: 0 },
      rope: { x: 0, y: 0 },
    })
  }

  const handleContainerClick = (e) => {
    if (!debugMode || !assetsLoaded) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const percentX = (x / rect.width) * 100
    const percentY = (y / rect.height) * 100
    
    setClickPosition({
      x: x.toFixed(0),
      y: y.toFixed(0),
      percentX: percentX.toFixed(2),
      percentY: percentY.toFixed(2)
    })
    
    // If rope edit mode is active, only set end point on click (not start point)
    // Start point is always calculated from Asen's hand position
    if (ropeEditMode) {
      const target = e.target.closest('.rope-handle-end')
      if (target?.classList.contains('rope-handle-end')) {
        setRopeEnd({ x: parseFloat(percentX.toFixed(2)), y: parseFloat(percentY.toFixed(2)) })
      }
    }
    
    console.log(`Position: ${percentX}% ${percentY}% (${x}px, ${y}px)`)
  }

  const copyCoordinates = async (e) => {
    e.stopPropagation()
    if (!clickPosition) return
    
    const coordinates = `left: ${clickPosition.percentX}%, top: ${clickPosition.percentY}%`
    try {
      await navigator.clipboard.writeText(coordinates)
      alert('Coordinates copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-cover bg-center bg-no-repeat relative game-page-container"
      style={{ backgroundImage: `url(${parliamentBg})` }}
      onClick={handleContainerClick}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        aria-label="Назад"
        className="absolute top-16 left-4 z-[120] flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-[#8B0000] shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 focus:outline-none"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        className="absolute top-28 left-4 z-[120] flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-[#8B0000] shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 focus:outline-none"
      >
        {isMuted ? (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
      {showLoaderOverlay && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/60 text-white text-lg font-semibold z-50 transition-opacity duration-500 ${assetsLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border-4 border-white/70 border-t-transparent rounded-full animate-spin" />
            <span>Зареждане...</span>
          </div>
        </div>
      )}

      {assetsLoaded && (
        <>
          {/* Debug overlay */}
          {debugMode && (
            <div
              className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-h-[80vh] overflow-y-auto"
              style={{ display: 'none' }}
            >
              <div className="mb-2 font-bold">Debug Mode - Click to get coordinates</div>
              {clickPosition && (
                <div>
                  <div>X: {clickPosition.percentX}% ({clickPosition.x}px)</div>
                  <div>Y: {clickPosition.percentY}% ({clickPosition.y}px)</div>
                  <div className="mt-2 text-yellow-300">
                    Use: left: {clickPosition.percentX}%, top: {clickPosition.percentY}%
                  </div>
                  <button
                    onClick={copyCoordinates}
                    className="mt-2 px-2 py-1 bg-blue-600 rounded text-white text-xs hover:bg-blue-700"
                  >
                    Copy Coordinates
                  </button>
                </div>
              )}

              {/* Rope Position Editor */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="font-bold mb-2">Rope Position Editor</div>
                <div className="mb-2">
                  <label className="block text-xs mb-1">Start Point (Asen's hands) - Auto-calculated</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={ropeStart.x.toFixed(2)}
                      disabled
                      className="w-20 px-1 py-0.5 text-black rounded text-xs bg-gray-200 cursor-not-allowed"
                      placeholder="X %"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={ropeStart.y.toFixed(2)}
                      disabled
                      className="w-20 px-1 py-0.5 text-black rounded text-xs bg-gray-200 cursor-not-allowed"
                      placeholder="Y %"
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-xs mb-1">End Point (Peevski)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={ropeEnd.x}
                      onChange={(e) => setRopeEnd({ ...ropeEnd, x: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-1 py-0.5 text-black rounded text-xs"
                      placeholder="X %"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={ropeEnd.y}
                      onChange={(e) => setRopeEnd({ ...ropeEnd, y: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-1 py-0.5 text-black rounded text-xs"
                      placeholder="Y %"
                    />
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setRopeEditMode(!ropeEditMode)
                  }}
                  className={`mt-2 px-2 py-1 rounded text-white text-xs ${ropeEditMode ? 'bg-green-600' : 'bg-gray-600'}`}
                >
                  {ropeEditMode ? '✓ Click to Set' : 'Click Mode Off'}
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDebugMode(false)
                }}
                className="mt-2 px-2 py-1 bg-red-600 rounded text-white text-xs"
              >
                Disable Debug
              </button>
            </div>
          )}

          {/* Rope handles for visual editing */}
          {ropeEditMode && debugMode && (
            <>
              <div
                className="hidden absolute w-4 h-4 bg-green-500 border-2 border-white rounded-full z-50 rope-handle-start pointer-events-none"
                style={{ left: `${ropeStart.x}%`, top: `${ropeStart.y}%`, transform: 'translate(-50%, -50%)' }}
                title="Rope start (fixed to Asen's hand - not editable)"
              />
              <div
                className="hidden absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full cursor-pointer z-50 rope-handle-end"
                style={{ left: `${ropeEnd.x}%`, top: `${ropeEnd.y}%`, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => e.stopPropagation()}
              />
            </>
          )}

          {/* Asen at bottom left */}
          <img
            src={asen}
            alt="Asen"
            className="asen-character"
            ref={asenRef}
            style={{
              transform: `translate(${shakeOffsets.asen.x}px, ${shakeOffsets.asen.y}px)`
            }}
          />

          <img
            src={protest1}
            alt="Protest crowd left"
            className="protest-image protest-left"
          />

          <img
            src={protest2}
            alt="Protest crowd right"
            className="protest-image protest-right"
          />

          {/* Rope connecting asen to peevski using Konva */}
          {containerSize.width > 0 && containerSize.height > 0 && ropePoints.length === 4 && (
            <Stage
              width={containerSize.width}
              height={containerSize.height}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ zIndex: 20 }}
              listening={false}
            >
              <Layer>
                {ropeSegments.length > 0 && ropeImage ? (
                  ropeSegments.map((segment, index) => (
                    <KonvaImage
                      key={`rope-segment-${index}`}
                      image={ropeImage}
                      x={segment.x + shakeOffsets.rope.x}
                      y={segment.y + shakeOffsets.rope.y}
                      offsetX={ropeImage.width / 2}
                      offsetY={ropeImage.height / 2}
                      scaleX={segment.scale}
                      scaleY={segment.scale}
                      rotation={segment.rotation}
                    />
                  ))
                ) : (
                  <Line
                    points={adjustedRopePoints}
                    stroke={ropeStrokeColor}
                    strokeWidth={desiredRopeThickness}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}
              </Layer>
            </Stage>
          )}

          {/* Peevski at end of rope */}
          <img
            src={peevski}
            alt="Peevski"
            className="peevski-character"
            style={{
              left: `${ropeEnd.x}%`,
              top: `${ropeEnd.y}%`,
              transform: `translate(-15%, -53%) translate(${shakeOffsets.peevski.x}px, ${shakeOffsets.peevski.y}px)`,
              height: `${peevskiHeight}px`,
              opacity: peevskiOpacity,
            }}
          />

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 z-[100]">
            <button
              onClick={gameCompleted ? resetGame : handlePull}
              disabled={(!gameCompleted && pullCount >= TOTAL_PULLS) || isVideoPlaying}
              className="px-6 py-3 text-[1.1rem] bg-white text-[#8B0000] border-none rounded-full cursor-pointer font-bold whitespace-nowrap shadow-lg transition-all hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {gameCompleted ? 'Започни от начало' : 'Дърпай Асене!'}
            </button>
            {/* Steps counter */}
            <div className="flex items-center justify-center rounded-full bg-white/80 px-4 py-2 shadow-lg">
              <span className="text-[#8B0000] font-bold text-sm">
                {pullCount}/{TOTAL_PULLS}
              </span>
            </div>
          </div>

          {/* Hidden preloaded videos */}
          <video
            ref={video1Ref}
            src={pullVideoStage1Url}
            preload="auto"
            className="hidden"
            playsInline
            muted
          />
          <video
            ref={video4Ref}
            src={pullVideoStage4Url}
            preload="auto"
            className="hidden"
            playsInline
            muted
          />
          <video
            ref={video5Ref}
            src={pullVideoStage5Url}
            preload="auto"
            className="hidden"
            playsInline
            muted
          />

          {showPullVideo && currentPullVideoUrl && (
            <div className="absolute inset-0 z-[200] flex justify-end pointer-events-none">
              <div
                className={`mt-6 h-[45%] w-[70%] max-w-[320px] bg-black/90 text-white shadow-2xl pointer-events-auto transform transition-transform duration-300 rounded-lg overflow-hidden ${pullVideoVisible ? 'translate-x-[-10px]' : 'translate-x-full'}`}
              >
                <video
                  key={currentPullVideoUrl}
                  ref={pullVideoRef}
                  src={currentPullVideoUrl}
                  className="w-full h-full object-cover"
                  playsInline
                  onEnded={handlePullVideoEnded}
                  onLoadedMetadata={(e) => {
                    e.target.volume = 0.7
                  }}
                  controls={false}
                  preload="auto"
                  volume={0.7}
                />
              </div>
            </div>
          )}

          {showVictoryModal && (
            <div className="absolute inset-0 z-[250] flex items-center justify-center bg-black/70">
              <div className="mx-4 max-w-sm rounded-xl bg-white px-6 py-8 text-center shadow-2xl">
                <p className="text-lg font-semibold text-[#8B0000]">
                  Честито! Вие успешно изгонихте Пеевски от парламента
                </p>
                <button
                  onClick={() => setShowVictoryModal(false)}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-[#8B0000] px-5 py-2 text-base font-semibold text-white transition-colors hover:bg-[#a50000]"
                >
                  Затвори
                </button>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  )
}

export default GamePage