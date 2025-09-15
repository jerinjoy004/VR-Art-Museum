import React, { useEffect, useRef } from 'react'

function ModernGalleryRoom({ artworks = [], roomData = null }) {
  const sceneRef = useRef(null)

  console.log('ModernGalleryRoom render:', { 
    artworksCount: artworks.length,
    roomName: roomData?.room_name || 'Museum Gallery'
  })

  useEffect(() => {
    if (typeof AFRAME !== 'undefined') {
      setTimeout(() => {
        initializeGallery()
      }, 500) // Increased delay for physics to load
    }
  }, [artworks])

  const initializeGallery = () => {
    // Check for common image loading issues
    console.log('🖼️ Initializing gallery with', artworks.length, 'artworks...')
    
    // Warn about potential cookie/CORS issues
    if (artworks.some(artwork => artwork.image_url?.includes('cloudflare') || artwork.image_url?.includes('cdn'))) {
      console.warn('⚠️ Detected external CDN images - may encounter CORS/cookie issues')
      console.log('💡 Consider using local images or CORS-enabled hosting for best performance')
    }

    // Register enhanced physics and movement constraint component
    if (!AFRAME.components['constrained-movement']) {
      AFRAME.registerComponent('constrained-movement', {
        schema: {
          roomLength: { type: 'number', default: 120 },
          roomWidth: { type: 'number', default: 40 },
          wallHeight: { type: 'number', default: 25 },
          barrierDistance: { type: 'number', default: 4 }
        },
        
        init: function () {
          console.log('Initializing enhanced constrained movement with ground-based physics...')
          
          const el = this.el
          this.velocity = new THREE.Vector3()
          this.lastValidPosition = { x: 0, y: 1.6, z: 5 } // Lower, more realistic height
          this.movementSpeed = 0.08 // Slower, more controlled movement
          this.artworkBarriers = []
          this.roomLength = Math.max(artworks.length * 10, 120)
          this.roomWidth = 40
          
          // Ground-based movement - no floating
          this.groundHeight = 1.6 // Fixed realistic eye level
          
          // Calculate artwork barrier positions
          this.calculateArtworkBarriers()
          
          // Listen for keyboard input for smoother movement
          this.keys = {}
          this.keyPressed = {}
          document.addEventListener('keydown', (e) => { 
            this.keys[e.code] = true 
            this.keyPressed[e.code] = true
          })
          document.addEventListener('keyup', (e) => { 
            this.keys[e.code] = false 
            this.keyPressed[e.code] = false
          })
          
          // Enhanced collision detection with wall barriers
          this.setupCollisionSystem()
        },
        
        calculateArtworkBarriers: function() {
          const artworkSpacing = 10 // Increased spacing
          
          for (let i = 0; i < artworks.length; i++) {
            const xPos = i * artworkSpacing + artworkSpacing + 5
            this.artworkBarriers.push({
              x: xPos,
              zLeft: -15, // Left wall artworks (further from center)
              zRight: 15, // Right wall artworks (further from center)
              radius: this.data.barrierDistance
            })
          }
        },
        
        setupCollisionSystem: function() {
          // Enhanced collision system with solid wall barriers
          this.walls = [
            { type: 'left', z: -this.roomWidth/2 + 3, barrier: true },
            { type: 'right', z: this.roomWidth/2 - 3, barrier: true },
            { type: 'front', x: -8, barrier: true },
            { type: 'back', x: this.roomLength + 8, barrier: true }
          ]
        },
        
        tick: function () {
          this.handleSmoothMovement()
          this.checkAllBounds()
        },
        
        handleSmoothMovement: function() {
          const position = this.el.getAttribute('position')
          const rotation = this.el.getAttribute('rotation')
          
          // Calculate movement direction based on camera rotation
          const radY = THREE.MathUtils.degToRad(rotation.y)
          const forward = new THREE.Vector3(-Math.sin(radY), 0, -Math.cos(radY))
          const right = new THREE.Vector3(Math.cos(radY), 0, -Math.sin(radY))
          
          this.velocity.set(0, 0, 0)
          
          // Smooth, controlled WASD movement
          if (this.keys['KeyW']) this.velocity.add(forward.multiplyScalar(this.movementSpeed))
          if (this.keys['KeyS']) this.velocity.add(forward.multiplyScalar(-this.movementSpeed))
          if (this.keys['KeyA']) this.velocity.add(right.multiplyScalar(-this.movementSpeed))
          if (this.keys['KeyD']) this.velocity.add(right.multiplyScalar(this.movementSpeed))
          
          // Normalize diagonal movement for consistent speed
          if (this.velocity.length() > this.movementSpeed) {
            this.velocity.normalize().multiplyScalar(this.movementSpeed)
          }
          
          // Apply smooth movement with ground constraint
          if (this.velocity.length() > 0) {
            const newPosition = {
              x: position.x + this.velocity.x,
              y: this.groundHeight, // FIXED height - no floating, always on ground
              z: position.z + this.velocity.z
            }
            
            if (this.isValidPosition(newPosition)) {
              this.el.setAttribute('position', newPosition)
              this.lastValidPosition = newPosition
            }
          } else {
            // Ensure we stay on ground even when not moving
            if (position.y !== this.groundHeight) {
              this.el.setAttribute('position', { x: position.x, y: this.groundHeight, z: position.z })
            }
          }
        },
        
        isValidPosition: function(pos) {
          // Strict wall barrier checks - walls act as solid barriers
          if (pos.x < -8 || pos.x > this.roomLength + 8) return false
          if (pos.z < -this.roomWidth/2 + 3 || pos.z > this.roomWidth/2 - 3) return false
          
          // Artwork barrier checks with enhanced collision detection
          for (let barrier of this.artworkBarriers) {
            const distToLeftArt = Math.sqrt(Math.pow(pos.x - barrier.x, 2) + Math.pow(pos.z - barrier.zLeft, 2))
            const distToRightArt = Math.sqrt(Math.pow(pos.x - barrier.x, 2) + Math.pow(pos.z - barrier.zRight, 2))
            
            if (distToLeftArt < barrier.radius || distToRightArt < barrier.radius) {
              return false
            }
          }
          
          // Museum bench collision detection
          const benchCount = Math.floor(this.roomLength / 60) // Benches every 60 units
          for (let i = 0; i < benchCount; i++) {
            const benchX = (i + 1) * 30 + 10
            const distToBench = Math.sqrt(Math.pow(pos.x - benchX, 2) + Math.pow(pos.z, 2))
            
            if (distToBench < 2.5) { // 2.5 unit buffer around benches
              return false
            }
          }
          
          return true
        },
        
        checkAllBounds: function () {
          const position = this.el.getAttribute('position')
          
          if (!this.isValidPosition(position)) {
            this.el.setAttribute('position', this.lastValidPosition)
          }
        }
      })
    }

    // Register image error handling component
    if (!AFRAME.components['image-error-handler']) {
      AFRAME.registerComponent('image-error-handler', {
        init: function () {
          console.log('Initializing image error handler...')
          
          const el = this.el
          const scene = el.sceneEl
          
          // Handle image loading errors globally
          scene.addEventListener('materialtextureloaded', (evt) => {
            console.log('Texture loaded successfully:', evt.detail.src)
          })
          
          scene.addEventListener('materialvideoloadstart', (evt) => {
            console.log('Video/image loading started:', evt.detail.src)
          })
          
          // Listen for texture loading errors
          scene.addEventListener('materialtextureloaderror', (evt) => {
            console.warn('Texture loading error:', evt.detail.src)
            this.handleImageError(evt.detail.src)
          })
          
          // Monitor all images in the scene
          this.monitorImages()
        },
        
        monitorImages: function() {
          const images = document.querySelectorAll('a-image')
          images.forEach((img, index) => {
            const src = img.getAttribute('src')
            
            // Add error handling attributes
            img.setAttribute('crossorigin', 'anonymous')
            img.setAttribute('material', 'shader: flat; transparent: false')
            
            // Test image loading
            if (src) {
              this.testImageLoad(src, img, index)
            }
          })
        },
        
        testImageLoad: function(src, imgElement, index) {
          const testImg = new Image()
          testImg.crossOrigin = 'anonymous'
          
          testImg.onload = () => {
            console.log(`Image ${index + 1} loaded successfully:`, src)
            // Hide loading indicator
            const loadingEl = imgElement.parentElement?.querySelector('.loading-indicator')
            if (loadingEl) loadingEl.setAttribute('visible', false)
          }
          
          testImg.onerror = (error) => {
            console.error(`Image ${index + 1} failed to load:`, src, error)
            this.showFallback(imgElement, index)
          }
          
          testImg.src = src
        },
        
        showFallback: function(imgElement, index) {
          // Hide the failed image
          imgElement.setAttribute('visible', false)
          
          // Show fallback placeholder
          const fallbackEl = imgElement.parentElement?.querySelector('.image-fallback')
          if (fallbackEl) {
            fallbackEl.setAttribute('visible', true)
            fallbackEl.setAttribute('material', 'color: #E5E5E5; opacity: 0.8')
          }
          
          // Show error message
          const loadingEl = imgElement.parentElement?.querySelector('.loading-indicator')
          if (loadingEl) {
            loadingEl.setAttribute('value', `Image ${index + 1} - Load Error`)
            loadingEl.setAttribute('color', '#FF6B6B')
            loadingEl.setAttribute('visible', true)
          }
        },
        
        handleImageError: function(src) {
          console.log('🔧 Handling image error for:', src)
          
          // Check if it's a Cloudflare cookie issue
          if (src && (src.includes('cloudflare') || src.includes('cf-') || src.includes('__cf_bm'))) {
            console.warn('🍪 Cloudflare cookie issue detected!')
            console.log('💡 Solutions:')
            console.log('   1. Use local images in the /public folder')
            console.log('   2. Use CORS-enabled image hosting (e.g., imgur, supabase storage)')
            console.log('   3. Configure Cloudflare to allow VR/WebGL requests')
            console.log('   4. Use base64 encoded images for small files')
          }
          
          // Additional error handling can be added here
        }
      })
    }

    // Register lighting component
    if (!AFRAME.components['gallery-lighting']) {
      AFRAME.registerComponent('gallery-lighting', {
        init: function () {
          console.log('Initializing gallery lighting...')
          
          const camera = document.getElementById('camera')
          
          if (camera) {
            // Create a dynamic spotlight that follows camera direction
            const spotlight = document.createElement('a-light')
            spotlight.setAttribute('type', 'spot')
            spotlight.setAttribute('intensity', '2')
            spotlight.setAttribute('angle', '60')
            spotlight.setAttribute('penumbra', '0.3')
            spotlight.setAttribute('color', '#ffffff')
            spotlight.setAttribute('distance', '25')
            spotlight.setAttribute('decay', '1.5')
            spotlight.setAttribute('position', '0 0.5 0')
            
            camera.appendChild(spotlight)
            
            // Update spotlight direction based on camera rotation
            let lastRotation = { x: 0, y: 0, z: 0 }
            this.el.addEventListener('componentchanged', (evt) => {
              if (evt.detail.name === 'rotation') {
                const rotation = camera.getAttribute('rotation')
                if (rotation.x !== lastRotation.x || rotation.y !== lastRotation.y) {
                  spotlight.setAttribute('rotation', {
                    x: rotation.x - 10, // Slight downward angle
                    y: rotation.y,
                    z: rotation.z
                  })
                  lastRotation = { ...rotation }
                }
              }
            })
          }
        }
      })
    }
  }

  // Generate classical museum architecture - MUCH TALLER with no pillars
  const generateArchitecture = () => {
    const roomLength = Math.max(artworks.length * 10, 120) // MASSIVE: 10 units spacing, min 120 units
    const roomWidth = 40 // VERY WIDE corridor: 40 units wide
    const wallHeight = 25 // MUCH TALLER walls: 25 units high (cathedral-like)

    return (
      <a-entity id="architecture">
        {/* Grand Floor with luxury carpet texture pattern */}
        <a-plane
          position={`${roomLength/2} 0 0`}
          rotation="-90 0 0"
          width={roomLength + 25}
          height={roomWidth + 8}
          material="color: #8B4513; roughness: 0.9; metalness: 0.1; repeat: 15 8"
        />
        
        {/* Left Wall - MUCH taller and solid barrier */}
        <a-box
          position={`${roomLength/2} ${wallHeight/2} ${-roomWidth/2 - 3}`}
          width={roomLength + 25}
          height={wallHeight}
          depth="2"
          material="color: #F5F5DC; roughness: 0.8; metalness: 0.0; repeat: 20 6"
        />
        
        {/* Right Wall - MUCH taller and solid barrier */}
        <a-box
          position={`${roomLength/2} ${wallHeight/2} ${roomWidth/2 + 3}`}
          width={roomLength + 25}
          height={wallHeight}
          depth="2"
          material="color: #F5F5DC; roughness: 0.8; metalness: 0.0; repeat: 20 6"
        />
        
        {/* Back Wall - solid barrier */}
        <a-box
          position={`${roomLength + 12} ${wallHeight/2} 0`}
          width="2"
          height={wallHeight}
          depth={roomWidth + 10}
          material="color: #F5F5DC; roughness: 0.8; metalness: 0.0"
        />
        
        {/* Front Wall with grand entrance - solid barriers */}
        <a-box
          position={`-10 ${wallHeight/2} ${-(roomWidth + 8)/3}`}
          width="2"
          height={wallHeight}
          depth={(roomWidth + 8)/3}
          material="color: #F5F5DC; roughness: 0.8; metalness: 0.0"
        />
        <a-box
          position={`-10 ${wallHeight/2} ${(roomWidth + 8)/3}`}
          width="2"
          height={wallHeight}
          depth={(roomWidth + 8)/3}
          material="color: #F5F5DC; roughness: 0.8; metalness: 0.0"
        />
        
        {/* Grand cathedral-like ceiling */}
        <a-plane
          position={`${roomLength/2} ${wallHeight} 0`}
          rotation="90 0 0"
          width={roomLength + 25}
          height={roomWidth + 8}
          material="color: #FFFFFF; roughness: 0.3; metalness: 0.2; repeat: 15 8"
        />
        
        {/* Enhanced ceiling molding for tall walls */}
        <a-box
          position={`${roomLength/2} ${wallHeight - 0.5} ${-roomWidth/2 - 2.5}`}
          width={roomLength + 25}
          height="1"
          depth="1"
          material="color: #D3D3D3; roughness: 0.2; metalness: 0.3"
        />
        <a-box
          position={`${roomLength/2} ${wallHeight - 0.5} ${roomWidth/2 + 2.5}`}
          width={roomLength + 25}
          height="1"
          depth="1"
          material="color: #D3D3D3; roughness: 0.2; metalness: 0.3"
        />
        
        {/* Floor molding/baseboards */}
        <a-box
          position={`${roomLength/2} 0.3 ${-roomWidth/2 - 2.8}`}
          width={roomLength + 25}
          height="0.6"
          depth="0.4"
          material="color: #8B4513; roughness: 0.3; metalness: 0.2"
        />
        <a-box
          position={`${roomLength/2} 0.3 ${roomWidth/2 + 2.8}`}
          width={roomLength + 25}
          height="0.6"
          depth="0.4"
          material="color: #8B4513; roughness: 0.3; metalness: 0.2"
        />
        
        {/* Museum benches for visitors - fewer, more spaced out */}
        {Array.from({ length: Math.floor(roomLength/60) }, (_, i) => (
          <a-entity key={`bench-${i}`}>
            <a-box
              position={`${(i + 1) * 30 + 10} 0.8 0`}
              width="4"
              height="0.8"
              depth="1.2"
              material="color: #8B4513; roughness: 0.4; metalness: 0.3"
            />
            {/* Bench legs */}
            <a-box
              position={`${(i + 1) * 30 + 8.5} 0.4 -0.4`}
              width="0.3"
              height="0.8"
              depth="0.3"
              material="color: #654321; roughness: 0.5; metalness: 0.2"
            />
            <a-box
              position={`${(i + 1) * 30 + 11.5} 0.4 -0.4`}
              width="0.3"
              height="0.8"
              depth="0.3"
              material="color: #654321; roughness: 0.5; metalness: 0.2"
            />
            <a-box
              position={`${(i + 1) * 30 + 8.5} 0.4 0.4`}
              width="0.3"
              height="0.8"
              depth="0.3"
              material="color: #654321; roughness: 0.5; metalness: 0.2"
            />
            <a-box
              position={`${(i + 1) * 30 + 11.5} 0.4 0.4`}
              width="0.3"
              height="0.8"
              depth="0.3"
              material="color: #654321; roughness: 0.5; metalness: 0.2"
            />
          </a-entity>
        ))}
        
        {/* Grand entrance archway - taller */}
        <a-entity id="entrance-arch">
          <a-box
            position="-10 8 -8"
            width="2"
            height="16"
            depth="1"
            material="color: #D3D3D3; roughness: 0.2; metalness: 0.4"
          />
          <a-box
            position="-10 8 8"
            width="2"
            height="16"
            depth="1"
            material="color: #D3D3D3; roughness: 0.2; metalness: 0.4"
          />
          <a-cylinder
            position="-10 16 0"
            radius="8.5"
            height="2"
            rotation="0 0 90"
            material="color: #D3D3D3; roughness: 0.2; metalness: 0.4"
            geometry="thetaStart: 0; thetaLength: 180"
          />
        </a-entity>
      </a-entity>
    )
  }

  // Generate artworks with classical frames and error handling
  const generateArtworks = () => {
    if (artworks.length === 0) return null

    const spacing = 10 // MASSIVE spacing between artworks for grand museum feel
    const eyeLevel = 7 // Higher eye level for taller walls and grand museum
    const wallDistance = 15 // Much further from center, creating more spacious feeling

    // Create fallback data URL for placeholder image
    const createPlaceholderDataURL = (index) => {
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext('2d')
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 400, 300)
      gradient.addColorStop(0, '#E5E5E5')
      gradient.addColorStop(1, '#CCCCCC')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 400, 300)
      
      // Add border
      ctx.strokeStyle = '#999999'
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, 396, 296)
      
      // Add text
      ctx.fillStyle = '#666666'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`Artwork ${index + 1}`, 200, 130)
      ctx.font = '16px Arial'
      ctx.fillText('Image Loading...', 200, 160)
      ctx.fillText('Please check connection', 200, 180)
      
      return canvas.toDataURL()
    }

    return artworks.map((artwork, index) => {
      const xPosition = index * spacing + spacing + 5
      const isLeftWall = index % 2 === 0
      const zPosition = isLeftWall ? -wallDistance : wallDistance
      const rotation = isLeftWall ? "0 0 0" : "0 180 0"
      
      // Use placeholder if image URL is problematic
      const imageUrl = artwork.image_url || createPlaceholderDataURL(index)

      return (
        <a-entity key={artwork.id} className="artwork-display" data-artwork-index={index}>
          {/* LARGER Classical Frame */}
          <a-box
            position={`${xPosition} ${eyeLevel} ${zPosition}`}
            width="7"
            height="5.5"
            depth="0.5"
            material="color: #8B4513; roughness: 0.1; metalness: 0.8"
            rotation={rotation}
          />
          
          {/* Inner ornate frame detail - LARGER */}
          <a-box
            position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.27 : -0.27)}`}
            width="6.5"
            height="5"
            depth="0.2"
            material="color: #DAA520; roughness: 0.1; metalness: 0.9"
            rotation={rotation}
          />
          
          {/* Inner gold trim - LARGER */}
          <a-box
            position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.37 : -0.37)}`}
            width="6"
            height="4.5"
            depth="0.15"
            material="color: #FFD700; roughness: 0.05; metalness: 0.95"
            rotation={rotation}
          />
          
          {/* Artwork Image - MUCH LARGER with error handling */}
          <a-image
            position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.42 : -0.42)}`}
            width="5.5"
            height="4"
            src={imageUrl}
            rotation={rotation}
            className="clickable-artwork"
            data-raycastable
            crossorigin="anonymous"
            material="shader: flat; transparent: false"
            animation__mouseenter="property: scale; to: 1.1 1.1 1; startEvents: mouseenter; dur: 400; easing: easeOutQuad"
            animation__mouseleave="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 400; easing: easeOutQuad"
            animation__click="property: scale; to: 1.2 1.2 1; startEvents: click; dur: 300; easing: easeOutBack"
          />
          
          {/* Fallback placeholder if image fails to load */}
          <a-plane
            position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.41 : -0.41)}`}
            width="5.5"
            height="4"
            material="color: #E5E5E5; opacity: 0.3"
            rotation={rotation}
            visible="false"
            className="image-fallback"
          />
          
          {/* Error message for failed images */}
          <a-text
            position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.4 : -0.4)}`}
            value={artwork.image_url ? "Loading..." : "No Image Available"}
            align="center"
            width="8"
            color="#666666"
            font="roboto"
            rotation={rotation}
            visible={!artwork.image_url}
            className="loading-indicator"
          />
          
          {/* Professional Museum Label Plaque - LARGER */}
          <a-plane
            position={`${xPosition} ${eyeLevel - 3.5} ${zPosition + (isLeftWall ? 0.45 : -0.45)}`}
            width="5.5"
            height="1.5"
            material="color: #2F2F2F; roughness: 0.1; metalness: 0.8"
            rotation={rotation}
          />
          
          {/* Gold label border - LARGER */}
          <a-plane
            position={`${xPosition} ${eyeLevel - 3.5} ${zPosition + (isLeftWall ? 0.47 : -0.47)}`}
            width="5.2"
            height="1.2"
            material="color: #444444; roughness: 0.2; metalness: 0.7"
            rotation={rotation}
          />
          
          {/* Artwork Title - LARGER text */}
          <a-text
            position={`${xPosition} ${eyeLevel - 3.2} ${zPosition + (isLeftWall ? 0.48 : -0.48)}`}
            value={artwork.title || `Artwork ${index + 1}`}
            align="center"
            width="10"
            color="#FFFFFF"
            font="roboto"
            rotation={rotation}
          />
          
          {/* Artist Name - LARGER */}
          <a-text
            position={`${xPosition} ${eyeLevel - 3.6} ${zPosition + (isLeftWall ? 0.48 : -0.48)}`}
            value={`by ${roomData?.artist_name || 'Unknown Artist'}`}
            align="center"
            width="8"
            color="#CCCCCC"
            font="roboto"
            rotation={rotation}
          />
          
          {/* Date/Year */}
          <a-text
            position={`${xPosition} ${eyeLevel - 3.8} ${zPosition + (isLeftWall ? 0.48 : -0.48)}`}
            value={`${new Date().getFullYear()}`}
            align="center"
            width="6"
            color="#AAAAAA"
            font="roboto"
            rotation={rotation}
          />
          
          {/* POWERFUL Artwork Spotlight - enhanced for larger space */}
          <a-light
            type="spot"
            position={`${xPosition} ${eyeLevel + 5} ${zPosition + (isLeftWall ? -4 : 4)}`}
            rotation={isLeftWall ? "45 0 0" : "45 180 0"}
            color="#FFFACD"
            intensity="4"
            angle="30"
            penumbra="0.3"
            distance="18"
            decay="1.2"
          />
          
          {/* Secondary accent lighting - enhanced */}
          <a-light
            type="point"
            position={`${xPosition} ${eyeLevel + 2} ${zPosition + (isLeftWall ? -2 : 2)}`}
            color="#FFF8DC"
            intensity="1.5"
            distance="10"
            decay="2"
          />
          
          {/* Protective Barrier - MUCH larger and more realistic */}
          <a-box
            position={`${xPosition} 0.15 ${zPosition + (isLeftWall ? -5 : 5)}`}
            width="8"
            height="0.3"
            depth="2"
            material="color: #8B4513; roughness: 0.3; metalness: 0.5"
            visible="true"
          />
          
          {/* Barrier posts - LARGER */}
          <a-cylinder
            position={`${xPosition - 4} 1.2 ${zPosition + (isLeftWall ? -5 : 5)}`}
            radius="0.15"
            height="2.4"
            material="color: #8B4513; roughness: 0.2; metalness: 0.6"
          />
          <a-cylinder
            position={`${xPosition + 4} 1.2 ${zPosition + (isLeftWall ? -5 : 5)}`}
            radius="0.15"
            height="2.4"
            material="color: #8B4513; roughness: 0.2; metalness: 0.6"
          />
          
          {/* Rope between posts - THICKER */}
          <a-cylinder
            position={`${xPosition} 2 ${zPosition + (isLeftWall ? -5 : 5)}`}
            radius="0.08"
            height="8"
            rotation="0 0 90"
            material="color: #8B4513; roughness: 0.8"
          />
        </a-entity>
      )
    })
  }

  return (
    <div className="vr-container">
      {/* Enhanced Instructions */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(0,0,0,0.85)',
        color: 'white',
        padding: '1.2rem',
        borderRadius: '10px',
        fontSize: '0.95rem',
        pointerEvents: 'none',
        maxWidth: '320px',
        border: '2px solid #DAA520'
      }}>
        <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🏛️ <strong>Grand Cathedral Gallery</strong></div>
        <div>🎮 <strong>WASD</strong> to walk (ground level, no floating!)</div>
        <div>🖱️ <strong>Mouse</strong> to look around smoothly</div>
        <div>�️ <strong>Click artwork</strong> to zoom and interact</div>
        <div>💡 <strong>Dynamic lighting</strong> follows your view</div>
        <div>🚧 <strong>Solid walls</strong> and barriers stop movement</div>
        <div>📏 <strong>25-unit tall ceiling</strong> - cathedral scale!</div>
      </div>
      
      <a-scene
        ref={sceneRef}
        embedded
        style={{ height: '100%', width: '100%' }}
        vr-mode-ui="enabled: true"
        background="color: #2C2C2C"
        physics="driver: local; debug: false"
        fog="type: linear; color: #2C2C2C; near: 100; far: 200">
        
        {/* Main Architecture */}
        {generateArchitecture()}
        
        {/* Enhanced Museum Lighting System with Image Error Handling */}
        <a-entity gallery-lighting image-error-handler>
          {generateArtworks()}
        </a-entity>
        
        {/* Ambient Museum Lighting */}
        <a-light 
          type="ambient" 
          color="#404040" 
          intensity="0.7" 
        />
        
        {/* Main Directional Light - stronger for larger space */}
        <a-light
          type="directional"
          position="20 20 10"
          color="#FFFFFF"
          intensity="1.5"
        />
        
        {/* Additional ceiling lights along the corridor - higher for tall ceiling */}
        {Array.from({ length: Math.floor((Math.max(artworks.length * 10, 120))/20) }, (_, i) => (
          <a-light
            key={`ceiling-light-${i}`}
            type="point"
            position={`${(i + 1) * 20} 20 0`}
            color="#FFFACD"
            intensity="2.5"
            distance="35"
            decay="1.5"
          />
        ))}
        
        {/* Camera with enhanced movement constraints - ground level */}
        <a-entity 
          id="camera"
          position="0 1.6 5"
          constrained-movement
          look-controls="pointerLockEnabled: true; reverseMouseDrag: false">
          
          <a-camera
            cursor="fuse: false; rayOrigin: mouse"
            raycaster="objects: [data-raycastable]; far: 30"
          />
        </a-entity>
      </a-scene>
    </div>
  )
}

export default ModernGalleryRoom
