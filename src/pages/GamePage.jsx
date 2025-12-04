import { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Line } from 'react-konva'
import useImage from 'use-image'
import parliamentBg from '../assets/images/parliament-bg.png'
import asen from '../assets/images/asen.png'
import peevski from '../assets/images/peevski.png'
import rope from '../assets/images/rope.png'
import './GamePage.css'

const TOTAL_PULLS = 100
const INITIAL_ROPE_START = { x: 35.17, y: 75.07 }
const INITIAL_ROPE_END = { x: 49.49, y: 56.0 }
const FINAL_ROPE_END = { x: 65.09, y: 67.94 }
const INITIAL_PEEVSKI_HEIGHT = 20
const FINAL_PEEVSKI_HEIGHT = 320
// Fixed point on Asen's image where the rope starts (as percentage of image dimensions)
// These represent where Asen's hand is on his image (0-1 range, where 0.5 = center)
// Detected: 81.5% from left, 50.6% from top of Asen's image
const ASEN_HAND_POINT = { x: 0.815, y: 0.506 }

function GamePage() {
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

  // Calculate rope start point based on fixed point on Asen's image
  useEffect(() => {
    if (
      !containerRef.current ||
      !asenRef.current ||
      !containerSize.width ||
      !containerSize.height ||
      pullCount > 0
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
  }, [containerSize.width, containerSize.height, pullCount])

  const ropePoints = (() => {
    if (!containerSize.width || !containerSize.height) {
      return []
    }

    const startX = (ropeStart.x / 100) * containerSize.width
    const startY = (ropeStart.y / 100) * containerSize.height
    const endX = (ropeEnd.x / 100) * containerSize.width
    const endY = (ropeEnd.y / 100) * containerSize.height

    return [startX, startY, endX, endY]
  })()

  const desiredRopeThickness = 4
  const ropeStrokeWidth = desiredRopeThickness
  const ropePatternScale = ropeImage && ropeImage.height ? desiredRopeThickness / ropeImage.height : 0.25

  const handlePull = () => {
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
  }

  const handleContainerClick = (e) => {
    if (!debugMode) return
    
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
      {/* Debug overlay */}
      {debugMode && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-h-[80vh] overflow-y-auto">
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
            ref={asenRef}
            src={asen}
            alt="Asen"
            className="absolute w-16 h-16 asen-character"
            style={{ left: `${ropeStart.x}%`, top: `${ropeStart.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="absolute w-4 h-4 bg-green-500 border-2 border-white rounded-full z-50 rope-handle-start pointer-events-none"
            style={{ left: `${ropeStart.x}%`, top: `${ropeStart.y}%`, transform: 'translate(-50%, -50%)' }}
            title="Rope start (fixed to Asen's hand - not editable)"
          />
          <div
            className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full cursor-pointer z-50 rope-handle-end"
            style={{ left: `${ropeEnd.x}%`, top: `${ropeEnd.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={(e) => e.stopPropagation()}
          />
        </>
      )}

      {/* Asen at bottom left */}
      <img src={asen} alt="Asen" className="asen-character" ref={asenRef} />

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
            <Line
              points={ropePoints}
              stroke={ropeStrokeColor}
              strokeWidth={ropeStrokeWidth}
              lineCap="round"
              lineJoin="round"
              strokePatternImage={ropeImage || undefined}
              strokePatternRepeat="repeat"
              strokePatternRotation={45}
              strokePatternScaleX={ropePatternScale}
              strokePatternScaleY={ropePatternScale}
            />
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
          transform: 'translate(-15%, -53%)',
          height: `${peevskiHeight}px`,
        }}
      />

      <button
        onClick={handlePull}
        disabled={pullCount >= TOTAL_PULLS}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 text-[0.75rem] bg-white text-[#8B0000] border-none rounded-full cursor-pointer font-bold whitespace-nowrap shadow-lg transition-all hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md z-[100] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Дърпай Асене!
      </button>
    </div>
  )
}

export default GamePage