#!/bin/bash
# Optional physics engine setup script
# Run this only if you want to experiment with cannon.js physics

echo "🔬 Setting up optional physics engine dependencies..."

# Install physics system dependencies
npm install aframe-physics-system@4.0.1 cannon@0.20.0

echo "📦 Physics dependencies installed!"
echo ""
echo "To use physics engine:"
echo "1. Import PhysicsGalleryRoom from './components/PhysicsGalleryRoom.jsx'"
echo "2. Replace ModernGalleryRoom with PhysicsGalleryRoom in your app"
echo "3. Compare performance with your current custom system"
echo ""
echo "Note: Your current custom system is likely better for this use case!"
echo "This is just for experimentation and comparison."
