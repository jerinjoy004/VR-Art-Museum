# 🖼️ Image Loading Troubleshooting Guide

## Cookie "__cf_bm" Rejection Error

If you're seeing errors like:
```
Cookie "__cf_bm" has been rejected for invalid domain. 2 image_3.jpg
```

This is a **Cloudflare Bot Management** cookie issue that affects external image loading in A-Frame VR environments.

## 🔧 Solutions

### 1. **Use Local Images** (Recommended)
Place your images in the `/public` folder and reference them locally:
```javascript
// Instead of external URLs
src="https://external-site.com/image.jpg"

// Use local paths
src="/images/artwork1.jpg"
```

### 2. **CORS-Enabled Hosting**
Use image hosting services that support CORS for VR/WebGL:
- **Supabase Storage** (recommended)
- **Imgur** (for testing)
- **GitHub Pages**
- **Vercel/Netlify** static assets

### 3. **Supabase Storage Setup** (Best Solution)
```javascript
// Upload to Supabase Storage bucket
const { data, error } = await supabase.storage
  .from('artwork-images')
  .upload('image.jpg', file)

// Get public URL
const { publicURL } = supabase.storage
  .from('artwork-images')
  .getPublicUrl('image.jpg')
```

### 4. **Base64 Encoding** (Small Images)
```javascript
// Convert small images to base64 data URLs
const base64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
```

## 🛠️ Current Implementation

The VR gallery now includes:
- ✅ **Automatic fallback images** when loading fails
- ✅ **Error detection and logging** with helpful solutions
- ✅ **CORS headers** for cross-origin requests
- ✅ **Loading indicators** for better UX
- ✅ **Placeholder generation** for failed images

## 🎯 Best Practices

1. **Test locally first** - Use `/public/images/` for development
2. **Configure CORS** properly on your image hosting
3. **Use consistent image formats** (JPG, PNG, WebP)
4. **Optimize image sizes** for VR performance (max 2048x2048)
5. **Implement progressive loading** for large galleries

## 🔍 Debugging

Check the browser console for:
- Image loading status messages
- CORS error details
- Cloudflare-specific warnings
- Fallback activation logs

The gallery will automatically handle failed images and provide helpful error messages in the console.
