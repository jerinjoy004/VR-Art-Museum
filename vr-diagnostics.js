// VR Museum Diagnostic Tool - Quick Issue Detection
// Paste this into browser console for instant health check

const VRDiagnostics = {
  issues: [],
  warnings: [],
  info: [],

  // Run complete diagnostic
  async runDiagnostic() {
    console.log('🔍 Running VR Museum Diagnostics...\n');
    
    this.checkAFrameSetup();
    this.checkPlayerController();
    this.checkPerformance();
    this.checkAssets();
    this.checkCollisionSystem();
    this.checkSupabaseConnection();
    
    await this.runQuickPerformanceTest();
    
    this.generateReport();
  },

  // Check A-Frame basic setup
  checkAFrameSetup() {
    console.log('🎮 Checking A-Frame Setup...');
    
    if (typeof AFRAME === 'undefined') {
      this.issues.push('A-Frame is not loaded');
      return;
    }
    
    const scene = document.querySelector('a-scene');
    if (!scene) {
      this.issues.push('No A-Frame scene found');
      return;
    }
    
    // Check WebGL support
    const canvas = scene.canvas;
    if (!canvas) {
      this.warnings.push('Scene canvas not ready');
    } else {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        this.issues.push('WebGL not supported');
      } else {
        this.info.push('✅ A-Frame and WebGL working correctly');
      }
    }
    
    // Check VR/AR capabilities
    if (navigator.xr) {
      this.info.push('✅ WebXR supported');
    } else {
      this.warnings.push('WebXR not available (VR features limited)');
    }
  },

  // Check player controller component
  checkPlayerController() {
    console.log('🚶 Checking Player Controller...');
    
    const playerController = AFRAME.components['player-controller'];
    if (!playerController) {
      this.issues.push('Player controller component not registered');
      return;
    }
    
    const camera = document.querySelector('[camera]');
    if (!camera) {
      this.issues.push('No camera entity found');
      return;
    }
    
    const hasController = camera.getAttribute('player-controller');
    if (!hasController) {
      this.warnings.push('Player controller not attached to camera');
    } else {
      this.info.push('✅ Player controller properly configured');
    }
    
    // Check for required HTML elements
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const hasPointerLock = document.pointerLockElement !== undefined;
      if (!hasPointerLock) {
        this.warnings.push('Pointer lock API not available');
      }
    }
  },

  // Check current performance
  checkPerformance() {
    console.log('📊 Checking Performance...');
    
    // Memory check
    if (performance.memory) {
      const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
      if (memoryMB > 800) {
        this.issues.push(`High memory usage: ${memoryMB}MB`);
      } else if (memoryMB > 400) {
        this.warnings.push(`Moderate memory usage: ${memoryMB}MB`);
      } else {
        this.info.push(`✅ Memory usage OK: ${memoryMB}MB`);
      }
    } else {
      this.warnings.push('Memory monitoring not available');
    }
    
    // Check for common performance issues
    const images = document.querySelectorAll('a-image, [material*="src:"]');
    if (images.length > 100) {
      this.warnings.push(`High image count: ${images.length} (consider LOD system)`);
    }
    
    const entities = document.querySelectorAll('a-entity');
    if (entities.length > 500) {
      this.warnings.push(`High entity count: ${entities.length} (may impact performance)`);
    }
  },

  // Check asset loading
  checkAssets() {
    console.log('🖼️ Checking Assets...');
    
    const images = document.querySelectorAll('[material*="src:"], a-image[src]');
    let loadedImages = 0;
    let failedImages = 0;
    
    images.forEach(img => {
      const material = img.getAttribute('material');
      const src = img.getAttribute('src') || (material && material.src);
      
      if (src) {
        // Check if image appears to be loaded
        if (img.complete !== false) {
          loadedImages++;
        } else {
          failedImages++;
        }
      }
    });
    
    if (failedImages > 0) {
      this.issues.push(`${failedImages} images failed to load`);
    } else if (loadedImages > 0) {
      this.info.push(`✅ ${loadedImages} images loaded successfully`);
    }
    
    // Check for external URLs that might cause CORS issues
    const externalImages = Array.from(images).filter(img => {
      const src = img.getAttribute('src') || '';
      return src.startsWith('http') && !src.includes(window.location.hostname);
    });
    
    if (externalImages.length > 0) {
      this.warnings.push(`${externalImages.length} external images (potential CORS issues)`);
    }
  },

  // Check collision system
  checkCollisionSystem() {
    console.log('🛡️ Checking Collision System...');
    
    const colliders = document.querySelectorAll('.wall, .room-wall, .collider, .barrier');
    if (colliders.length === 0) {
      this.warnings.push('No collision objects found (walls may not block movement)');
    } else {
      this.info.push(`✅ ${colliders.length} collision objects detected`);
    }
    
    // Check if collision objects have proper geometry
    let missingGeometry = 0;
    colliders.forEach(collider => {
      if (!collider.getAttribute('geometry')) {
        missingGeometry++;
      }
    });
    
    if (missingGeometry > 0) {
      this.warnings.push(`${missingGeometry} collision objects missing geometry`);
    }
  },

  // Check Supabase connection
  checkSupabaseConnection() {
    console.log('🗄️ Checking Supabase Connection...');
    
    if (typeof supabaseAPI === 'undefined') {
      this.warnings.push('Supabase client not found (using static data?)');
      return;
    }
    
    // Try to access Supabase functions
    if (typeof supabaseAPI.getArtworks === 'function') {
      this.info.push('✅ Supabase API functions available');
    } else {
      this.warnings.push('Supabase API functions not properly configured');
    }
    
    // Check for common configuration issues
    const artworks = document.querySelectorAll('[artwork]');
    if (artworks.length === 0) {
      this.warnings.push('No artworks loaded (check Supabase data or connection)');
    }
  },

  // Quick performance test
  async runQuickPerformanceTest() {
    console.log('⚡ Running Quick Performance Test...');
    
    return new Promise(resolve => {
      let frameCount = 0;
      const startTime = performance.now();
      const testDuration = 3000; // 3 seconds
      
      const countFrames = () => {
        frameCount++;
        if (performance.now() - startTime < testDuration) {
          requestAnimationFrame(countFrames);
        } else {
          const avgFPS = Math.round(frameCount / (testDuration / 1000));
          
          if (avgFPS < 20) {
            this.issues.push(`Low FPS: ${avgFPS} (target: 30+)`);
          } else if (avgFPS < 30) {
            this.warnings.push(`Moderate FPS: ${avgFPS} (target: 30+)`);
          } else {
            this.info.push(`✅ Good FPS: ${avgFPS}`);
          }
          
          resolve();
        }
      };
      
      requestAnimationFrame(countFrames);
    });
  },

  // Generate diagnostic report
  generateReport() {
    console.log('\n🎯 VR Museum Diagnostic Report\n' + '='.repeat(40));
    
    // System info
    console.log('📱 System Information:');
    console.log('   Browser:', navigator.userAgent.split(' ').slice(-2).join(' '));
    console.log('   Platform:', navigator.platform);
    console.log('   WebGL:', this.getWebGLInfo());
    console.log('   Screen:', `${screen.width}x${screen.height}`);
    
    // Issues
    if (this.issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      this.issues.forEach(issue => console.log('   ❌', issue));
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log('   ⚠️', warning));
    }
    
    // Successes
    if (this.info.length > 0) {
      console.log('\n✅ WORKING CORRECTLY:');
      this.info.forEach(info => console.log('   ', info));
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    this.generateRecommendations().forEach(rec => console.log('   💡', rec));
    
    // Overall status
    const status = this.issues.length === 0 ? 
      (this.warnings.length === 0 ? '🟢 EXCELLENT' : '🟡 GOOD') : 
      '🔴 NEEDS ATTENTION';
    
    console.log(`\n🎯 OVERALL STATUS: ${status}`);
    
    if (this.issues.length > 0) {
      console.log('\n🔧 Fix critical issues before testing further.');
    } else if (this.warnings.length > 0) {
      console.log('\n🔧 Consider addressing warnings for optimal performance.');
    } else {
      console.log('\n🚀 Ready for comprehensive testing!');
    }
  },

  // Get WebGL information
  getWebGLInfo() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'Not supported';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor} ${renderer}`.substring(0, 50);
    }
    
    return 'WebGL supported';
  },

  // Generate specific recommendations
  generateRecommendations() {
    const recommendations = [];
    
    if (this.issues.length > 0) {
      recommendations.push('Fix all critical issues before proceeding with testing');
    }
    
    if (this.warnings.some(w => w.includes('memory'))) {
      recommendations.push('Consider implementing texture compression and LOD system');
    }
    
    if (this.warnings.some(w => w.includes('FPS'))) {
      recommendations.push('Optimize rendering: reduce polygon count, use simpler materials');
    }
    
    if (this.warnings.some(w => w.includes('external images'))) {
      recommendations.push('Host images locally or ensure CORS headers are properly configured');
    }
    
    if (this.warnings.some(w => w.includes('collision'))) {
      recommendations.push('Add collision geometry to walls and obstacles');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System appears healthy - proceed with comprehensive testing');
    }
    
    return recommendations;
  }
};

// Auto-run diagnostic
VRDiagnostics.runDiagnostic();

// Make available globally
window.VRDiagnostics = VRDiagnostics;

console.log('\n🔍 Diagnostic complete! Run VRDiagnostics.runDiagnostic() again anytime.');
