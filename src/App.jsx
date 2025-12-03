import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import GamePage from './pages/GamePage'

function App() {
  return (
    <div className="w-screen h-screen bg-white flex justify-center items-center overflow-hidden">
      <div className="relative overflow-hidden bg-gray-100 aspect-[430/932] w-full max-w-[500px] h-full max-h-[1083px]">
        <Router>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/app" element={<GamePage />} />
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App

