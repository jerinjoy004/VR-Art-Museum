# VR Museum Testing & Optimization Guide

## 🧪 Complete Testing Checklist

### Phase 1: Initial Setup & Debug Mode

#### 1.1 Enable Debug Mode
```javascript
// In your scene, set debug to true
player-controller="debug: true"
```

**Expected Results:**
- ✅ Red wireframe boxes around collision objects
- ✅ Yellow circles around bench collision areas
- ✅ Blue rectangle showing room boundaries
- ✅ Green wireframe plane showing ground surface
- ✅ Cyan/lime/red raycast line for ground detection
- ✅ Lime/orange indicator showing ground hit point

#### 1.2 Open Browser Developer Tools
```bash
# Press F12 or Ctrl+Shift+I
# Navigate to Console tab
# Filter for: player, collision, ground
```

**Expected Console Output:**
```
🎮 Initializing Player Controller...
Room boundaries: {minX: -7.2, maxX: 128, minZ: -17, maxZ: 17}
Player radius: 0.8
Collision system loaded: X colliders (Y DOM + Z generated)
Ground detection initialized with range: 2.0
Debug visuals created for X colliders and 1 ground surfaces
```

### Phase 2: Movement System Testing

#### 2.1 Basic WASD Movement
**Test Steps:**
1. Click canvas to lock mouse pointer
2. Test each key individually:
   - `W` - Move forward
   - `S` - Move backward  
   - `A` - Strafe left
   - `D` - Strafe right
3. Test diagonal movement (W+A, W+D, etc.)
4. Test running (Hold Shift + movement)

**Expected Behavior:**
- ✅ Smooth acceleration and deceleration
- ✅ No jittery movement
- ✅ Diagonal movement normalized (same speed as cardinal)
- ✅ Running feels 2x faster than walking
- ✅ Movement direction relative to camera facing

**Debug Console Output:**
```
Key pressed: KeyW Keys: {forward: true, backward: false, ...}
```

#### 2.2 Mouse Look System
**Test Steps:**
1. Move mouse horizontally (left/right)
2. Move mouse vertically (up/down)
3. Test rapid mouse movements
4. Test smooth, slow movements

**Expected Behavior:**
- ✅ Smooth horizontal rotation (unlimited)
- ✅ Vertical look limited to ±85 degrees
- ✅ No camera drift or lag
- ✅ Movement direction updates with camera rotation

**Performance Check:**
- Mouse sensitivity should feel natural (adjust `mouseSensitivity` if needed)
- No frame drops during rapid mouse movement

### Phase 3: Collision System Testing

#### 3.1 Wall Collision Testing
**Test Locations:**
1. **North Wall** (back of gallery)
2. **South Wall** (front entrance area)  
3. **East Wall** (end of gallery)
4. **West Wall** (entrance)

**Test Procedure for Each Wall:**
```
1. Walk directly into wall at 90° angle
   ✅ Player should stop smoothly
   ✅ No clipping through wall
   ✅ No bouncing or jittering

2. Walk into wall at 45° angle
   ✅ Player should slide along wall
   ✅ Movement continues parallel to wall
   ✅ Smooth sliding motion

3. Walk into corner (where two walls meet)
   ✅ Player should stop without clipping
   ✅ No getting stuck in corner
   ✅ Can move away from corner easily
```

**Debug Console Output:**
```
Box collision with collider-X, overlap: X=2.50, Z=0.00
Final position after collision resolution: {x: X, y: Y, z: Z}
```

#### 3.2 Artwork Frame Collision Testing
**Test Steps:**
1. Walk towards artwork frames from different angles
2. Try to walk "through" large frames
3. Test sliding along frame edges

**Expected Behavior:**
- ✅ Cannot walk through any artwork frame
- ✅ Smooth sliding around frame corners
- ✅ Can walk close to frames without clipping
- ✅ Visual collision boundaries match actual collision

#### 3.3 Furniture Collision Testing
**Test Museum Benches:**
1. Walk directly towards bench center
2. Walk around bench perimeter
3. Try to walk through bench

**Expected Behavior:**
- ✅ Circular collision detection around benches
- ✅ Smooth pushing away from bench center
- ✅ Can walk around bench naturally
- ✅ No getting stuck on bench edges

**Debug Console Output:**
```
Cylinder collision with generated-bench-X, distance: 2.45, radius: 3.3
```

### Phase 4: Gravity & Ground Detection Testing

#### 4.1 Ground Contact Testing
**Test Steps:**
1. Walk on main floor area
2. Check ground detection indicator (lime cylinder)
3. Monitor raycast visualization (cyan line)

**Expected Behavior:**
- ✅ Player stays at consistent height (1.6 units above ground)
- ✅ Lime indicator follows player on ground
- ✅ Cyan raycast line always visible pointing down
- ✅ Smooth height transitions

**Debug Console Output:**
```
Ground detected via raycast at height: 0.00, distance: 1.60
Player landed on ground at height: 1.60
```

#### 4.2 Jump Testing (Demonstrates Gravity)
**Test Steps:**
1. Press `Space` while on ground
2. Observe gravity pulling player down
3. Test multiple jumps

**Expected Behavior:**
- ✅ Player jumps with force (default: 8 units/s)
- ✅ Gravity pulls player down (-25 units/s²)
- ✅ Smooth landing on ground
- ✅ Cannot jump while in air

**Debug Console Output:**
```
Player jumped with force: 8
Player left ground, falling with gravity: -25
Player landed on ground at height: 1.60
```

#### 4.3 Edge Detection Testing
**Test Steps:**
1. Walk to edges of gallery space
2. Try to walk outside room boundaries
3. Test walking to furniture edges

**Expected Behavior:**
- ✅ Hard boundaries prevent leaving gallery
- ✅ Cannot fall through floor
- ✅ Safety reset if player falls below -5 units

### Phase 5: Performance Optimization Testing

#### 5.1 Frame Rate Monitoring
**Setup Performance Monitor:**
```javascript
// Add to browser console or create performance component
let frameCount = 0;
let lastTime = performance.now();
function monitorFPS() {
  frameCount++;
  const currentTime = performance.now();
  if (currentTime - lastTime >= 1000) {
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = currentTime;
  }
  requestAnimationFrame(monitorFPS);
}
monitorFPS();
```

**Performance Targets:**
- ✅ **60 FPS** consistently during movement
- ✅ **55+ FPS** minimum during complex scenes
- ✅ **<20ms** frame time
- ✅ **<100MB** memory usage

#### 5.2 Collision Performance Testing
**Load Testing:**
1. Move rapidly around gallery
2. Test sliding along multiple surfaces
3. Rapid direction changes

**Expected Performance:**
- ✅ No frame drops during collision detection
- ✅ Smooth movement at all times
- ✅ Debug visuals don't impact performance

**Optimization If Needed:**
```javascript
// Reduce collision check frequency for distant objects
// In collectColliders function, add distance check:
const playerPos = this.el.getAttribute('position');
const distance = Math.sqrt(
  Math.pow(position.x - playerPos.x, 2) + 
  Math.pow(position.z - playerPos.z, 2)
);
if (distance > 50) continue; // Skip distant colliders
```

### Phase 6: Supabase Integration Testing

#### 6.1 Dynamic Content Loading
**Test Steps:**
1. Load gallery with different numbers of artworks:
   - 0 artworks (empty gallery)
   - 5 artworks 
   - 20+ artworks (stress test)
2. Check collision system adapts to content

**Expected Behavior:**
- ✅ Room size scales with artwork count
- ✅ Collision boundaries update correctly
- ✅ Frame collision detection works for all artworks
- ✅ Performance remains stable with more content

#### 6.2 Image Loading & Physics Integration
**Test Steps:**
1. Load gallery with mix of image URLs:
   - Valid image URLs
   - Invalid/broken URLs
   - Large images (>2MB)
   - Small images (<100KB)

**Expected Behavior:**
- ✅ Physics system works regardless of image load status
- ✅ Collision detection unaffected by image loading
- ✅ Fallback images display correctly
- ✅ No physics glitches during image loading

### Phase 7: Parameter Tuning & Optimization

#### 7.1 Movement Parameter Tuning
**Current Defaults:**
```javascript
movementSpeed: 3.5,        // Base walking speed
runMultiplier: 2.0,        // Running speed multiplier
friction: 0.85,            // Movement friction (0-1)
acceleration: 65,          // How fast to reach target speed
```

**Tuning Guidelines:**
- **Too Slow**: Increase `movementSpeed` to 4-5
- **Too Fast**: Decrease `movementSpeed` to 2-3
- **Slippery**: Increase `friction` to 0.9-0.95
- **Sluggish**: Increase `acceleration` to 80-100
- **Twitchy**: Decrease `acceleration` to 40-60

#### 7.2 Camera Parameter Tuning
**Current Defaults:**
```javascript
mouseSensitivity: 0.2,     // Mouse look sensitivity
smoothing: 0.1,            // Camera smoothing (0-1)
verticalLookLimit: 85,     // Vertical look limit in degrees
```

**Tuning Guidelines:**
- **Too Sensitive**: Decrease `mouseSensitivity` to 0.1-0.15
- **Too Slow**: Increase `mouseSensitivity` to 0.25-0.3
- **Laggy Feel**: Decrease `smoothing` to 0.05-0.08
- **Too Snappy**: Increase `smoothing` to 0.15-0.2

#### 7.3 Physics Parameter Tuning
**Current Defaults:**
```javascript
gravity: -25,              // Gravity strength
maxFallSpeed: -20,         // Terminal velocity
groundCheckDistance: 2.0,  // Raycast range
groundStickDistance: 0.1,  // Ground adhesion
jumpForce: 8,              // Jump strength
```

**Tuning Guidelines:**
- **Floaty Feel**: Increase `gravity` to -30 or -35
- **Too Heavy**: Decrease `gravity` to -20 or -15
- **Weak Jumps**: Increase `jumpForce` to 10-12
- **Too Bouncy**: Decrease `jumpForce` to 6-7

#### 7.4 Collision Parameter Tuning
**Current Defaults:**
```javascript
playerRadius: 0.8,         // Player collision sphere radius
```

**Tuning Guidelines:**
- **Getting Stuck**: Decrease `playerRadius` to 0.6-0.7
- **Clipping Through**: Increase `playerRadius` to 0.9-1.0
- **Can't Get Close**: Decrease `playerRadius` to 0.5-0.6

### Phase 8: Advanced Debugging & Troubleshooting

#### 8.1 Common Issues & Solutions

**Issue: Player Clipping Through Walls**
```
Debug Steps:
1. Check if collision class is applied: class="collider"
2. Verify collision box creation in console
3. Check collision boundaries in debug mode
4. Increase playerRadius if needed
```

**Issue: Stuttering Movement**
```
Debug Steps:
1. Check FPS in browser performance tab
2. Reduce texture sizes if needed
3. Check for memory leaks in console
4. Disable debug mode for better performance
```

**Issue: Ground Detection Not Working**
```
Debug Steps:
1. Check raycast visualization (cyan line)
2. Verify ground surface definition
3. Check groundCheckDistance parameter
4. Look for "Ground detected" messages in console
```

**Issue: Poor Performance**
```
Optimization Steps:
1. Reduce image sizes to <512KB each
2. Limit artwork count to <30 per room
3. Disable debug mode in production
4. Use shader: flat for low-end devices
```

#### 8.2 Debug Console Commands
```javascript
// Get current player position
document.querySelector('#camera-rig').getAttribute('position')

// Check collision boxes count
document.querySelector('#camera-rig').components['player-controller'].collisionBoxes.length

// Toggle debug mode at runtime
document.querySelector('#camera-rig').setAttribute('player-controller', 'debug', true)

// Check ground detection
document.querySelector('#camera-rig').components['player-controller'].detectGround(
  document.querySelector('#camera-rig').getAttribute('position')
)
```

### Phase 9: Production Optimization

#### 9.1 Final Performance Settings
```javascript
// Recommended production settings
player-controller="
  movementSpeed: 4;
  runMultiplier: 2;
  mouseSensitivity: 0.15;
  friction: 0.9;
  acceleration: 70;
  gravity: -25;
  jumpForce: 8;
  playerRadius: 0.8;
  debug: false
"
```

#### 9.2 A-Frame Scene Optimization
```jsx
<a-scene
  renderer="antialias: false; colorManagement: true; physicallyCorrectLights: false"
  shadow="type: basic; autoUpdate: false"
  vr-mode-ui="enabled: true"
  background="color: #2C2C2C"
>
```

#### 9.3 Image Optimization Guidelines
- **Texture Size**: Max 1024x1024 for artwork images
- **Format**: Use WebP if supported, fallback to JPEG
- **Compression**: 80-85% quality for good balance
- **Loading**: Implement progressive loading for large galleries

### ✅ Testing Completion Checklist

- [ ] All movement controls work smoothly
- [ ] No clipping through any objects
- [ ] Smooth sliding along all surfaces
- [ ] Ground detection working correctly
- [ ] Gravity and jumping feel natural
- [ ] 60 FPS performance maintained
- [ ] Debug mode shows correct collision boundaries
- [ ] Supabase content loads without physics issues
- [ ] Parameter tuning completed for optimal feel
- [ ] Production settings applied
- [ ] No console errors during normal gameplay

### 🎯 Success Criteria

**Movement Quality:**
- Responsive, smooth WASD movement
- Natural mouse look with no lag
- Intuitive running with Shift key

**Collision Accuracy:**
- 100% solid barriers (no clipping)
- Smooth sliding along all surfaces
- Natural behavior around corners and edges

**Physics Realism:**
- Consistent ground contact
- Natural gravity feel
- Stable performance at 60 FPS

**Integration Stability:**
- Dynamic content loads correctly
- Physics unaffected by content changes
- Stable memory usage over time
