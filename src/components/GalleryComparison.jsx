import React, { useState, useEffect } from 'react'
import ModernGalleryRoom from './ModernGalleryRoom'
// Uncomment after running setup-physics.sh and installing dependencies:
// import PhysicsGalleryRoom from './PhysicsGalleryRoom'

function GalleryComparison({ artworks = [], roomData = null }) {
  const [usePhysics, setUsePhysics] = useState(false)
  const [performance, setPerformance] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0
  })

  // Performance monitoring
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let totalFrameTime = 0

    const measurePerformance = () => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime
      
      frameCount++
      totalFrameTime += deltaTime

      if (frameCount >= 60) { // Update every 60 frames
        const avgFps = 1000 / (totalFrameTime / frameCount)
        const avgFrameTime = totalFrameTime / frameCount

        setPerformance({
          fps: Math.round(avgFps),
          frameTime: avgFrameTime.toFixed(2),
          memoryUsage: navigator.memory ? 
            Math.round(navigator.memory.usedJSHeapSize / 1024 / 1024) : 'N/A'
        })

        frameCount = 0
        totalFrameTime = 0
      }

      lastTime = currentTime
      requestAnimationFrame(measurePerformance)
    }

    measurePerformance()
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* System Toggle UI */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '1rem',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        border: '2px solid #4CAF50'
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
          🔧 Physics System Comparison
        </div>
        
        <button
          onClick={() => setUsePhysics(!usePhysics)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: usePhysics ? '#FF6B6B' : '#4CAF50',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {usePhysics ? '⚗️ Cannon.js Physics' : '🔧 Custom System'}
        </button>

        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          Switch to compare performance
        </div>
      </div>

      {/* Performance Monitor */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 20,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontFamily: 'monospace'
      }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
          📊 Performance Monitor
        </div>
        <div>System: {usePhysics ? 'Cannon.js Physics' : 'Custom System'}</div>
        <div>FPS: {performance.fps}</div>
        <div>Frame Time: {performance.frameTime}ms</div>
        <div>Memory: {performance.memoryUsage}MB</div>
      </div>

      {/* Render appropriate gallery system */}
      {usePhysics ? (
        <div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            background: 'rgba(255, 107, 107, 0.9)',
            color: 'white',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h2>Physics Engine Not Available</h2>
            <p>To use Cannon.js physics engine:</p>
            <ol style={{ textAlign: 'left', margin: '1rem 0' }}>
              <li>Run: <code>bash setup-physics.sh</code></li>
              <li>Uncomment PhysicsGalleryRoom import</li>
              <li>Restart development server</li>
            </ol>
            <p>Your current custom system is excellent for this use case!</p>
            <button
              onClick={() => setUsePhysics(false)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: '#4CAF50',
                color: 'white',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Back to Custom System
            </button>
          </div>
        </div>
      ) : (
        <ModernGalleryRoom artworks={artworks} roomData={roomData} />
      )}
    </div>
  )
}

export default GalleryComparison
