-- ========================================
-- Enhanced VR Art Gallery - Complete Database Setup
-- ========================================
-- Execute this SQL in your Supabase SQL Editor

-- 1. Drop existing tables to recreate with new structure
DROP TABLE IF EXISTS artworks;
DROP TABLE IF EXISTS rooms;

-- 2. Create rooms table (simplified for user galleries)
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create artworks table (simplified - linked to rooms, max 8 per room)
CREATE TABLE artworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 1 CHECK (image_order >= 1 AND image_order <= 8),
  title TEXT,
  artist_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

-- 5. Create policies (allow public read and write for demo purposes)
CREATE POLICY "Anyone can view rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view artworks" ON artworks FOR SELECT USING (true);
CREATE POLICY "Anyone can create artworks" ON artworks FOR INSERT WITH CHECK (true);

-- 6. Create storage bucket for images and set up policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket
CREATE POLICY "Anyone can view images" ON storage.objects 
FOR SELECT USING (bucket_id = 'room-images');

CREATE POLICY "Anyone can upload images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'room-images');

CREATE POLICY "Anyone can update images" ON storage.objects 
FOR UPDATE USING (bucket_id = 'room-images');

CREATE POLICY "Anyone can delete images" ON storage.objects 
FOR DELETE USING (bucket_id = 'room-images');

-- 7. Grant permissions
GRANT ALL ON rooms TO anon;
GRANT ALL ON artworks TO anon;
GRANT ALL ON rooms TO authenticated;
GRANT ALL ON artworks TO authenticated;

-- 8. Sample data for testing (optional)
INSERT INTO rooms (room_name, artist_name) VALUES 
('Enhanced Gallery Demo', 'Original A-Frame Artist'),
('Classic VR Experience', 'Gallery Creator');

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Enhanced VR Art Gallery database setup complete! ✅';
    RAISE NOTICE 'This project uses the original A-Frame gallery logic with Supabase backend.';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update your .env file with Supabase credentials';
    RAISE NOTICE '2. Run npm install in the project directory';
    RAISE NOTICE '3. Run npm run dev to start the enhanced gallery!';
END $$;
