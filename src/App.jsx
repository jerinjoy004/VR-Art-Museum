import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import GalleryBrowser from './pages/GalleryBrowser'
import RoomView from './pages/RoomView'
import UploadPage from './pages/UploadPage'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<GalleryBrowser />} />
          <Route path="/browse" element={<GalleryBrowser />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/room/:roomId" element={<RoomView />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
