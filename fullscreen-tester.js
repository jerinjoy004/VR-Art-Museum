// VR Museum Fullscreen Compatibility Test
// Run this in the browser console to test fullscreen functionality

const FullscreenTester = {
  isTestingFullscreen: false,
  
  init() {
    console.log('🌟 VR Museum Fullscreen Compatibility Tester');
    this.createTestUI();
    this.logCurrentState();
  },
  
  createTestUI() {
    // Create fullscreen test button if it doesn't exist
    if (document.getElementById('fullscreen-test-btn')) return;
    
    const testButton = document.createElement('button');
    testButton.id = 'fullscreen-test-btn';
    testButton.innerHTML = '🌟 Test Fullscreen';
    testButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 410px;
      z-index: 10001;
      background: #007acc;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    
    testButton.onclick = () => this.toggleFullscreen();
    document.body.appendChild(testButton);
    
    // Update button text based on fullscreen state
    this.updateButtonText();
  },
  
  updateButtonText() {
    const btn = document.getElementById('fullscreen-test-btn');
    if (btn) {
      btn.innerHTML = document.fullscreenElement ? '🚪 Exit Fullscreen' : '🌟 Enter Fullscreen';
    }
  },
  
  async toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await this.exitFullscreen();
      } else {
        await this.enterFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen operation failed:', error);
    }
  },
  
  async enterFullscreen() {
    console.log('🌟 Entering fullscreen mode...');
    
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('No A-Frame scene found');
      return;
    }
    
    // Test different fullscreen methods for compatibility
    const methods = [
      'requestFullscreen',
      'mozRequestFullScreen',
      'webkitRequestFullscreen',
      'msRequestFullscreen'
    ];
    
    for (const method of methods) {
      if (scene[method]) {
        try {
          await scene[method]();
          console.log(`✅ Fullscreen entered using ${method}`);
          this.logFullscreenState();
          return;
        } catch (error) {
          console.warn(`❌ ${method} failed:`, error);
        }
      }
    }
    
    console.error('❌ No fullscreen method available');
  },
  
  async exitFullscreen() {
    console.log('🚪 Exiting fullscreen mode...');
    
    const methods = [
      'exitFullscreen',
      'mozCancelFullScreen',
      'webkitExitFullscreen',
      'msExitFullscreen'
    ];
    
    for (const method of methods) {
      if (document[method]) {
        try {
          await document[method]();
          console.log(`✅ Fullscreen exited using ${method}`);
          this.logFullscreenState();
          return;
        } catch (error) {
          console.warn(`❌ ${method} failed:`, error);
        }
      }
    }
  },
  
  logCurrentState() {
    console.log('\n📊 Current VR Museum State:');
    console.log('   Fullscreen element:', document.fullscreenElement);
    console.log('   Pointer lock element:', document.pointerLockElement);
    console.log('   A-Frame scene:', document.querySelector('a-scene'));
    console.log('   Canvas element:', document.querySelector('a-scene')?.canvas);
    
    // Check if player controller is loaded
    const playerController = AFRAME?.components?.['player-controller'];
    console.log('   Player controller:', playerController ? '✅ Loaded' : '❌ Not found');
    
    // Check for VR capabilities
    if (navigator.xr) {
      console.log('   WebXR support:', '✅ Available');
    } else {
      console.log('   WebXR support:', '❌ Not available');
    }
  },
  
  logFullscreenState() {
    setTimeout(() => {
      console.log('\n🌟 Fullscreen State Changed:');
      console.log('   Is fullscreen:', !!document.fullscreenElement);
      console.log('   Fullscreen element:', document.fullscreenElement);
      console.log('   Canvas in fullscreen:', document.fullscreenElement === document.querySelector('a-scene')?.canvas);
      console.log('   Scene in fullscreen:', document.fullscreenElement === document.querySelector('a-scene'));
      
      this.updateButtonText();
      
      // Test pointer lock after fullscreen change
      setTimeout(() => this.testPointerLock(), 500);
    }, 100);
  },
  
  testPointerLock() {
    console.log('\n🔒 Testing Pointer Lock in Current Mode...');
    
    const scene = document.querySelector('a-scene');
    const canvas = scene?.canvas;
    
    if (!canvas) {
      console.error('❌ Canvas not found');
      return;
    }
    
    // Test pointer lock request
    const testPointerLock = () => {
      const lockTarget = document.fullscreenElement || canvas;
      
      if (lockTarget.requestPointerLock) {
        lockTarget.requestPointerLock().then(() => {
          console.log('✅ Pointer lock requested successfully');
          
          setTimeout(() => {
            console.log('   Pointer lock active:', !!document.pointerLockElement);
            console.log('   Lock element:', document.pointerLockElement);
            
            // Release pointer lock
            if (document.exitPointerLock) {
              document.exitPointerLock();
            }
          }, 1000);
        }).catch(error => {
          console.warn('❌ Pointer lock request failed:', error);
        });
      } else {
        console.error('❌ Pointer lock not supported on target element');
      }
    };
    
    // Click canvas to test pointer lock
    console.log('👆 Click the canvas to test pointer lock...');
    canvas.addEventListener('click', testPointerLock, { once: true });
  },
  
  runCompatibilityTest() {
    console.log('\n🧪 Running Full Compatibility Test...');
    
    const tests = [
      this.testFullscreenAPI,
      this.testPointerLockAPI,
      this.testPlayerController,
      this.testEventListeners
    ];
    
    tests.forEach((test, index) => {
      setTimeout(() => {
        try {
          test.call(this);
        } catch (error) {
          console.error(`Test ${index + 1} failed:`, error);
        }
      }, index * 1000);
    });
  },
  
  testFullscreenAPI() {
    console.log('\n1️⃣ Testing Fullscreen API...');
    
    const scene = document.querySelector('a-scene');
    const methods = ['requestFullscreen', 'mozRequestFullScreen', 'webkitRequestFullscreen', 'msRequestFullscreen'];
    
    methods.forEach(method => {
      if (scene && scene[method]) {
        console.log(`   ✅ ${method} available`);
      } else {
        console.log(`   ❌ ${method} not available`);
      }
    });
    
    const exitMethods = ['exitFullscreen', 'mozCancelFullScreen', 'webkitExitFullscreen', 'msExitFullscreen'];
    
    exitMethods.forEach(method => {
      if (document[method]) {
        console.log(`   ✅ ${method} available`);
      } else {
        console.log(`   ❌ ${method} not available`);
      }
    });
  },
  
  testPointerLockAPI() {
    console.log('\n2️⃣ Testing Pointer Lock API...');
    
    const scene = document.querySelector('a-scene');
    const canvas = scene?.canvas;
    
    if (canvas) {
      console.log('   ✅ Canvas element found');
      
      if (canvas.requestPointerLock) {
        console.log('   ✅ requestPointerLock available');
      } else {
        console.log('   ❌ requestPointerLock not available');
      }
    } else {
      console.log('   ❌ Canvas element not found');
    }
    
    if (document.exitPointerLock) {
      console.log('   ✅ exitPointerLock available');
    } else {
      console.log('   ❌ exitPointerLock not available');
    }
  },
  
  testPlayerController() {
    console.log('\n3️⃣ Testing Player Controller...');
    
    const playerController = AFRAME?.components?.['player-controller'];
    
    if (playerController) {
      console.log('   ✅ Player controller component registered');
      
      const camera = document.querySelector('[player-controller]');
      if (camera) {
        console.log('   ✅ Player controller attached to element');
      } else {
        console.log('   ❌ Player controller not attached to any element');
      }
    } else {
      console.log('   ❌ Player controller component not found');
    }
  },
  
  testEventListeners() {
    console.log('\n4️⃣ Testing Event Listeners...');
    
    const events = [
      'fullscreenchange',
      'pointerlockchange',
      'keydown',
      'keyup',
      'mousemove'
    ];
    
    events.forEach(event => {
      console.log(`   📡 ${event} listeners should be active`);
    });
    
    console.log('   💡 Check browser developer tools for actual listener counts');
  }
};

// Auto-initialize
FullscreenTester.init();

// Add fullscreen change listener for testing
document.addEventListener('fullscreenchange', () => {
  FullscreenTester.logFullscreenState();
});

// Make available globally
window.FullscreenTester = FullscreenTester;

console.log(`
🌟 VR Museum Fullscreen Tester Loaded!

Usage:
- FullscreenTester.toggleFullscreen() - Enter/exit fullscreen
- FullscreenTester.testPointerLock() - Test pointer lock functionality
- FullscreenTester.runCompatibilityTest() - Run full compatibility test
- FullscreenTester.logCurrentState() - Show current state

Click the "🌟 Test Fullscreen" button in the top-right corner to test!
`);

export { FullscreenTester };
