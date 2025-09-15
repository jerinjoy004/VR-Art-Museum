import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabaseAPI } from '../services/supabaseClient'

function GalleryBrowser() {
  const [rooms, setRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRooms()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [rooms, searchTerm])

  const loadRooms = async () => {
    try {
      setLoading(true)
      const data = await supabaseAPI.getAllRooms()
      setRooms(data || [])
    } catch (error) {
      console.error('Error loading rooms:', error)
      setError('Failed to load galleries. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...rooms]

    // Filter by search term (room name or artist name)
    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.artist_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredRooms(filtered)
  }

  const refreshRooms = () => {
    loadRooms()
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading galleries...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1 className="page-title">🏛️ Browse Enhanced VR Galleries</h1>
      
      {error && (
        <div className="error" style={{ marginBottom: '2rem' }}>
          {error}
          <button 
            onClick={refreshRooms}
            className="form-button"
            style={{ marginLeft: '1rem', padding: '0.5rem 1rem', width: 'auto' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <input
          type="text"
          placeholder="🔍 Search galleries by name or artist..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
        />
      </div>

      {/* Stats */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        color: 'var(--text-muted)'
      }}>
        {filteredRooms.length} {filteredRooms.length === 1 ? 'gallery' : 'galleries'} found
        {searchTerm && ` for "${searchTerm}"`}
      </div>

      {/* Room Grid */}
      <div className="card-grid">
        {filteredRooms.length > 0 ? (
          filteredRooms.map(room => (
            <Link 
              key={room.id} 
              to={`/room/${room.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card">
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
                  🏛️ {room.room_name}
                </h3>
                <p style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  <strong>Artist:</strong> {room.artist_name}
                </p>
                <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  <strong>Created:</strong> {new Date(room.created_at).toLocaleDateString()}
                </p>
                <div style={{
                  background: 'linear-gradient(45deg, var(--primary-color), var(--secondary-color))',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  Enter VR Gallery →
                </div>
              </div>
            </Link>
          ))
        ) : !loading && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-muted)'
          }}>
            {searchTerm ? (
              <>
                <h3>No galleries found for "{searchTerm}"</h3>
                <p>Try a different search term or browse all galleries.</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="form-button"
                  style={{ marginTop: '1rem', width: 'auto' }}
                >
                  Clear Search
                </button>
              </>
            ) : rooms.length === 0 ? (
              <>
                <h3>No galleries yet!</h3>
                <p>Be the first to create an enhanced VR art gallery.</p>
                <Link 
                  to="/upload"
                  className="form-button"
                  style={{
                    display: 'inline-block',
                    marginTop: '1rem',
                    textDecoration: 'none',
                    width: 'auto'
                  }}
                >
                  Create Gallery
                </Link>
              </>
            ) : (
              <p>No galleries match your current filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GalleryBrowser
