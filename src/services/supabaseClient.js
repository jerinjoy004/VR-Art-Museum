import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://voavvjbapopcapgxpygt.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvYXZ2amJhcG9wY2FwZ3hweWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwOTA2NzQsImV4cCI6MjA2OTY2NjY3NH0.cXTlvD2Ssb9SForu3D_VXkLzMvdb-j6TiYrF_4r48uA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database helper functions
export const supabaseAPI = {
  // Room operations
  async getAllRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getRoom(roomId) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error) throw error
    return data
  },

  async createRoom(roomData) {
    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Artwork operations
  async getArtworksByRoom(roomId) {
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('room_id', roomId)
      .order('image_order', { ascending: true })

    if (error) throw error
    return data
  },

  async createArtwork(artworkData) {
    const { data, error } = await supabase
      .from('artworks')
      .insert(artworkData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Storage operations
  async uploadImage(file, fileName) {
    const { data, error } = await supabase.storage
      .from('room-images')
      .upload(fileName, file)

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('room-images')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  },

  // Simplified room creation with images
  async createRoomWithImages(roomName, artistName, imageFiles) {
    try {
      // 1. Create room
      const room = await this.createRoom({
        room_name: roomName,
        artist_name: artistName
      })

      // 2. Upload images and create artwork records
      const artworks = []
      for (let i = 0; i < imageFiles.length && i < 8; i++) {
        const file = imageFiles[i]
        const fileExtension = file.name.split('.').pop()
        const fileName = `${room.id}/image_${i + 1}.${fileExtension}`
        
        // Upload image
        const imageUrl = await this.uploadImage(file, fileName)
        
        // Create artwork record
        const artwork = await this.createArtwork({
          room_id: room.id,
          image_url: imageUrl,
          image_order: i + 1
        })
        
        artworks.push(artwork)
      }

      return { room, artworks }
    } catch (error) {
      console.error('Error creating room with images:', error)
      throw error
    }
  },
}
