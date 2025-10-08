// VR Museum Automated Testing Suite
// Run this in the browser console to test performance and functionality

const VRMuseumTester = {
  results: {},
  isRunning: false,

  // Initialize testing suite
  init() {
    console.log('🎯 VR Museum Testing Suite Initialized');
    this.createTestUI();
    this.setupEventListeners();
  },

  // Create floating test UI
  createTestUI() {
    const testPanel = document.createElement('div');
    testPanel.id = 'vr-test-panel';
    testPanel.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        width: 300px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 15px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        border: 2px solid #00ff00;
      ">
        <h3 style="margin: 0 0 10px 0; color: #00ff00;">🎮 VR Museum Tester</h3>
        
        <div id="fps-display" style="margin-bottom: 5px;">FPS: --</div>
        <div id="memory-display" style="margin-bottom: 5px;">Memory: --</div>
        <div id="artworks-display" style="margin-bottom: 5px;">Artworks: --</div>
        <div id="position-display" style="margin-bottom: 10px;">Position: --</div>
        
        <button id="run-performance-test" style="
          background: #007acc;
          color: white;
          border: none;
          padding: 5px 10px;
          margin: 2px;
          border-radius: 3px;
          cursor: pointer;
        ">Performance Test</button>
        
        <button id="run-movement-test" style="
          background: #007acc;
          color: white;
          border: none;
          padding: 5px 10px;
          margin: 2px;
          border-radius: 3px;
          cursor: pointer;
        ">Movement Test</button>
        
        <button id="run-collision-test" style="
          background: #007acc;
          color: white;
          border: none;
          padding: 5px 10px;
          margin: 2px;
          border-radius: 3px;
          cursor: pointer;
        ">Collision Test</button>
        
        <button id="run-full-suite" style="
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 15px;
          margin: 5px 0;
          border-radius: 3px;
          cursor: pointer;
          width: 100%;
        ">🚀 Run Full Test Suite</button>
        
        <div id="test-status" style="
          margin-top: 10px;
          padding: 5px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          min-height: 20px;
        ">Ready to test...</div>
      </div>
    `;
    
    document.body.appendChild(testPanel);
  },

  // Setup event listeners for test buttons
  setupEventListeners() {
    document.getElementById('run-performance-test').onclick = () => this.runPerformanceTest();
    document.getElementById('run-movement-test').onclick = () => this.runMovementTest();
    document.getElementById('run-collision-test').onclick = () => this.runCollisionTest();
    document.getElementById('run-full-suite').onclick = () => this.runFullTestSuite();
    
    // Start real-time monitoring
    this.startMonitoring();
  },

  // Real-time performance monitoring
  startMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updateDisplay = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        document.getElementById('fps-display').textContent = `FPS: ${fps}`;
        
        if (performance.memory) {
          const memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
          document.getElementById('memory-display').textContent = `Memory: ${memory}MB`;
        }
        
        const artworkCount = document.querySelectorAll('[artwork]').length;
        document.getElementById('artworks-display').textContent = `Artworks: ${artworkCount}`;
        
        // Get player position if available
        const camera = document.querySelector('[camera]');
        if (camera) {
          const pos = camera.getAttribute('position');
          const posStr = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
          document.getElementById('position-display').textContent = `Position: ${posStr}`;
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(updateDisplay);
    };
    
    updateDisplay();
  },

  // Performance Test
  async runPerformanceTest() {
    this.updateStatus('🔄 Running performance test...');
    
    const results = {
      averageFPS: 0,
      minFPS: Infinity,
      maxFPS: 0,
      memoryUsage: 0,
      frameDrops: 0
    };
    
    const frames = [];
    const testDuration = 10000; // 10 seconds
    const startTime = performance.now();
    let frameDrops = 0;
    
    const measureFrame = () => {
      const now = performance.now();
      frames.push(now);
      
      if (frames.length > 1) {
        const frameTime = now - frames[frames.length - 2];
        const fps = 1000 / frameTime;
        
        if (fps < 25) frameDrops++; // Count significant frame drops
        
        results.minFPS = Math.min(results.minFPS, fps);
        results.maxFPS = Math.max(results.maxFPS, fps);
      }
      
      if (now - startTime < testDuration) {
        requestAnimationFrame(measureFrame);
      } else {
        // Calculate results
        results.averageFPS = Math.round(frames.length / (testDuration / 1000));
        results.frameDrops = frameDrops;
        results.memoryUsage = performance.memory ? 
          Math.round(performance.memory.usedJSHeapSize / 1048576) : 'N/A';
        
        this.displayPerformanceResults(results);
      }
    };
    
    requestAnimationFrame(measureFrame);
  },

  // Movement Test
  async runMovementTest() {
    this.updateStatus('🚶 Testing movement system...');
    
    const camera = document.querySelector('[camera]');
    if (!camera) {
      this.updateStatus('❌ No camera found!');
      return;
    }
    
    const startPos = camera.getAttribute('position');
    const movements = [
      { key: 'KeyW', direction: 'forward', duration: 1000 },
      { key: 'KeyS', direction: 'backward', duration: 1000 },
      { key: 'KeyA', direction: 'left', duration: 1000 },
      { key: 'KeyD', direction: 'right', duration: 1000 }
    ];
    
    for (const movement of movements) {
      this.updateStatus(`🔄 Testing ${movement.direction} movement...`);
      
      // Simulate key press
      this.simulateKeyPress(movement.key, movement.duration);
      
      await new Promise(resolve => setTimeout(resolve, movement.duration + 100));
      
      const newPos = camera.getAttribute('position');
      const moved = this.calculateDistance(startPos, newPos) > 0.1;
      
      console.log(`Movement ${movement.direction}:`, moved ? '✅ Working' : '❌ Failed');
    }
    
    this.updateStatus('✅ Movement test complete');
  },

  // Collision Test
  async runCollisionTest() {
    this.updateStatus('🛡️ Testing collision detection...');
    
    const camera = document.querySelector('[camera]');
    if (!camera) {
      this.updateStatus('❌ No camera found!');
      return;
    }
    
    const walls = document.querySelectorAll('.wall, .room-wall, .barrier');
    const artworks = document.querySelectorAll('[artwork]');
    
    console.log(`Found ${walls.length} walls and ${artworks.length} artworks for collision testing`);
    
    // Test wall collision
    if (walls.length > 0) {
      const wall = walls[0];
      const wallPos = wall.getAttribute('position');
      
      // Try to move into wall
      camera.setAttribute('position', `${wallPos.x} ${wallPos.y} ${wallPos.z}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalPos = camera.getAttribute('position');
      const stoppedByWall = this.calculateDistance(wallPos, finalPos) > 0.5;
      
      console.log('Wall collision:', stoppedByWall ? '✅ Working' : '❌ Failed');
    }
    
    this.updateStatus('✅ Collision test complete');
  },

  // Full Test Suite
  async runFullTestSuite() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateStatus('🚀 Running full test suite...');
    
    const suite = [
      { name: 'Performance', test: () => this.runPerformanceTest() },
      { name: 'Movement', test: () => this.runMovementTest() },
      { name: 'Collision', test: () => this.runCollisionTest() },
      { name: 'Assets', test: () => this.testAssetLoading() },
      { name: 'Memory', test: () => this.testMemoryUsage() }
    ];
    
    for (const test of suite) {
      this.updateStatus(`🔄 Running ${test.name} test...`);
      try {
        await test.test();
        console.log(`✅ ${test.name} test passed`);
      } catch (error) {
        console.error(`❌ ${test.name} test failed:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.generateReport();
    this.isRunning = false;
  },

  // Asset Loading Test
  async testAssetLoading() {
    const images = document.querySelectorAll('a-image, [material*="src:"]');
    const models = document.querySelectorAll('a-gltf-model, [gltf-model]');
    
    let loadedImages = 0;
    let failedImages = 0;
    
    for (const img of images) {
      try {
        const src = img.getAttribute('src') || img.getAttribute('material').match(/src:\s*([^;]+)/)?.[1];
        if (src) {
          await this.checkImageLoad(src);
          loadedImages++;
        }
      } catch (error) {
        failedImages++;
        console.warn('Failed to load image:', error);
      }
    }
    
    console.log(`Asset loading: ${loadedImages} loaded, ${failedImages} failed`);
  },

  // Memory Usage Test
  async testMemoryUsage() {
    if (!performance.memory) {
      console.log('Memory API not available');
      return;
    }
    
    const initial = performance.memory.usedJSHeapSize;
    
    // Simulate heavy usage
    for (let i = 0; i < 5; i++) {
      this.updateStatus(`🧠 Memory test iteration ${i + 1}/5...`);
      
      // Create temporary load
      const tempData = new Array(1000000).fill(0).map(() => Math.random());
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force cleanup
      tempData.length = 0;
      
      if (window.gc) {
        window.gc();
      }
    }
    
    const final = performance.memory.usedJSHeapSize;
    const leak = final - initial;
    
    console.log(`Memory test: ${Math.round(leak / 1024 / 1024)}MB difference`);
  },

  // Helper Functions
  updateStatus(message) {
    document.getElementById('test-status').textContent = message;
    console.log(message);
  },

  simulateKeyPress(key, duration) {
    const event = new KeyboardEvent('keydown', { code: key });
    document.dispatchEvent(event);
    
    setTimeout(() => {
      const upEvent = new KeyboardEvent('keyup', { code: key });
      document.dispatchEvent(upEvent);
    }, duration);
  },

  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  checkImageLoad(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });
  },

  displayPerformanceResults(results) {
    const status = `
      📊 Performance Results:
      Avg FPS: ${results.averageFPS}
      Min FPS: ${Math.round(results.minFPS)}
      Max FPS: ${Math.round(results.maxFPS)}
      Frame Drops: ${results.frameDrops}
      Memory: ${results.memoryUsage}MB
    `;
    
    this.updateStatus(status);
    console.log('Performance Results:', results);
  },

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      results: this.results,
      recommendations: this.generateRecommendations()
    };
    
    console.log('🎯 VR Museum Test Report:', report);
    this.updateStatus('📄 Test complete! Check console for full report.');
    
    // Download report as JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vr-museum-test-report-${Date.now()}.json`;
    a.click();
  },

  generateRecommendations() {
    const recommendations = [];
    
    // Add recommendations based on results
    if (this.results.averageFPS < 30) {
      recommendations.push('Consider reducing artwork count or image quality for better performance');
    }
    
    if (this.results.memoryUsage > 500) {
      recommendations.push('High memory usage detected - implement texture compression or LOD system');
    }
    
    if (this.results.frameDrops > 10) {
      recommendations.push('Frequent frame drops detected - optimize collision detection or reduce scene complexity');
    }
    
    return recommendations;
  }
};

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  window.VRMuseumTester = VRMuseumTester;
  
  // Auto-start if A-Frame is already loaded
  if (typeof AFRAME !== 'undefined') {
    VRMuseumTester.init();
  } else {
    // Wait for A-Frame to load
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof AFRAME !== 'undefined') {
        VRMuseumTester.init();
      } else {
        console.log('Waiting for A-Frame to load...');
        setTimeout(() => VRMuseumTester.init(), 2000);
      }
    });
  }
}

console.log(`
🎮 VR Museum Testing Suite Loaded!

Usage:
- VRMuseumTester.init() - Initialize the testing UI
- VRMuseumTester.runPerformanceTest() - Test FPS and memory
- VRMuseumTester.runMovementTest() - Test WASD movement
- VRMuseumTester.runCollisionTest() - Test collision detection
- VRMuseumTester.runFullTestSuite() - Run all tests

The testing UI will appear in the top-right corner of your screen.
`);
