import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🎨 VR Gallery
      </Link>
      
      <ul className="navbar-nav">
        <li>
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Browse Rooms
          </Link>
        </li>
        <li>
          <Link 
            to="/upload" 
            className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
          >
            Create Room
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar
