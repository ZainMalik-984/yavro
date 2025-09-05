const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Set proper MIME types for various file types
express.static.mime.define({
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'video/ogg': ['ogv'],
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/gif': ['gif'],
  'image/svg+xml': ['svg']
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build'), {
  setHeaders: (res, path) => {
    // Set proper headers for video files
    if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    // Set proper headers for other media files
    else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Handle React Router (return index.html for all non-API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
