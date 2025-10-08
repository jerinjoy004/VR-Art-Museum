// Optional Physics Engine Integration Component
// Add this to your project if you want to experiment with cannon.js
// Keep your current custom system as default - this is just for comparison

import React, { useEffect, useRef } from 'react'

// Physics-enabled player controller using cannon.js
const registerPhysicsPlayerController = () => {
  if (AFRAME.components['physics-player-controller']) return

  AFRAME.registerComponent('physics-player-controller', {
    schema: {
      // Movement parameters
      movementSpeed: { type: 'number', default: 4 },
      runMultiplier: { type: 'number', default: 2 },
      jumpForce: { type: 'number', default: 8 },
      mouseSensitivity: { type: 'number', default: 0.2 },
      
      // Physics parameters
      mass: { type: 'number', default: 1 },
      linearDamping: { type: 'number', default: 0.9 },
      angularDamping: { type: 'number', default: 0.9 },
      
      // Debug
      debug: { type: 'boolean', default: false }
    },

    init: function () {
      console.log('🔬 Initializing Physics Player Controller...')
      
      // Core references
      this.el = this.el
      this.camera = this.el.querySelector('a-camera') || this.el
      
      // Input state
      this.keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        run: false,
        jump: false
      }
      
      // Mouse state
      this.mouseMovement = { x: 0, y: 0 }
      this.isPointerLocked = false
      
      // Physics state
      this.isGrounded = false
      this.groundContacts = 0
      
      // Camera rotation
      this.pitch = 0
      this.yaw = 0
      
      // Wait for physics system to be ready
      this.el.sceneEl.addEventListener('loaded', () => {
        this.setupPhysics()
        this.setupControls()
      })
    },

    setupPhysics: function () {
      // Get the physics body
      this.body = this.el.body
      if (!this.body) {
        console.error('No physics body found on player entity')
        return
      }

      // Configure physics properties
      this.body.mass = this.data.mass
      this.body.linearDamping = this.data.linearDamping
      this.body.angularDamping = this.data.angularDamping
      this.body.fixedRotation = true // Prevent physics rotation
      this.body.updateMassProperties()

      // Setup collision detection for ground contact
      this.body.addEventListener('collide', (event) => {
        const contact = event.contact
        const normalY = Math.abs(contact.ni[1]) // Normal in world space Y

        // If collision normal points up significantly, we're on ground
        if (normalY > 0.7) {
          this.isGrounded = true
          this.groundContacts++
          
          if (this.data.debug) {
            console.log('Ground contact detected, normal Y:', normalY)
          }
        }
      })

      // Reset ground state each frame
      this.el.sceneEl.addEventListener('physics-tick-begin', () => {
        this.groundContacts = 0
        this.isGrounded = false
      })

      if (this.data.debug) {
        console.log('Physics body configured:', this.body)
      }
    },

    setupControls: function () {
      // Keyboard controls
      this.onKeyDown = (event) => {
        if (document.pointerLockElement !== this.el.sceneEl.canvas) return
        
        switch (event.code) {
          case 'KeyW':
            this.keys.forward = true
            break
          case 'KeyS':
            this.keys.backward = true
            break
          case 'KeyA':
            this.keys.left = true
            break
          case 'KeyD':
            this.keys.right = true
            break
          case 'ShiftLeft':
          case 'ShiftRight':
            this.keys.run = true
            break
          case 'Space':
            this.keys.jump = true
            break
        }
      }

      this.onKeyUp = (event) => {
        switch (event.code) {
          case 'KeyW':
            this.keys.forward = false
            break
          case 'KeyS':
            this.keys.backward = false
            break
          case 'KeyA':
            this.keys.left = false
            break
          case 'KeyD':
            this.keys.right = false
            break
          case 'ShiftLeft':
          case 'ShiftRight':
            this.keys.run = false
            break
          case 'Space':
            this.keys.jump = false
            break
        }
      }

      // Mouse controls
      this.onMouseMove = (event) => {
        if (!this.isPointerLocked) return
        
        const movementX = event.movementX || 0
        const movementY = event.movementY || 0
        
        this.mouseMovement.x = movementX * this.data.mouseSensitivity
        this.mouseMovement.y = movementY * this.data.mouseSensitivity
      }

      // Pointer lock
      this.onPointerLockChange = () => {
        this.isPointerLocked = document.pointerLockElement === this.el.sceneEl.canvas
      }

      this.onCanvasClick = () => {
        if (!this.isPointerLocked) {
          this.el.sceneEl.canvas.requestPointerLock()
        }
      }

      // Add event listeners
      document.addEventListener('keydown', this.onKeyDown)
      document.addEventListener('keyup', this.onKeyUp)
      document.addEventListener('mousemove', this.onMouseMove)
      document.addEventListener('pointerlockchange', this.onPointerLockChange)
      this.el.sceneEl.canvas.addEventListener('click', this.onCanvasClick)
    },

    tick: function (time, timeDelta) {
      if (!this.body) return

      const deltaTime = timeDelta / 1000

      this.updateMouseLook()
      this.updateMovement(deltaTime)
      this.updateJump()
    },

    updateMouseLook: function () {
      // Update camera rotation
      this.yaw -= this.mouseMovement.x
      this.pitch -= this.mouseMovement.y
      this.pitch = Math.max(-85, Math.min(85, this.pitch))

      // Apply rotation
      this.el.setAttribute('rotation', { x: 0, y: this.yaw, z: 0 })
      if (this.camera) {
        this.camera.setAttribute('rotation', { x: this.pitch, y: 0, z: 0 })
      }

      // Reset mouse movement
      this.mouseMovement.x = 0
      this.mouseMovement.y = 0
    },

    updateMovement: function (deltaTime) {
      if (!this.body) return

      // Calculate movement direction
      const moveVector = new THREE.Vector3(0, 0, 0)
      
      if (this.keys.forward) moveVector.z -= 1
      if (this.keys.backward) moveVector.z += 1
      if (this.keys.left) moveVector.x -= 1
      if (this.keys.right) moveVector.x += 1

      if (moveVector.length() > 0) {
        moveVector.normalize()

        // Apply speed multiplier
        let speed = this.data.movementSpeed
        if (this.keys.run) {
          speed *= this.data.runMultiplier
        }

        // Rotate movement by camera yaw
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), 
                                THREE.MathUtils.degToRad(this.yaw))

        // Apply force to physics body
        const force = moveVector.multiplyScalar(speed * this.body.mass * 60) // Scale for physics
        this.body.force.set(force.x, 0, force.z) // Don't apply Y force for movement

        if (this.data.debug && moveVector.length() > 0) {
          console.log('Applying movement force:', force)
        }
      } else {
        // No input - let physics damping handle deceleration
        this.body.force.set(0, 0, 0)
      }
    },

    updateJump: function () {
      if (this.keys.jump && this.isGrounded && this.body) {
        // Apply upward impulse
        const jumpImpulse = new CANNON.Vec3(0, this.data.jumpForce, 0)
        this.body.applyImpulse(jumpImpulse, this.body.position)
        
        this.keys.jump = false // Prevent continuous jumping
        
        if (this.data.debug) {
          console.log('Jump applied with force:', this.data.jumpForce)
        }
      }
    },

    remove: function () {
      // Clean up event listeners
      document.removeEventListener('keydown', this.onKeyDown)
      document.removeEventListener('keyup', this.onKeyUp)
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('pointerlockchange', this.onPointerLockChange)
      this.el.sceneEl.canvas.removeEventListener('click', this.onCanvasClick)
    }
  })
}

// Physics-enabled Gallery Component
function PhysicsGalleryRoom({ artworks = [], roomData = null }) {
  const sceneRef = useRef(null)

  useEffect(() => {
    if (typeof AFRAME !== 'undefined') {
      // Register physics-based player controller
      registerPhysicsPlayerController()
    }
  }, [])

  const generatePhysicsArchitecture = () => {
    const roomLength = Math.max(artworks.length * 10, 120)
    const roomWidth = 40
    const wallHeight = 25

    return (
      <a-entity id="physics-architecture">
        {/* Physics Floor */}
        <a-plane
          position={`${roomLength/2} 0 0`}
          rotation="-90 0 0"
          width={roomLength + 25}
          height={roomWidth + 8}
          static-body
          material="color: #8B4513; roughness: 0.9"
          shadow="receive: true"
        />
        
        {/* Physics Walls */}
        <a-box
          position={`${roomLength/2} ${wallHeight/2} ${-roomWidth/2 - 3}`}
          width={roomLength + 25}
          height={wallHeight}
          depth="2"
          static-body
          material="color: #F5F5DC; roughness: 0.8"
          shadow="cast: true; receive: true"
        />
        
        <a-box
          position={`${roomLength/2} ${wallHeight/2} ${roomWidth/2 + 3}`}
          width={roomLength + 25}
          height={wallHeight}
          depth="2"
          static-body
          material="color: #F5F5DC; roughness: 0.8"
          shadow="cast: true; receive: true"
        />
        
        <a-box
          position={`${roomLength + 12} ${wallHeight/2} 0`}
          width="2"
          height={wallHeight}
          depth={roomWidth + 10}
          static-body
          material="color: #F5F5DC; roughness: 0.8"
          shadow="cast: true; receive: true"
        />

        {/* Physics Benches */}
        {Array.from({ length: Math.floor(roomLength/60) }, (_, i) => (
          <a-box
            key={`physics-bench-${i}`}
            position={`${(i + 1) * 30 + 10} 0.4 0`}
            width="4"
            height="0.8"
            depth="1.2"
            static-body
            material="color: #8B4513; roughness: 0.4"
            shadow="cast: true; receive: true"
          />
        ))}
      </a-entity>
    )
  }

  const generatePhysicsArtworks = () => {
    if (artworks.length === 0) return null

    return artworks.map((artwork, index) => {
      const xPosition = index * 10 + 15
      const isLeftWall = index % 2 === 0
      const zPosition = isLeftWall ? -15 : 15
      const rotation = isLeftWall ? "0 0 0" : "0 180 0"

      return (
        <a-entity key={artwork.id}>
          {/* Physics Frame */}
          <a-box
            position={`${xPosition} 7 ${zPosition}`}
            width="7"
            height="5.5"
            depth="0.5"
            static-body
            material="color: #8B4513; roughness: 0.1; metalness: 0.8"
            rotation={rotation}
            shadow="cast: true; receive: true"
          />
          
          {/* Artwork Image */}
          <a-image
            position={`${xPosition} 7 ${zPosition + (isLeftWall ? 0.3 : -0.3)}`}
            width="5.5"
            height="4"
            src={artwork.image_url}
            rotation={rotation}
            shadow="receive: true"
          />
        </a-entity>
      )
    })
  }

  return (
    <div className="vr-container">
      {/* Physics Instructions */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '0.8rem',
        maxWidth: '300px',
        border: '2px solid #FF6B6B'
      }}>
        <div style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#FF6B6B' }}>
          ⚗️ <strong>Physics Engine Mode</strong>
        </div>
        <div>🎮 <strong>WASD</strong> - Physics-based movement</div>
        <div>⚡ <strong>Space</strong> - Physics jump</div>
        <div>🔬 <strong>Cannon.js</strong> - Real physics simulation</div>
        <div style={{ fontSize: '0.7rem', color: '#CCCCCC', marginTop: '0.5rem' }}>
          Experimental: Compare with custom system
        </div>
      </div>

      <a-scene
        ref={sceneRef}
        embedded
        style={{ height: '100%', width: '100%' }}
        physics="driver: cannon; debug: true; gravity: -20"
        background="color: #2C2C2C"
        shadow="type: pcfsoft; autoUpdate: true">
        
        {/* Physics Architecture */}
        {generatePhysicsArchitecture()}
        
        {/* Physics Artworks */}
        {generatePhysicsArtworks()}
        
        {/* Lighting */}
        <a-light type="ambient" color="#404040" intensity="0.4" />
        <a-light
          type="directional"
          position="20 30 10"
          color="#FFFFFF"
          intensity="1.2"
          shadow="cast: true"
        />
        
        {/* Physics Player */}
        <a-entity 
          id="physics-camera-rig"
          position="0 2 5"
          kinematic-body="mass: 1"
          physics-player-controller="
            movementSpeed: 6;
            runMultiplier: 2;
            jumpForce: 8;
            debug: true
          ">
          
          <a-camera
            id="physics-camera"
            cursor="fuse: false; rayOrigin: mouse"
          />
        </a-entity>
      </a-scene>
    </div>
  )
}

export default PhysicsGalleryRoom
