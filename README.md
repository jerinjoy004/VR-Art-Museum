# A-Frame VR Art Gallery - Enhanced with React & Supabase

A modern VR art gallery application that combines A-Frame WebVR with React and Supabase for dynamic content management. Create, browse, and experience art galleries in virtual reality with real-time data management.

## 🚀 Features

- **MASSIVE Classical Museum** - Grand corridor gallery (120+ units long, 40 units wide, 15 units tall)
- **Enhanced Physics Movement** - Smooth WASD movement with collision detection and no wall-clipping
- **Advanced Lighting System** - Dynamic spotlights that follow your view, professional museum illumination
- **Professional Artwork Display** - Large classical frames (7×5.5), museum benches, protective barriers
- **Interactive Experience** - Click artworks to zoom, realistic movement constraints, pillar collision
- **Authentic Museum Atmosphere** - Grand entrance archway, ornate details, luxury carpet flooring
- **Optimized for Desktop** - Smooth performance with massive scale and enhanced visual effects
- **Scalable Architecture** - Room size dynamically adjusts to artwork count (10-unit spacing)

## 🎮 Gallery Controls & Experience

- **WASD Keys** - Smooth movement through the massive museum corridor (40 units wide!)
- **Mouse Movement** - Look around with dynamic lighting that follows your gaze
- **Click Artworks** - Interactive zoom effects on large classical paintings (7×5.5 units)
- **Enhanced Physics** - Cannot pass through walls, pillars, or artwork protection barriers
- **Professional Scale** - 10-unit spacing between artworks, 15-unit tall ceilings
- **Museum Features** - Visitor benches, grand entrance archway, ornate architectural details

## 🏗️ Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx              # Navigation component
│   │   ├── ModernGalleryRoom.jsx   # Classical VR museum gallery
│   │   └── RoomCreationForm.jsx    # Create new galleries
│   ├── pages/
│   │   ├── GalleryBrowser.jsx      # Browse all galleries
│   │   ├── RoomView.jsx            # View individual gallery
│   │   └── UploadPage.jsx          # Upload artwork
│   ├── services/
│   │   └── supabaseClient.js       # Database connection
│   ├── App.jsx                     # Main app component
│   ├── main.jsx                    # App entry point
│   └── main.css                    # Global styles
├── public/                         # Static assets
├── index.html                      # HTML template
├── package.json                    # Dependencies & scripts
├── vite.config.js                  # Vite configuration
├── database_schema.sql             # Supabase database schema
└── ENHANCED_SETUP_GUIDE.md         # Detailed setup instructions
```

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL in `database_schema.sql` to create tables
   - Update `src/services/supabaseClient.js` with your credentials

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   - Visit `http://localhost:3004`
   - Create a gallery room
   - Upload some artwork
   - Experience your VR gallery!

## 🗄️ Database Schema

The application uses two main tables:
- **rooms** - Gallery rooms with metadata
- **artworks** - Individual art pieces linked to rooms

See `database_schema.sql` for the complete schema and `ENHANCED_SETUP_GUIDE.md` for detailed setup instructions.

## 🛠️ Development

- **Frontend**: React 18 + Vite
- **VR**: A-Frame 1.4.0
- **Backend**: Supabase (PostgreSQL + Storage)
- **Routing**: React Router
- **Styling**: CSS3 with modern techniques

## 📱 Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` folder ready for deployment to any static hosting service.

## 🎨 Adding Artwork

1. Navigate to the "Upload Artwork" page
2. Select or create a gallery room
3. Upload your image files
4. Add titles and descriptions
5. View your VR gallery instantly!

## 🔧 Configuration

Update `src/services/supabaseClient.js` with your Supabase credentials:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
```

## 📄 License

MIT License - feel free to use this for your own VR art galleries!

## 🤝 Contributing

Pull requests welcome! This project combines modern web technologies with immersive VR experiences.

---

**Experience art in a whole new dimension! 🎨🥽**
# VR-Art-Museum
