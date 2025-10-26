import React, { useEffect, useRef } from 'react';

function ModernGalleryRoom({ artworks = [], roomData = null }) {
  const sceneRef = useRef(null);

  console.log('ModernGalleryRoom render:', {
    artworksCount: artworks.length,
    roomName: roomData?.room_name || 'Museum Gallery'
  });

  useEffect(() => {
    if (typeof AFRAME !== 'undefined') {
      setTimeout(() => {
        initializeGallery();
      }, 500); // Delay to ensure A-Frame scene is fully loaded
    }
  }, [artworks]);

  const initializeGallery = () => {
    // Check for common image loading issues
    console.log('🖼️ Initializing gallery with', artworks.length, 'artworks...');
    if (artworks.some(artwork => artwork.image_url?.includes('cloudflare') || artwork.image_url?.includes('cdn'))) {
      console.warn('⚠️ Detected external CDN images - may encounter CORS/cookie issues');
      console.log('💡 Consider using local images or CORS-enabled hosting for best performance');
    }

    // 1. Enhanced physics and movement constraint component
    if (!AFRAME.components['constrained-movement']) {
      AFRAME.registerComponent('constrained-movement', {
        schema: {
          roomLength: { type: 'number', default: 120 },
          roomWidth: { type: 'number', default: 40 },
          barrierDistance: { type: 'number', default: 4 }
        },

        init: function () {
          console.log('Initializing enhanced constrained movement with wall-sliding physics...');
          this.velocity = new THREE.Vector3();
          this.movementSpeed = 0.08;
          this.artworkBarriers = [];
          this.roomLength = Math.max(artworks.length * 10, 120);
          this.roomWidth = 40;
          this.groundHeight = 1.6;

          this.calculateArtworkBarriers();

          this.keys = {};
          document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
          document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        },

        calculateArtworkBarriers: function () {
          const artworkSpacing = 10;
          for (let i = 0; i < artworks.length; i++) {
            const xPos = i * artworkSpacing + artworkSpacing + 5;
            this.artworkBarriers.push({
              x: xPos,
              zLeft: -15,
              zRight: 15,
              radius: this.data.barrierDistance
            });
          }
        },

        tick: function () {
          this.handleCollisionAndMovement();
        },

        // NEW: Replaced previous movement logic with this superior wall-sliding function
        handleCollisionAndMovement: function () {
          const el = this.el;
          const currentPos = el.getAttribute('position');
          const rotation = el.getAttribute('rotation');

          const radY = THREE.MathUtils.degToRad(rotation.y);
          const forward = new THREE.Vector3(-Math.sin(radY), 0, -Math.cos(radY));
          const right = new THREE.Vector3(Math.cos(radY), 0, -Math.sin(radY));

          this.velocity.set(0, 0, 0);
          if (this.keys['KeyW']) this.velocity.add(forward);
          if (this.keys['KeyS']) this.velocity.sub(forward);
          if (this.keys['KeyA']) this.velocity.sub(right);
          if (this.keys['KeyD']) this.velocity.add(right);

          if (this.velocity.length() > 0) {
            this.velocity.normalize().multiplyScalar(this.movementSpeed);
          } else {
            if (currentPos.y !== this.groundHeight) {
              el.setAttribute('position', { x: currentPos.x, y: this.groundHeight, z: currentPos.z });
            }
            return; // No movement, exit early
          }

          // Wall Sliding Logic: Checks X and Z movement independently
          const nextPos = { ...currentPos };
          const finalPos = { ...currentPos, y: this.groundHeight }; // Always maintain ground height

          // Test X-axis movement
          nextPos.x += this.velocity.x;
          if (this.isValidPosition(nextPos)) {
            finalPos.x = nextPos.x;
          }
          nextPos.x = currentPos.x; // Reset for Z-axis test

          // Test Z-axis movement
          nextPos.z += this.velocity.z;
          if (this.isValidPosition(nextPos)) {
            finalPos.z = nextPos.z;
          }

          el.setAttribute('position', finalPos);
        },

        isValidPosition: function (pos) {
          // Strict wall barrier checks
          if (pos.x < -8 || pos.x > this.roomLength + 8) return false;
          if (pos.z < -this.roomWidth / 2 + 3 || pos.z > this.roomWidth / 2 - 3) return false;

          // Artwork barrier checks
          for (let barrier of this.artworkBarriers) {
            const distToLeftArt = Math.hypot(pos.x - barrier.x, pos.z - barrier.zLeft);
            const distToRightArt = Math.hypot(pos.x - barrier.x, pos.z - barrier.zRight);
            if (distToLeftArt < barrier.radius || distToRightArt < barrier.radius) {
              return false;
            }
          }

          // Museum bench collision detection
          const benchCount = Math.floor(this.roomLength / 60);
          for (let i = 0; i < benchCount; i++) {
            const benchX = (i + 1) * 30 + 10;
            const distToBench = Math.hypot(pos.x - benchX, pos.z);
            if (distToBench < 2.5) {
              return false;
            }
          }

          return true;
        },
      });
    }

    // 2. Image error handling component (Unchanged)
    if (!AFRAME.components['image-error-handler']) {
      AFRAME.registerComponent('image-error-handler', {
        init: function () {
          console.log('Initializing image error handler...');
          const el = this.el;
          const scene = el.sceneEl;
          scene.addEventListener('materialtextureloaded', (evt) => {
            console.log('Texture loaded successfully:', evt.detail.src);
          });
          scene.addEventListener('materialtextureloaderror', (evt) => {
            console.warn('Texture loading error:', evt.detail.src);
            this.handleImageError(evt.detail.src);
          });
          this.monitorImages();
        },
        monitorImages: function () {
          const images = document.querySelectorAll('a-image');
          images.forEach((img, index) => {
            const src = img.getAttribute('src');
            img.setAttribute('crossorigin', 'anonymous');
            if (src) {
              this.testImageLoad(src, img, index);
            }
          });
        },
        testImageLoad: function (src, imgElement, index) {
          const testImg = new Image();
          testImg.crossOrigin = 'anonymous';
          testImg.onload = () => {
            console.log(`Image ${index + 1} loaded successfully:`, src);
            const loadingEl = imgElement.parentElement?.querySelector('.loading-indicator');
            if (loadingEl) loadingEl.setAttribute('visible', false);
          };
          testImg.onerror = (error) => {
            console.error(`Image ${index + 1} failed to load:`, src, error);
            this.showFallback(imgElement, index);
          };
          testImg.src = src;
        },
        showFallback: function (imgElement, index) {
          imgElement.setAttribute('visible', false);
          const fallbackEl = imgElement.parentElement?.querySelector('.image-fallback');
          if (fallbackEl) {
            fallbackEl.setAttribute('visible', true);
          }
          const loadingEl = imgElement.parentElement?.querySelector('.loading-indicator');
          if (loadingEl) {
            loadingEl.setAttribute('value', `Image ${index + 1} - Load Error`);
            loadingEl.setAttribute('color', '#FF6B6B');
            loadingEl.setAttribute('visible', true);
          }
        },
        handleImageError: function (src) {
          console.log('🔧 Handling image error for:', src);
          if (src && (src.includes('cloudflare') || src.includes('__cf_bm'))) {
            console.warn('🍪 Cloudflare cookie issue detected! Use CORS-enabled hosting.');
          }
        }
      });
    }

    // 3. Lighting component (Unchanged)
    if (!AFRAME.components['gallery-lighting']) {
      AFRAME.registerComponent('gallery-lighting', {
        init: function () {
          console.log('Initializing gallery lighting...');
          const camera = document.getElementById('camera');
          if (camera) {
            const spotlight = document.createElement('a-light');
            spotlight.setAttribute('type', 'spot');
            spotlight.setAttribute('intensity', '2');
            spotlight.setAttribute('angle', '60');
            spotlight.setAttribute('penumbra', '0.3');
            spotlight.setAttribute('distance', '25');
            spotlight.setAttribute('position', '0 0.5 0');
            camera.appendChild(spotlight);
          }
        }
      });
    }
  };

  // Generate classical museum architecture (Unchanged)
  const generateArchitecture = () => {
    const roomLength = Math.max(artworks.length * 10, 120);
    const roomWidth = 40;
    const wallHeight = 25;
    return (
      <a-entity id="architecture">
        {/* Floor */}
        <a-plane position={`${roomLength / 2} 0 0`} rotation="-90 0 0" width={roomLength + 25} height={roomWidth + 8} material="color: #8B4513; roughness: 0.9; repeat: 15 8" />
        {/* Walls */}
        <a-box position={`${roomLength / 2} ${wallHeight / 2} ${-roomWidth / 2 - 3}`} width={roomLength + 25} height={wallHeight} depth="2" material="color: #F5F5DC; roughness: 0.8; repeat: 20 6" />
        <a-box position={`${roomLength / 2} ${wallHeight / 2} ${roomWidth / 2 + 3}`} width={roomLength + 25} height={wallHeight} depth="2" material="color: #F5F5DC; roughness: 0.8; repeat: 20 6" />
        <a-box position={`${roomLength + 12} ${wallHeight / 2} 0`} width="2" height={wallHeight} depth={roomWidth + 10} material="color: #F5F5DC; roughness: 0.8;" />
        {/* Front Wall Entrance */}
        <a-box position={`-10 ${wallHeight / 2} ${-(roomWidth + 8) / 3}`} width="2" height={wallHeight} depth={(roomWidth + 8) / 3} material="color: #F5F5DC; roughness: 0.8;" />
        <a-box position={`-10 ${wallHeight / 2} ${(roomWidth + 8) / 3}`} width="2" height={wallHeight} depth={(roomWidth + 8) / 3} material="color: #F5F5DC; roughness: 0.8;" />
        {/* Ceiling */}
        <a-plane position={`${roomLength / 2} ${wallHeight} 0`} rotation="90 0 0" width={roomLength + 25} height={roomWidth + 8} material="color: #FFFFFF; roughness: 0.3; repeat: 15 8" />
        {/* Museum benches */}
        {Array.from({ length: Math.floor(roomLength / 60) }, (_, i) => (
          <a-entity key={`bench-${i}`} position={`${(i + 1) * 30 + 10} 0.8 0`}>
            <a-box width="4" height="0.8" depth="1.2" material="color: #8B4513; roughness: 0.4" />
          </a-entity>
        ))}
      </a-entity>
    );
  };

  // Generate artworks with frames and error handling (Unchanged)
  const generateArtworks = () => {
    if (artworks.length === 0) return null;
    const spacing = 10;
    const eyeLevel = 7;
    const wallDistance = 15;
    return artworks.map((artwork, index) => {
      const xPosition = index * spacing + spacing + 5;
      const isLeftWall = index % 2 === 0;
      const zPosition = isLeftWall ? -wallDistance : wallDistance;
      const rotation = isLeftWall ? "0 0 0" : "0 180 0";
      return (
        <a-entity key={artwork.id} className="artwork-display">
          {/* Frame */}
          <a-box position={`${xPosition} ${eyeLevel} ${zPosition}`} width="7" height="5.5" depth="0.5" material="color: #8B4513;" rotation={rotation} />
          {/* Artwork Image */}
          <a-image position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.45 : -0.45)}`} width="5.5" height="4" src={artwork.image_url} rotation={rotation} data-raycastable animation__mouseenter="property: scale; to: 1.1 1.1 1; startEvents: mouseenter; dur: 400" animation__mouseleave="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 400" />
          {/* Fallback Placeholder */}
          <a-plane position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.44 : -0.44)}`} width="5.5" height="4" material="color: #E5E5E5; opacity: 0.3" rotation={rotation} visible="false" className="image-fallback" />
          {/* Loading/Error Text */}
          <a-text position={`${xPosition} ${eyeLevel} ${zPosition + (isLeftWall ? 0.4 : -0.4)}`} value={"Loading..."} align="center" width="8" color="#666666" rotation={rotation} className="loading-indicator" />
          {/* Label Plaque */}
          <a-plane position={`${xPosition} ${eyeLevel - 3.5} ${zPosition + (isLeftWall ? 0.45 : -0.45)}`} width="5.5" height="1.5" material="color: #2F2F2F;" rotation={rotation} />
          <a-text position={`${xPosition} ${eyeLevel - 3.2} ${zPosition + (isLeftWall ? 0.48 : -0.48)}`} value={artwork.title || `Artwork ${index + 1}`} align="center" width="10" color="#FFFFFF" rotation={rotation} />
          <a-text position={`${xPosition} ${eyeLevel - 3.6} ${zPosition + (isLeftWall ? 0.48 : -0.48)}`} value={`by ${roomData?.artist_name || 'Unknown Artist'}`} align="center" width="8" color="#CCCCCC" rotation={rotation} />
          {/* Artwork Spotlight */}
          <a-light type="spot" position={`${xPosition} ${eyeLevel + 5} ${zPosition + (isLeftWall ? -4 : 4)}`} rotation={isLeftWall ? "45 0 0" : "45 180 0"} color="#FFFACD" intensity="4" angle="30" penumbra="0.3" distance="18" decay="1.2" />
        </a-entity>
      );
    });
  };

  return (
    <div className="vr-container" style={{ height: '100vh', width: '85vw' }}>
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, background: 'rgba(0,0,0,0.85)', color: 'white', padding: '1rem', borderRadius: '10px', pointerEvents: 'none', border: '2px solid #DAA520' }}>
        <div>🏛️ <strong>Grand Cathedral Gallery</strong></div>
        <div>🎮 <strong>WASD</strong> to walk (with wall-sliding!)</div>
        <div>🖱️ <strong>Mouse</strong> to look around</div>
        <div>💡 <strong>Dynamic lighting</strong> follows your view</div>
      </div>

      <a-scene
        ref={sceneRef}
        embedded
        style={{ height: '100%', width: '100%' }}
        vr-mode-ui="enabled: true"
        background="color: #2C2C2C"
        physics="driver: local; debug: false"
        fog="type: linear; color: #2C2C2C; near: 100; far: 200"
      >
        {generateArchitecture()}
        <a-entity gallery-lighting image-error-handler>
          {generateArtworks()}
        </a-entity>

        <a-light type="ambient" color="#404040" intensity="0.7" />
        <a-light type="directional" position="20 20 10" color="#FFFFFF" intensity="1.5" />

        {/* Camera with enhanced movement and physics */}
        <a-entity
          id="camera"
          position="0 1.6 5"
          kinematic-body="shape: box; height: 1.6; width: 0.5; depth: 0.5;"
          constrained-movement
          look-controls="pointerLockEnabled: true; reverseMouseDrag: false"
        >
          <a-camera
            cursor="fuse: false; rayOrigin: mouse"
            raycaster="objects: [data-raycastable]; far: 30"
          />
        </a-entity>
      </a-scene>
    </div>
  );
}

export default ModernGalleryRoom;