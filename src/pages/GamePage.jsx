import { useState } from 'react'
import parliamentBg from '../assets/images/parliament-bg.png'
import asen from '../assets/images/asen.png'
import peevski from '../assets/images/peevski.png'
import rope from '../assets/images/rope.png'
import './GamePage.css'

function GamePage() {
  const [clickPosition, setClickPosition] = useState(null)
  const [debugMode, setDebugMode] = useState(true)

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
      className="w-full h-full bg-cover bg-center bg-no-repeat relative game-page-container"
      style={{ backgroundImage: `url(${parliamentBg})` }}
      onClick={handleContainerClick}
    >
      {/* Debug overlay */}
      {debugMode && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50">
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

      {/* Asen at bottom left */}
      <img 
        src={asen} 
        alt="Asen" 
        className="absolute bottom-0 left-[-5%] asen-character w-1/2 h-1/2"
      />
      
      {/* Rope connecting asen to peevski */}
      <img 
        src={rope} 
        alt="Rope" 
        className="absolute rope-element"
      />
      
      {/* Peevski at parliament doors */}
      <img 
        src={peevski} 
        alt="Peevski" 
        className="absolute peevski-character"
      />
      
      <button className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 text-[0.75rem] bg-white text-[#8B0000] border-none rounded-full cursor-pointer font-bold whitespace-nowrap shadow-lg transition-all hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md z-[100]">
        Дърпай Асене!
      </button>
    </div>
  )
}

export default GamePage
