import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabaseAPI } from '../services/supabaseClient'

function RoomCreationForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    roomName: '',
    artistName: ''
  })
  const [selectedImages, setSelectedImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    
    // Validate file count (max 8)
    if (files.length > 8) {
      setError('Maximum 8 images allowed')
      return
    }

    // Validate file types and sizes
    const validFiles = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Each image must be less than 10MB')
        return
      }
      validFiles.push(file)
    }

    setSelectedImages(validFiles)
    setError('')
  }

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    setSelectedImages(newImages)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.roomName.trim() || !formData.artistName.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (selectedImages.length === 0) {
      setError('Please select at least one image')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create room with images
      const result = await supabaseAPI.createRoomWithImages(
        formData.roomName.trim(),
        formData.artistName.trim(),
        selectedImages
      )

      // Navigate to the created room
      navigate(`/room/${result.room.id}`)
    } catch (error) {
      console.error('Error creating room:', error)
      
      // Provide more specific error messages
      if (error.code === 'PGRST204') {
        setError('Database setup incomplete. Please run the database schema in your Supabase dashboard.')
      } else if (error.message?.includes('storage')) {
        setError('Storage bucket not configured. Please check your Supabase storage settings.')
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setError('Network error. Please check your internet connection and Supabase credentials.')
      } else {
        setError(`Failed to create room: ${error.message || 'Unknown error'}. Please try again.`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">🎨 Create Your Enhanced VR Gallery</h1>
      
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            {error && <div className="error">{error}</div>}

            {/* Room Details */}
            <div className="form-group">
              <label htmlFor="roomName" className="form-label">Gallery Name *</label>
              <input
                type="text"
                id="roomName"
                name="roomName"
                className="form-input"
                value={formData.roomName}
                onChange={handleInputChange}
                placeholder="e.g., My Digital Art Collection"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="artistName" className="form-label">Your Name *</label>
              <input
                type="text"
                id="artistName"
                name="artistName"
                className="form-input"
                value={formData.artistName}
                onChange={handleInputChange}
                placeholder="e.g., John Doe"
                required
              />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label htmlFor="images" className="form-label">
                Upload Images * (Max 8 images)
              </label>
              <input
                type="file"
                id="images"
                className="form-input"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                required
              />
              <small style={{ color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                Supported formats: JPG, PNG, GIF, WebP (Max 10MB each)
              </small>
            </div>

            {/* Image Preview */}
            {selectedImages.length > 0 && (
              <div className="form-group">
                <label className="form-label">
                  Selected Images ({selectedImages.length}/8)
                </label>
                <div className="preview-grid">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="preview-item">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="preview-image"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="preview-remove"
                      >
                        ×
                      </button>
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="form-button"
              disabled={loading || selectedImages.length === 0}
            >
              {loading ? (
                <>
                  <span style={{ marginRight: '0.5rem' }}>⏳</span>
                  Creating Your VR Gallery...
                </>
              ) : (
                <>
                  <span style={{ marginRight: '0.5rem' }}>🚀</span>
                  Create VR Room ({selectedImages.length} images)
                </>
              )}
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📋 How it works:</h3>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>Enter your gallery name and your name</li>
            <li>Upload up to 8 images of your artwork</li>
            <li>Click "Create VR Room" to generate your virtual gallery</li>
            <li>Explore your 3D gallery using the original A-Frame gallery experience!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default RoomCreationForm
