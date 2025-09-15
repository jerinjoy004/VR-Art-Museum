import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ModernGalleryRoom from '../components/ModernGalleryRoom'
import { supabaseAPI } from '../services/supabaseClient'

function RoomView() {
  const { roomId } = useParams()
  const [room, setRoom] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (roomId) {
      loadRoomData()
    }
  }, [roomId])

  const loadRoomData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load room info and artworks in parallel
      const [roomData, artworkData] = await Promise.all([
        supabaseAPI.getRoom(roomId),
        supabaseAPI.getArtworksByRoom(roomId)
      ])

      setRoom(roomData)
      setArtworks(artworkData)
    } catch (error) {
      console.error('Error loading room data:', error)
      setError('Failed to load room. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading VR room...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error">{error}</div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link 
            to="/browse" 
            className="form-button"
            style={{ 
              display: 'inline-block',
              textDecoration: 'none',
              width: 'auto'
            }}
          >
            Back to Gallery
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, textAlign: 'left' }}>
            🏛️ {room?.room_name || 'Enhanced VR Gallery'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {artworks.length} artwork{artworks.length !== 1 ? 's' : ''} by {room?.artist_name}
          </p>
        </div>
        
        <Link 
          to="/browse"
          style={{
            color: 'white',
            textDecoration: 'none',
            background: 'rgba(255,255,255,0.2)',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          ← Back to Browse
        </Link>
      </div>

      {artworks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>No artworks in this room yet</h3>
          <p>This room is waiting for its first artwork upload.</p>
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
            Upload Artwork
          </Link>
        </div>
      ) : (
        <>
          <ModernGalleryRoom artworks={artworks} roomData={room} />
          
          {/* Room controls and info */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>�️ Classical Museum Controls</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              fontSize: '0.9rem'
            }}>
              <div>
                <strong>Movement:</strong><br />
                WASD - Walk around gallery<br />
                Mouse - Look around<br />
                <em>Physics prevents wall collision</em>
              </div>
              <div>
                <strong>Interaction:</strong><br />
                Click artwork - Zoom effect<br />
                Look around - Dynamic lighting<br />
                Barriers protect artworks
              </div>
              <div>
                <strong>Experience:</strong><br />
                Classical museum design<br />
                Individual artwork spotlights<br />
                Realistic shadows & reflections
              </div>
            </div>
          </div>

          {/* Artwork list */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)' }}>
              Artworks in this Room ({artworks.length})
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {artworks.map(artwork => (
                <div key={artwork.id} style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)'
                }}>
                  <img
                    src={artwork.image_url}
                    alt={artwork.title || `Image ${artwork.image_order}`}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '6px'
                    }}
                  />
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-light)' }}>
                      {artwork.title || `Image ${artwork.image_order}`}
                    </h4>
                    <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      by {artwork.artist_name || room?.artist_name}
                    </p>
                    <span style={{
                      background: 'var(--primary-color)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      marginTop: '0.5rem',
                      display: 'inline-block'
                    }}>
                      Position {artwork.image_order}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RoomView
