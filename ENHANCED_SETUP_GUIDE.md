# Enhanced A-Frame Gallery Setup Guide

This guide will help you set up the Enhanced A-Frame VR Gallery that combines the original Jekyll A-Frame VR experience with modern React + Supabase backend.

## 🎯 What We've Built

**Original Project Features (Preserved)**:
- ✅ A-Frame VR gallery room layout
- ✅ Museum-like wall positioning with images
- ✅ Original camera controls and movement
- ✅ Spotlights and frames for artworks
- ✅ Exit doors and navigation

**New Enhanced Features (Added)**:
- ✅ React frontend for modern web interface
- ✅ Supabase database for storing gallery information
- ✅ Supabase storage for uploaded images
- ✅ Web interface to create galleries
- ✅ Browse galleries created by other users
- ✅ Dynamic image loading from cloud storage

## 🛠 Quick Setup

### 1. Prerequisites
- Node.js 16+ installed
- A Supabase account (free tier works)

### 2. Database Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**:
   - Open your Supabase dashboard
   - Go to SQL Editor
   - Copy and paste the content from `database_schema.sql`
   - Click "Run" to create tables and storage bucket

3. **Environment Variables**:
   - Create a `.env.local` file in the project root:
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 3. Install and Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3003`

## 🎮 How to Use

### Creating a VR Gallery

1. **Navigate to "Create Room"**
2. **Enter Gallery Details**:
   - Gallery name (e.g., "My Digital Art Collection")
   - Your name (e.g., "John Artist")

3. **Upload Images**:
   - Click to select up to 8 images
   - Supported formats: JPG, PNG, GIF, WebP
   - Max 10MB per image

4. **Create Gallery**:
   - Click "Create VR Room"
   - Wait for upload and processing
   - You'll be redirected to your new VR gallery!

### Exploring VR Galleries

1. **Desktop Controls**:
   - **WASD** - Move around
   - **Mouse** - Look around
   - **Click & Drag** - Rotate view

2. **Mobile Controls**:
   - **Touch** - Look around
   - **Tilt Device** - Move view

3. **VR Headset Controls**:
   - **Controllers** - Move and interact
   - **Head Movement** - Look around
   - **Trigger** - Select items

### Browsing All Galleries

1. Go to "Browse Rooms"
2. Search by gallery name or artist name
3. Click on any gallery to enter VR mode

## 🏗 Technical Architecture

### React Frontend Components

- **`OriginalGalleryRoom.jsx`** - The core VR component that implements the exact original A-Frame gallery logic
- **`RoomCreationForm.jsx`** - Upload interface for creating new galleries
- **`GalleryBrowser.jsx`** - Browse and search existing galleries
- **`RoomView.jsx`** - Individual gallery view with VR and metadata

### Supabase Backend

- **`rooms` table** - Stores gallery information (name, artist, created date)
- **`artworks` table** - Stores image information linked to rooms
- **`room-images` storage bucket** - Stores uploaded image files
- **RLS policies** - Currently open for demo (can be restricted later)

### A-Frame VR Integration

The project preserves the **exact original A-Frame logic**:

```javascript
// Original arrange-gallery component logic maintained
AFRAME.registerComponent('arrange-gallery', {
  init: function () {
    // Same positioning algorithm as Jekyll version
    // Same wall creation logic
    // Same camera and movement controls
    // Same lighting and frame effects
  }
})
```

## 🔧 Customization

### Adding New Gallery Features

1. **Modify VR Experience**: Edit `OriginalGalleryRoom.jsx`
2. **Change UI**: Update components in `src/components/`
3. **Database Changes**: Modify `database_schema.sql` and update Supabase client

### Styling

- **Web Interface**: Edit `src/main.css`
- **VR Environment**: Modify A-Frame components in `OriginalGalleryRoom.jsx`

### Adding Authentication

```javascript
// Example: Add user authentication
import { supabase } from './services/supabaseClient'

const signIn = async () => {
  await supabase.auth.signInWithProvider({ provider: 'google' })
}
```

## 🚀 Deployment

### Frontend (Static Hosting)

```bash
# Build for production
npm run build

# Deploy to Vercel, Netlify, or any static host
# Upload the `dist/` folder
```

### Backend

Supabase handles all backend infrastructure automatically:
- Database hosting and scaling
- File storage and CDN
- Real-time subscriptions
- Authentication (if added)

## 🔍 Troubleshooting

### "Database setup incomplete" Error

1. Make sure you've run `database_schema.sql` in Supabase
2. Check that your `.env.local` file has correct credentials
3. Verify the `room-images` storage bucket exists

### Images Not Displaying in VR

1. Check browser console for CORS errors
2. Verify images uploaded successfully to Supabase Storage
3. Make sure storage bucket is set to "public"

### VR Not Loading

1. Ensure A-Frame script is loaded (check browser console)
2. Try a different browser (Chrome, Firefox work best)
3. Check for JavaScript errors in console

## 📱 Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari, Edge ✅
- **Mobile**: iOS Safari, Android Chrome ✅
- **VR**: Oculus Browser, SteamVR, WebXR browsers ✅

## 🎨 Project Philosophy

This enhanced version maintains the **soul of the original A-Frame gallery** while adding modern web capabilities:

- **Preserve**: Original VR experience, room layout, controls
- **Enhance**: Dynamic content, user interface, cloud storage
- **Simplify**: Easy gallery creation without coding

The goal is to make it as easy as possible for artists to create immersive VR galleries while keeping the authentic museum-like experience of the original.

## 📞 Support

- Check browser console for error messages
- Verify Supabase credentials and database setup
- Test with sample images first
- Try different browsers if VR isn't working

## 🎉 Success!

Once set up, you'll have a fully functional VR art gallery system that:
- ✅ Preserves the original A-Frame VR experience
- ✅ Allows dynamic gallery creation through web interface
- ✅ Stores images and data in the cloud
- ✅ Works across desktop, mobile, and VR devices
- ✅ Provides a beautiful, modern user interface

**Enjoy creating and exploring VR art galleries!** 🎨🥽
