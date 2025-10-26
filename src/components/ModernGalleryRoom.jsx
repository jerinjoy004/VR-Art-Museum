import React, { useEffect, useRef } from 'react'
import { supabaseAPI } from '../services/supabaseClient'

function ModernGalleryRoom({ artworks = [], roomData = null }) {
  const sceneRef = useRef(null)

  // Helper function to get public image URL
  const getPublicImageUrl = (path) => {
    return supabaseAPI.getPublicImageUrl ? supabaseAPI.getPublicImageUrl(path) : path
  }

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

    // Register comprehensive player controller component
    if (!AFRAME.components['player-controller']) {
      AFRAME.registerComponent('player-controller', {
        schema: {
          // Movement parameters
          movementSpeed: { type: 'number', default: 3.5 },
          runMultiplier: { type: 'number', default: 2.0 },
          friction: { type: 'number', default: 0.85 },
          acceleration: { type: 'number', default: 65 },
          
          // Camera parameters
          mouseSensitivity: { type: 'number', default: 0.2 },
          smoothing: { type: 'number', default: 0.1 },
          verticalLookLimit: { type: 'number', default: 85 },
          
          // Physics parameters
          groundHeight: { type: 'number', default: 1.6 },
          gravity: { type: 'number', default: -25 },
          maxFallSpeed: { type: 'number', default: -20 },
          groundCheckDistance: { type: 'number', default: 2.0 },
          groundStickDistance: { type: 'number', default: 0.1 },
          jumpForce: { type: 'number', default: 8 },
          
          // Collision parameters
          enabled: { type: 'boolean', default: true }
        },
        
        init: function () {
          console.log('🎮 Initializing Player Controller...')
          
          // Core references
          this.el = this.el
          this.camera = this.el.querySelector('a-camera') || this.el
          
          // Movement state
          this.velocity = new THREE.Vector3()
          this.acceleration = new THREE.Vector3()
          this.moveVector = new THREE.Vector3()
          this.isGrounded = true
          this.isRunning = false
          
          // Camera state
          this.pitchObject = new THREE.Object3D()
          this.yawObject = new THREE.Object3D()
          this.pitchObject.add(this.yawObject)
          
          // Current rotation values
          this.pitch = 0
          this.yaw = 0
          this.targetPitch = 0
          this.targetYaw = 0
          
          // Input state
          this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            run: false,
            jump: false
          }
          
          // Mouse state with fullscreen tracking
          this.mouseMovement = { x: 0, y: 0 }
          this.isPointerLocked = false
          this.wasPointerLocked = false
          
          // Time tracking
          this.prevTime = performance.now()
          
          // Setup input handlers
          this.setupKeyboardControls()
          this.setupMouseControls()
          this.setupCollisionSystem()
        },
        
        setupMouseControls: function() {
          // Enhanced mouse movement handler with fullscreen compatibility
          this.onMouseMove = (event) => {
            if (!this.isPointerLocked) return
            
            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0
            
            this.mouseMovement.x = movementX * this.data.mouseSensitivity
            this.mouseMovement.y = movementY * this.data.mouseSensitivity
          }
          
          // Enhanced pointer lock handlers with better fullscreen support
          this.onPointerLockChange = () => {
            this.isPointerLocked = !!document.pointerLockElement
            console.log('Pointer lock changed:', this.isPointerLocked ? 'LOCKED' : 'UNLOCKED')
          }
          
          // Improved canvas click handler for fullscreen
          this.onCanvasClick = (event) => {
            event.preventDefault()
            event.stopPropagation()
            
            if (!this.isPointerLocked) {
              // Get the correct target based on current mode
              let lockTarget
      
              if (document.fullscreenElement) {
                // In fullscreen mode, use the fullscreen element
                lockTarget = document.fullscreenElement
              } else {
                // In windowed mode, use canvas or scene
                lockTarget = this.el.sceneEl.canvas || this.el.sceneEl
              }
              
              if (lockTarget && lockTarget.requestPointerLock) {
                lockTarget.requestPointerLock()
                  .then(() => {
                    console.log('Pointer lock requested successfully')
                  })
                  .catch((error) => {
                    console.warn('Pointer lock request failed:', error)
                    // Fallback: try with canvas directly
                    if (this.el.sceneEl.canvas && this.el.sceneEl.canvas !== lockTarget) {
                      this.el.sceneEl.canvas.requestPointerLock().catch(e => {
                        console.warn('Fallback pointer lock also failed:', e)
                      })
                    }
                  })
              }
            }
          }
          
          // Enhanced fullscreen change handler with proper pointer lock management
          this.onFullscreenChange = () => {
            const isFullscreen = !!document.fullscreenElement
            console.log('Fullscreen changed:', isFullscreen ? 'FULLSCREEN' : 'WINDOWED')
            
            // Store current pointer lock state
            const wasLocked = this.isPointerLocked
            
            // Small delay to allow fullscreen transition to complete
            setTimeout(() => {
              // If we were locked before fullscreen change, re-request lock
              if (wasLocked && !this.isPointerLocked) {
                const lockTarget = document.fullscreenElement || this.el.sceneEl.canvas || this.el.sceneEl
                
                if (lockTarget && lockTarget.requestPointerLock) {
                  lockTarget.requestPointerLock()
                    .then(() => {
                      console.log('Pointer lock restored after fullscreen change')
                    })
                    .catch((error) => {
                      console.warn('Failed to restore pointer lock after fullscreen:', error)
                    })
                }
              }
            }, 200) // Increased delay for better reliability
            
            this.wasPointerLocked = wasLocked
          }
          
          // Add event listeners
          document.addEventListener('mousemove', this.onMouseMove, { passive: false })
          document.addEventListener('pointerlockchange', this.onPointerLockChange)
          document.addEventListener('mozpointerlockchange', this.onPointerLockChange)
          document.addEventListener('webkitpointerlockchange', this.onPointerLockChange)
          
          // Enhanced fullscreen event listeners
          document.addEventListener('fullscreenchange', this.onFullscreenChange)
          document.addEventListener('mozfullscreenchange', this.onFullscreenChange)
          document.addEventListener('webkitfullscreenchange', this.onFullscreenChange)
          document.addEventListener('msfullscreenchange', this.onFullscreenChange)
          
          // Enhanced click handling for both canvas and scene
          const canvas = this.el.sceneEl.canvas
          const scene = this.el.sceneEl
          
          if (canvas) {
            canvas.addEventListener('click', this.onCanvasClick, { passive: false })
            // Also listen for contextmenu to prevent right-click issues
            canvas.addEventListener('contextmenu', (e) => {
              e.preventDefault()
              return false
            })
          }
          
          if (scene && scene !== canvas) {
            scene.addEventListener('click', this.onCanvasClick, { passive: false })
            scene.addEventListener('contextmenu', (e) => {
              e.preventDefault()
              return false
            })
          }
          
          // Add window focus/blur handlers to maintain input state
          this.onWindowFocus = () => {
            // Reset key states when window regains focus to prevent stuck keys
            Object.keys(this.keys).forEach(key => {
              this.keys[key] = false
            })
          }
          
          this.onWindowBlur = () => {
            // Reset key states when window loses focus
            Object.keys(this.keys).forEach(key => {
              this.keys[key] = false
            })
          }
          
          window.addEventListener('focus', this.onWindowFocus)
          window.addEventListener('blur', this.onWindowBlur)
        },
        
        setupKeyboardControls: function() {
          // Enhanced keyboard handlers with fullscreen compatibility
          this.onKeyDown = (event) => {
            // Don't require pointer lock for keyboard input in fullscreen
            const isFullscreen = !!document.fullscreenElement
            
            if (!this.isPointerLocked && !isFullscreen) return
            
            // Prevent default behavior for movement keys
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
              event.preventDefault()
            }
            
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
              case 'Escape':
                // Handle escape key to exit fullscreen
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(console.warn)
                }
                break
            }
          }
          
          this.onKeyUp = (event) => {
            // Allow key up events regardless of pointer lock state
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
              event.preventDefault()
            }
            
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
          
          // Use capture phase for better event handling
          document.addEventListener('keydown', this.onKeyDown, { capture: true, passive: false })
          document.addEventListener('keyup', this.onKeyUp, { capture: true, passive: false })
        },
        
        setupCollisionSystem: function() {
          // Enhanced collision system with bounding box detection and ground surfaces
          this.roomLength = Math.max(artworks.length * 10, 120)
          this.roomWidth = 40
          this.wallThickness = 3
          
          // Player collision sphere
          this.playerRadius = 0.8 // Player represented as sphere with this radius
          
          // Room boundaries (explicit bounds for clamping)
          this.boundaries = {
            minX: -8 + this.playerRadius,
            maxX: this.roomLength + 8 - this.playerRadius,
            minZ: -this.roomWidth/2 + this.wallThickness + this.playerRadius,
            maxZ: this.roomWidth/2 - this.wallThickness - this.playerRadius
          }
          
          // Ground surfaces for raycast detection
          this.groundSurfaces = [
            {
              type: 'plane',
              y: 0, // Floor level
              minX: -15,
              maxX: this.roomLength + 15,
              minZ: -this.roomWidth/2 - 5,
              maxZ: this.roomWidth/2 + 5,
              material: 'floor'
            }
          ]
          
          // Collision boxes array - will be populated after scene loads
          this.collisionBoxes = []
          
          // Setup raycaster for ground detection
          this.setupGroundDetection()
          
          // Precompute static collision boxes
          this.precomputeCollisionBoxes()
        },
        
        setupGroundDetection: function() {
          // Initialize raycaster for ground detection
          this.raycaster = new THREE.Raycaster()
          this.raycaster.far = this.data.groundCheckDistance
          
          // Direction vector pointing downward
          this.downDirection = new THREE.Vector3(0, -1, 0)
        },
        
        precomputeCollisionBoxes: function() {
          // Wait for scene to load, then collect all colliders
          setTimeout(() => {
            this.collectColliders()
          }, 1000)
        },
        
        collectColliders: function() {
          // Find all elements marked as colliders
          const colliderElements = this.el.sceneEl.querySelectorAll('.collider, .collision-object, .collision-barrier, .bench-collision-barrier')
          this.collisionBoxes = []
          
          colliderElements.forEach((collider, index) => {
            const position = collider.getAttribute('position') || {x: 0, y: 0, z: 0}
            const geometry = collider.getAttribute('geometry') || {}
            const width = geometry.width || collider.getAttribute('width') || 1
            const height = geometry.height || collider.getAttribute('height') || 1
            const depth = geometry.depth || collider.getAttribute('depth') || 1
            const radius = geometry.radius || collider.getAttribute('radius')
            
            let box
            
            if (radius) {
              // Cylindrical collider (like benches)
              box = {
                type: 'cylinder',
                id: `collider-${index}`,
                element: collider,
                x: position.x,
                y: position.y,
                z: position.z,
                radius: radius + this.playerRadius, // Add player radius buffer
                height: height
              }
            } else {
              // Box collider with player radius buffer
              box = {
                type: 'box',
                id: `collider-${index}`,
                element: collider,
                minX: position.x - width/2 - this.playerRadius,
                maxX: position.x + width/2 + this.playerRadius,
                minY: position.y - height/2,
                maxY: position.y + height/2,
                minZ: position.z - depth/2 - this.playerRadius,
                maxZ: position.z + depth/2 + this.playerRadius,
                centerX: position.x,
                centerY: position.y,
                centerZ: position.z,
                width: width + this.playerRadius * 2,
                height: height,
                depth: depth + this.playerRadius * 2
              }
            }
            
            this.collisionBoxes.push(box)
          })
          
          // Add museum bench colliders (for generated benches not in DOM)
          const benchCount = Math.floor(this.roomLength/60)
          for (let i = 0; i < benchCount; i++) {
            const benchX = (i + 1) * 30 + 10
            const benchZ = 0
            const benchRadius = 2.5 + this.playerRadius
            
            this.collisionBoxes.push({
              type: 'cylinder',
              id: `generated-bench-${i}`,
              element: null,
              x: benchX,
              y: 1,
              z: benchZ,
              radius: benchRadius,
              height: 2,
              isGenerated: true
            })
          }
          
          console.log(`Collision system loaded: ${this.collisionBoxes.length} colliders`)
        },
        
        tick: function(time, timeDelta) {
          if (!this.data.enabled) return
          
          const deltaTime = timeDelta / 1000 // Convert to seconds
          
          this.updateMouseLook(deltaTime)
          this.updateMovement(deltaTime)
          this.updatePhysics(deltaTime)
          this.applyCollisions()
          this.updateCameraRotation()
        },
        
        updateMouseLook: function(deltaTime) {
          // Enhanced mouse look with fullscreen compatibility
          if (!this.isPointerLocked) {
            // In fullscreen mode, allow limited mouse look even without pointer lock
            if (!document.fullscreenElement) return
          }
          
          // Apply mouse movement with smoothing
          this.targetYaw -= this.mouseMovement.x
          this.targetPitch -= this.mouseMovement.y
          
          // Clamp pitch to prevent over-rotation
          this.targetPitch = Math.max(-this.data.verticalLookLimit, Math.min(this.data.verticalLookLimit, this.targetPitch))
          
          // Smooth interpolation
          const smoothingFactor = Math.min(1, deltaTime / this.data.smoothing)
          this.yaw += (this.targetYaw - this.yaw) * smoothingFactor
          this.pitch += (this.targetPitch - this.pitch) * smoothingFactor
          
          // Reset mouse movement
          this.mouseMovement.x = 0
          this.mouseMovement.y = 0
        },
        
        updateMovement: function(deltaTime) {
          // Calculate movement direction based on input
          this.moveVector.set(0, 0, 0)
          
          if (this.keys.forward) this.moveVector.z -= 1
          if (this.keys.backward) this.moveVector.z += 1
          if (this.keys.left) this.moveVector.x -= 1
          if (this.keys.right) this.moveVector.x += 1
          
          // Normalize diagonal movement
          if (this.moveVector.length() > 0) {
            this.moveVector.normalize()
            
            // Apply speed multiplier
            let speed = this.data.movementSpeed
            if (this.keys.run) {
              speed *= this.data.runMultiplier
              this.isRunning = true
            } else {
              this.isRunning = false
            }
            
            // Rotate movement vector by camera yaw
            this.moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), 
                                         THREE.MathUtils.degToRad(this.yaw))
            
            // Apply acceleration
            const targetVelocity = this.moveVector.clone().multiplyScalar(speed)
            const acceleration = this.data.acceleration * deltaTime
            
            this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelocity.x, acceleration)
            this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelocity.z, acceleration)
          } else {
            // Apply friction
            this.velocity.x *= Math.pow(this.data.friction, deltaTime * 60)
            this.velocity.z *= Math.pow(this.data.friction, deltaTime * 60)
            this.isRunning = false
          }
        },
        
        updatePhysics: function(deltaTime) {
          const position = this.el.getAttribute('position')
          
          // Perform ground detection using raycast
          const groundInfo = this.detectGround(position)
          
          // Handle jumping
          if (this.keys.jump && this.isGrounded) {
            this.velocity.y = this.data.jumpForce
            this.isGrounded = false
            this.keys.jump = false // Prevent continuous jumping
          }
          
          if (groundInfo.isGrounded) {
            // Player is on ground
            const targetGroundHeight = groundInfo.groundHeight + this.data.groundHeight
            
            // If player is close to ground, snap to it
            if (Math.abs(position.y - targetGroundHeight) <= this.data.groundStickDistance) {
              this.isGrounded = true
              this.velocity.y = 0
              
              // Smoothly adjust to exact ground height
              const adjustedY = THREE.MathUtils.lerp(position.y, targetGroundHeight, 0.1)
              this.el.setAttribute('position', {
                x: position.x,
                y: adjustedY,
                z: position.z
              })
            } else if (position.y > targetGroundHeight) {
              // Player is above ground - apply gravity
              this.isGrounded = false
              this.velocity.y += this.data.gravity * deltaTime
              this.velocity.y = Math.max(this.velocity.y, this.data.maxFallSpeed) // Terminal velocity
            } else {
              // Player is below ground - push up
              this.isGrounded = true
              this.velocity.y = 0
              this.el.setAttribute('position', {
                x: position.x,
                y: targetGroundHeight,
                z: position.z
              })
            }
          } else {
            // Player is in air - apply gravity
            this.isGrounded = false
            this.velocity.y += this.data.gravity * deltaTime
            this.velocity.y = Math.max(this.velocity.y, this.data.maxFallSpeed) // Terminal velocity
          }
          
          // Prevent falling below minimum ground level as safety net
          if (position.y < this.data.groundHeight - 5) {
            console.warn('Player fell below safety level, resetting to ground')
            this.el.setAttribute('position', {
              x: position.x,
              y: this.data.groundHeight,
              z: position.z
            })
            this.velocity.y = 0
            this.isGrounded = true
          }
        },
        
        detectGround: function(playerPosition) {
          // Raycast downward from player position to detect ground
          const rayOrigin = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z)
          
          // First check against defined ground surfaces
          for (let surface of this.groundSurfaces) {
            if (surface.type === 'plane') {
              // Check if player is within surface bounds
              if (playerPosition.x >= surface.minX && playerPosition.x <= surface.maxX &&
                  playerPosition.z >= surface.minZ && playerPosition.z <= surface.maxZ) {
                
                const distanceToGround = playerPosition.y - surface.y
                
                if (distanceToGround <= this.data.groundCheckDistance && distanceToGround >= -0.1) {
                  return {
                    isGrounded: true,
                    groundHeight: surface.y,
                    distance: distanceToGround,
                    surfaceType: surface.material
                  }
                }
              }
            }
          }
          
          // If scene has loaded, also check against A-Frame geometry
          if (this.el.sceneEl && this.el.sceneEl.object3D) {
            this.raycaster.set(rayOrigin, this.downDirection)
            
            // Get all objects that could be ground (planes, boxes with top surfaces)
            const groundObjects = []
            
            // Find floor planes
            const floorPlanes = this.el.sceneEl.querySelectorAll('a-plane[rotation*="-90"]')
            floorPlanes.forEach(plane => {
              if (plane.object3D) {
                groundObjects.push(plane.object3D)
              }
            })
            
            // Find box tops (for platforms, steps, etc.)
            const boxes = this.el.sceneEl.querySelectorAll('a-box')
            boxes.forEach(box => {
              if (box.object3D && !box.classList.contains('collider')) { // Don't walk on walls
                groundObjects.push(box.object3D)
              }
            })
            
            if (groundObjects.length > 0) {
              const intersects = this.raycaster.intersectObjects(groundObjects, true)
              
              if (intersects.length > 0) {
                const closestIntersection = intersects[0]
                const groundHeight = closestIntersection.point.y
                const distance = playerPosition.y - groundHeight
                
                if (distance <= this.data.groundCheckDistance && distance >= -0.1) {
                  if (this.data.debug) {
                    console.log('Ground detected via raycast at height:', groundHeight, 'distance:', distance.toFixed(2))
                  }
                  
                  return {
                    isGrounded: true,
                    groundHeight: groundHeight,
                    distance: distance,
                    surfaceType: 'geometry'
                  }
                }
              }
            }
          }
          
          // No ground detected
          return {
            isGrounded: false,
            groundHeight: null,
            distance: Infinity,
            surfaceType: null
          }
        },
        
        applyCollisions: function() {
          const position = this.el.getAttribute('position')
          const deltaTime = 1/60 // Normalize for 60fps
          
          // Calculate intended new position
          const intendedPosition = {
            x: position.x + this.velocity.x * deltaTime,
            y: position.y + this.velocity.y * deltaTime,
            z: position.z + this.velocity.z * deltaTime
          }
          
          // Start with intended position and adjust for collisions
          const finalPosition = { ...intendedPosition }
          let collided = false
          
          // Room boundary collision with sliding
          if (finalPosition.x < this.boundaries.minX) {
            finalPosition.x = this.boundaries.minX
            this.velocity.x = 0
            collided = true
          }
          if (finalPosition.x > this.boundaries.maxX) {
            finalPosition.x = this.boundaries.maxX
            this.velocity.x = 0
            collided = true
          }
          if (finalPosition.z < this.boundaries.minZ) {
            finalPosition.z = this.boundaries.minZ
            this.velocity.z = 0
            collided = true
          }
          if (finalPosition.z > this.boundaries.maxZ) {
            finalPosition.z = this.boundaries.maxZ
            this.velocity.z = 0
            collided = true
          }
          
          // Check collision with all static objects
          for (let i = 0; i < this.collisionBoxes.length; i++) {
            const box = this.collisionBoxes[i]
            
            if (box.type === 'cylinder') {
              // Cylinder collision (for benches)
              const dx = finalPosition.x - box.x
              const dz = finalPosition.z - box.z
              const distance = Math.sqrt(dx * dx + dz * dz)
              
              if (distance < box.radius) {
                // Collision detected - push player outside cylinder
                if (distance > 0) {
                  const pushFactor = box.radius / distance
                  finalPosition.x = box.x + dx * pushFactor
                  finalPosition.z = box.z + dz * pushFactor
                } else {
                  // Player is exactly at center, push in arbitrary direction
                  finalPosition.x = box.x + box.radius
                }
                
                // Apply sliding by zeroing velocity component towards obstacle
                const normalX = (finalPosition.x - box.x) / box.radius
                const normalZ = (finalPosition.z - box.z) / box.radius
                
                const velocityDotNormal = this.velocity.x * normalX + this.velocity.z * normalZ
                if (velocityDotNormal < 0) {
                  this.velocity.x -= velocityDotNormal * normalX
                  this.velocity.z -= velocityDotNormal * normalZ
                }
                
                collided = true
              }
            } else {
              // Box collision with sliding
              const collision = this.checkBoxCollision(finalPosition, box)
              
              if (collision.collided) {
                // Apply sliding mechanics - move along free axes
                const slidePosition = this.calculateSlidePosition(position, intendedPosition, box)
                
                finalPosition.x = slidePosition.x
                finalPosition.z = slidePosition.z
                
                // Adjust velocity for sliding
                if (collision.overlapX > collision.overlapZ) {
                  // Horizontal collision - allow vertical sliding
                  this.velocity.x = 0
                } else {
                  // Vertical collision - allow horizontal sliding  
                  this.velocity.z = 0
                }
                
                collided = true
              }
            }
          }
          
          // Apply final position
          this.el.setAttribute('position', finalPosition)
        },
        
        checkBoxCollision: function(playerPos, box) {
          // Check if player sphere intersects with box
          const overlapX = Math.max(0, Math.min(playerPos.x, box.maxX) - Math.max(playerPos.x, box.minX))
          const overlapZ = Math.max(0, Math.min(playerPos.z, box.maxZ) - Math.max(playerPos.z, box.minZ))
          
          const collided = (playerPos.x >= box.minX && playerPos.x <= box.maxX) &&
                          (playerPos.z >= box.minZ && playerPos.z <= box.maxZ)
          
          return {
            collided: collided,
            overlapX: Math.abs(overlapX),
            overlapZ: Math.abs(overlapZ)
          }
        },
        
        calculateSlidePosition: function(currentPos, intendedPos, box) {
          // Calculate position that allows sliding along the free axis
          let slideX = intendedPos.x
          let slideZ = intendedPos.z
          
          // Check if we can slide horizontally
          const canSlideX = !(intendedPos.x >= box.minX && intendedPos.x <= box.maxX) ||
                           (currentPos.z < box.minZ || currentPos.z > box.maxZ)
          
          // Check if we can slide vertically  
          const canSlideZ = !(intendedPos.z >= box.minZ && intendedPos.z <= box.maxZ) ||
                           (currentPos.x < box.minX || currentPos.x > box.maxX)
          
          if (!canSlideX) {
            slideX = currentPos.x // Stop horizontal movement
          }
          
          if (!canSlideZ) {
            slideZ = currentPos.z // Stop vertical movement
          }
          
          // Ensure slide position doesn't penetrate the box
          if (slideX >= box.minX && slideX <= box.maxX && slideZ >= box.minZ && slideZ <= box.maxZ) {
            // Still inside box after sliding - push to nearest edge
            const distToMinX = Math.abs(slideX - box.minX)
            const distToMaxX = Math.abs(slideX - box.maxX)
            const distToMinZ = Math.abs(slideZ - box.minZ)
            const distToMaxZ = Math.abs(slideZ - box.maxZ)
            
            const minDist = Math.min(distToMinX, distToMaxX, distToMinZ, distToMaxZ)
            
            if (minDist === distToMinX) slideX = box.minX - 0.01
            else if (minDist === distToMaxX) slideX = box.maxX + 0.01
            else if (minDist === distToMinZ) slideZ = box.minZ - 0.01
            else if (minDist === distToMaxZ) slideZ = box.maxZ + 0.01
          }
          
          return { x: slideX, z: slideZ }
        },
        
        updateCameraRotation: function() {
          // Apply rotation to the entity (yaw) and camera (pitch)
          this.el.setAttribute('rotation', { x: 0, y: this.yaw, z: 0 })
          
          if (this.camera && this.camera.setAttribute) {
            this.camera.setAttribute('rotation', { x: this.pitch, y: 0, z: 0 })
          }
        },
        
        remove: function() {
          // Enhanced cleanup
          document.removeEventListener('keydown', this.onKeyDown, { capture: true })
          document.removeEventListener('keyup', this.onKeyUp, { capture: true })
          document.removeEventListener('mousemove', this.onMouseMove)
          document.removeEventListener('pointerlockchange', this.onPointerLockChange)
          document.removeEventListener('mozpointerlockchange', this.onPointerLockChange)
          document.removeEventListener('webkitpointerlockchange', this.onPointerLockChange)
          
          document.removeEventListener('fullscreenchange', this.onFullscreenChange)
          document.removeEventListener('mozfullscreenchange', this.onFullscreenChange)
          document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange)
          document.removeEventListener('msfullscreenchange', this.onFullscreenChange)
          
          window.removeEventListener('focus', this.onWindowFocus)
          window.removeEventListener('blur', this.onWindowBlur)
          
          const canvas = this.el.sceneEl.canvas
          if (canvas) {
            canvas.removeEventListener('click', this.onCanvasClick)
            canvas.removeEventListener('contextmenu', this.onCanvasClick)
          }
          if (this.el.sceneEl !== canvas) {
            this.el.sceneEl.removeEventListener('click', this.onCanvasClick)
            this.el.sceneEl.removeEventListener('contextmenu', this.onCanvasClick)
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

  // Generate enhanced classical museum architecture with invisible barriers
  const generateArchitecture = () => {
    const roomLength = Math.max(artworks.length * 10, 120)
    const roomWidth = 40
    const wallHeight = 25
    const performanceLevel = 'medium' // Could be detected dynamically

    return (
      <a-entity id="architecture">
        {/* Enhanced Floor with realistic materials */}
        <a-plane
          position={`${roomLength/2} 0 0`}
          rotation="-90 0 0"
          width={roomLength + 25}
          height={roomWidth + 8}
          material={`color: #8B4513; roughness: 0.9; metalness: 0.1; repeat: 15 8; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
          geometry="primitive: plane"
          shadow="receive: true"
        />
        
        {/* Invisible collision barriers at safe distances from walls */}
        <a-box
          position={`${roomLength/2} 1 ${-roomWidth/2 + 1}`}
          width={roomLength + 25}
          height="2"
          depth="0.1"
          material="opacity: 0; transparent: true"
          visible="false"
          class="collision-barrier"
        />
        
        <a-box
          position={`${roomLength/2} 1 ${roomWidth/2 - 1}`}
          width={roomLength + 25}
          height="2"
          depth="0.1"
          material="opacity: 0; transparent: true"
          visible="false"
          class="collision-barrier"
        />
        
        <a-box
          position={`${roomLength + 10} 1 0`}
          width="0.1"
          height="2"
          depth={roomWidth + 8}
          material="opacity: 0; transparent: true"
          visible="false"
          class="collision-barrier"
        />
        
        <a-box
          position={`-8 1 0`}
          width="0.1"
          height="2"
          depth={roomWidth + 8}
          material="opacity: 0; transparent: true"
          visible="false"
          class="collision-barrier"
        />
        
        {/* Visual walls with enhanced materials and shadows */}
        <a-box
          position={`${roomLength/2} ${wallHeight/2} ${-roomWidth/2 - 3}`}
          width={roomLength + 25}
          height={wallHeight}
          depth="2"
          material={`color: #F5F5DC; roughness: 0.8; metalness: 0.0; repeat: 20 6; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
          shadow="cast: true; receive: true"
          geometry="primitive: box"
          class="collider"
        />
        
        <a-box
          position={`${roomLength/2} ${wallHeight/2} ${roomWidth/2 + 3}`}
          width={roomLength + 25}
          height={wallHeight}
          depth="2"
          material={`color: #F5F5DC; roughness: 0.8; metalness: 0.0; repeat: 20 6; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
          shadow="cast: true; receive: true"
          geometry="primitive: box"
          class="collider"
        />
        
        <a-box
          position={`${roomLength + 12} ${wallHeight/2} 0`}
          width="2"
          height={wallHeight}
          depth={roomWidth + 10}
          material={`color: #F5F5DC; roughness: 0.8; metalness: 0.0; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
          shadow="cast: true; receive: true"
          geometry="primitive: box"
          class="collider"
        />
        
        {/* Enhanced entrance with invisible barriers */}
        <a-box
          position={`-10 ${wallHeight/2} ${-(roomWidth + 8)/3}`}
          width="2"
          height={wallHeight}
          depth={(roomWidth + 8)/3}
          material={`color: #F5F5DC; roughness: 0.8; metalness: 0.0; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
          shadow="cast: true; receive: true"
          class="collider"
        />
        <a-box
          position={`-10 ${wallHeight/2} ${(roomWidth + 8)/3}`}
          width="2"
          height={wallHeight}
          depth={(roomWidth + 8)/3}
          material={`color: #F5F5DC; roughness: 0.8; metalness: 0.0; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
          shadow="cast: true; receive: true"
          class="collider"
        />
        
        {/* Realistic ceiling with ambient occlusion */}
        <a-plane
          position={`${roomLength/2} ${wallHeight} 0`}
          rotation="90 0 0"
          width={roomLength + 25}
          height={roomWidth + 8}
          material={`color: #FFFFFF; roughness: 0.3; metalness: 0.2; repeat: 15 8; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
          shadow="receive: true"
        />
        
        {/* Enhanced architectural details with LOD */}
        {performanceLevel !== 'low' && (
          <>
            {/* Ceiling molding */}
            <a-box
              position={`${roomLength/2} ${wallHeight - 0.5} ${-roomWidth/2 - 2.5}`}
              width={roomLength + 25}
              height="1"
              depth="1"
              material="color: #D3D3D3; roughness: 0.2; metalness: 0.3"
              shadow="cast: true"
              class="collider"
            />
            <a-box
              position={`${roomLength/2} ${wallHeight - 0.5} ${roomWidth/2 + 2.5}`}
              width={roomLength + 25}
              height="1"
              depth="1"
              material="color: #D3D3D3; roughness: 0.2; metalness: 0.3"
              shadow="cast: true"
              class="collider"
            />
            
            {/* Floor molding/baseboards */}
            <a-box
              position={`${roomLength/2} 0.3 ${-roomWidth/2 - 2.8}`}
              width={roomLength + 25}
              height="0.6"
              depth="0.4"
              material="color: #8B4513; roughness: 0.3; metalness: 0.2"
              shadow="cast: true"
            />
            <a-box
              position={`${roomLength/2} 0.3 ${roomWidth/2 + 2.8}`}
              width={roomLength + 25}
              height="0.6"
              depth="0.4"
              material="color: #8B4513; roughness: 0.3; metalness: 0.2"
              shadow="cast: true"
            />
          </>
        )}
        
        {/* Museum benches with enhanced collision detection */}
        {Array.from({ length: Math.floor(roomLength/60) }, (_, i) => (
          <a-entity key={`bench-${i}`} class="museum-furniture">
            {/* Main bench with collision */}
            <a-box
              position={`${(i + 1) * 30 + 10} 0.8 0`}
              width="4"
              height="0.8"
              depth="1.2"
              material={`color: #8B4513; roughness: 0.4; metalness: 0.3; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
              shadow="cast: true; receive: true"
              class="collision-object"
            />
            
            {/* Invisible collision barrier around bench */}
            <a-cylinder
              position={`${(i + 1) * 30 + 10} 1 0`}
              radius="2.5"
              height="0.1"
              material="opacity: 0; transparent: true"
              visible="false"
              class="bench-collision-barrier"
            />
            
            {/* Bench legs with LOD */}
            {performanceLevel !== 'low' && (
              <>
                <a-box
                  position={`${(i + 1) * 30 + 8.5} 0.4 -0.4`}
                  width="0.3"
                  height="0.8"
                  depth="0.3"
                  material="color: #654321; roughness: 0.5; metalness: 0.2"
                  shadow="cast: true"
                />
                <a-box
                  position={`${(i + 1) * 30 + 11.5} 0.4 -0.4`}
                  width="0.3"
                  height="0.8"
                  depth="0.3"
                  material="color: #654321; roughness: 0.5; metalness: 0.2"
                  shadow="cast: true"
                />
                <a-box
                  position={`${(i + 1) * 30 + 8.5} 0.4 0.4`}
                  width="0.3"
                  height="0.8"
                  depth="0.3"
                  material="color: #654321; roughness: 0.5; metalness: 0.2"
                  shadow="cast: true"
                />
                <a-box
                  position={`${(i + 1) * 30 + 11.5} 0.4 0.4`}
                  width="0.3"
                  height="0.8"
                  depth="0.3"
                  material="color: #654321; roughness: 0.5; metalness: 0.2"
                  shadow="cast: true"
                />
              </>
            )}
          </a-entity>
        ))}
        
        {/* Enhanced entrance archway with proper geometry */}
        {performanceLevel !== 'low' && (
          <a-entity id="entrance-arch">
            <a-box
              position="-10 8 -8"
              width="2"
              height="16"
              depth="1"
              material="color: #D3D3D3; roughness: 0.2; metalness: 0.4"
              shadow="cast: true"
              class="collider"
            />
            <a-box
              position="-10 8 8"
              width="2"
              height="16"
              depth="1"
              material="color: #D3D3D3; roughness: 0.2; metalness: 0.4"
              shadow="cast: true"
              class="collider"
            />
            <a-cylinder
              position="-10 16 0"
              radius="8.5"
              height="2"
              rotation="0 0 90"
              material="color: #D3D3D3; roughness: 0.2; metalness: 0.4"
              geometry="thetaStart: 0; thetaLength: 180"
              shadow="cast: true"
              class="collider"
            />
          </a-entity>
        )}
      </a-entity>
    )
  }

  // Generate artworks with classical frames and error handling
  const generateArtworks = () => {
    if (artworks.length === 0) return null

    const spacing = 10 // MASSIVE spacing between artworks for grand museum feel
    const eyeLevel = 7 // Higher eye level for taller walls and grand museum
    const wallDistance = 15 // Much further from center, creating more spacious feeling
    const performanceLevel = 'medium' // Could be detected dynamically

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
      const imageUrl = artwork.image_url && typeof artwork.image_url === 'string'
        ? artwork.image_url
        : (artwork.image_path ? getPublicImageUrl(artwork.image_path) : createPlaceholderDataURL(index));

      return (
        <a-entity key={artwork.id} className="artwork-display" data-artwork-index={index}>
          {/* LARGER Classical Frame with enhanced materials and collision */}
          <a-box
            position={`${xPosition} ${eyeLevel} ${zPosition}`}
            width="7"
            height="5.5"
            depth="0.5"
            material={`color: #8B4513; roughness: 0.1; metalness: 0.8; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
            rotation={rotation}
            shadow="cast: true; receive: true"
            geometry="primitive: box"
            class="collider"
          />
          
          {/* Inner ornate frame detail - LARGER with enhanced materials */}
          <a-box
            position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.27 : -0.27)}`}
            width="6.5"
            height="5"
            depth="0.2"
            material={`color: #DAA520; roughness: 0.1; metalness: 0.9; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
            rotation={rotation}
            shadow="cast: true; receive: true"
            geometry="primitive: box"
          />
          
          {/* Inner gold trim - LARGER with enhanced materials */}
          <a-box
            position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.37 : -0.37)}`}
            width="6"
            height="4.5"
            depth="0.15"
            material={`color: #FFD700; roughness: 0.05; metalness: 0.95; ${performanceLevel === 'low' ? 'shader: flat;' : ''}`}
            rotation={rotation}
            shadow="cast: true; receive: true"
            geometry="primitive: box"
          />
          
          {/* Artwork Image - MUCH LARGER with error handling and performance optimization */}
          <a-image
            position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.45 : -0.45)}`}
            width="5.5"
            height="4"
            src={imageUrl}
            rotation={rotation}
            className="clickable-artwork"
            data-raycastable
            crossorigin="anonymous"
            material={`shader: ${performanceLevel === 'low' ? 'flat' : 'standard'}; transparent: false; roughness: 0.1; metalness: 0.0`}
            geometry="primitive: plane"
            shadow="receive: true"
            animation__mouseenter="property: scale; to: 1.1 1.1 1; startEvents: mouseenter; dur: 400; easing: easeOutQuad"
            animation__mouseleave="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 400; easing: easeOutQuad"
            animation__click="property: scale; to: 1.2 1.2 1; startEvents: click; dur: 300; easing: easeOutBack"
          />
          
          {/* Fallback placeholder if image fails to load */}
          <a-plane
            position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.44 : -0.44)}`}
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
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        fontSize: '0.9rem',
        pointerEvents: 'none',
        maxWidth: '380px',
        border: '2px solid #DAA520',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '0.8rem', color: '#DAA520' }}>
          � <strong>Professional VR Gallery Controller</strong>
        </div>
        <div style={{ marginBottom: '0.3rem' }}>🎮 <strong>WASD</strong> - Smooth movement (Hold Shift to run)</div>
        <div style={{ marginBottom: '0.3rem' }}>⚡ <strong>Space</strong> - Jump (demonstrates gravity system)</div>
        <div style={{ marginBottom: '0.3rem' }}>🖱️ <strong>Mouse</strong> - Professional FPS-style camera control</div>
        <div style={{ marginBottom: '0.3rem' }}>� <strong>Click</strong> - Lock mouse pointer for full control</div>
        <div style={{ marginBottom: '0.3rem' }}>🌍 <strong>Physics</strong> - Realistic gravity and collision</div>
        <div style={{ marginBottom: '0.3rem' }}>� <strong>Boundaries</strong> - Smooth wall collision detection</div>
        <div style={{ marginBottom: '0.3rem' }}>💡 <strong>Adaptive</strong> - Performance scaling and shadows</div>
        <div style={{ marginBottom: '0.3rem' }}>📐 <strong>Limited Pitch</strong> - Natural vertical look limits</div>
        <div style={{ fontSize: '0.8rem', color: '#CCCCCC', marginTop: '0.5rem' }}>
          Pro Features: Momentum physics • Smooth acceleration • Professional mouse look • Collision sliding
        </div>
      </div>
      
      <a-scene
        ref={sceneRef}
        embedded
        style={{ height: '100%', width: '100%' }}
        vr-mode-ui="enabled: true"
        background="color: #2C2C2C"
        physics="driver: local; debug: false"
        shadow="type: pcfsoft; autoUpdate: true"
        fog="type: linear; color: #2C2C2C; near: 100; far: 200"
        renderer="antialias: true; colorManagement: true; physicallyCorrectLights: true"
        light="defaultLightsEnabled: false">
        
        {/* Main Architecture */}
        {generateArchitecture()}
        
        {/* Enhanced Museum Lighting System with Image Error Handling */}
        <a-entity gallery-lighting image-error-handler>
          {generateArtworks()}
        </a-entity>
        
        {/* Enhanced Lighting System */}
        <a-light 
          type="ambient" 
          color="#404040" 
          intensity="0.4" 
        />
        
        {/* Main Directional Light with shadows */}
        <a-light
          type="directional"
          position="20 30 10"
          color="#FFFFFF"
          intensity="1.2"
          shadow="cast: true; mapSize: 2048 2048"
          light="castShadow: true"
        />
        
        {/* Additional ceiling lights with realistic shadows */}
        {Array.from({ length: Math.floor((Math.max(artworks.length * 10, 120))/20) }, (_, i) => (
          <a-light
            key={`ceiling-light-${i}`}
            type="point"
            position={`${(i + 1) * 20} 22 0`}
            color="#FFFACD"
            intensity="1.8"
            distance="30"
            decay="2"
            shadow="cast: true; mapSize: 1024 1024"
          />
        ))}
        
        {/* Enhanced Camera with new player controller */}
        <a-entity 
          id="camera-rig"
          position="0 1.6 5"
          player-controller="
            movementSpeed: 4;
            runMultiplier: 2;
            mouseSensitivity: 0.15;
            smoothing: 0.12;
            verticalLookLimit: 85
          ">
          
          <a-camera
            id="camera"
            cursor="fuse: false; rayOrigin: mouse"
            raycaster="objects: [data-raycastable]; far: 30"
            camera="fov: 75; near: 0.1; far: 200"
            wasd-controls="enabled: false"
            look-controls="enabled: false"
          />
          
          {/* Enhanced dynamic lighting that follows camera */}
          <a-light
            type="spot"
            color="#FFFFFF"
            intensity="2"
            angle="45"
            penumbra="0.4"
            distance="20"
            decay="1.5"
            position="0 0.2 0"
            rotation="-5 0 0"
            shadow="cast: true; mapSize: 1024 1024"
          />
        </a-entity>
      </a-scene>
    </div>
  )
}

export default ModernGalleryRoom
