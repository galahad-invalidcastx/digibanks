// You can integrate with services like:
// - nostr.build
// - void.cat
// - imgur (with API key)

export async function uploadImage(file) {
  // Example using nostr.build (free, no API key required)
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('https://nostr.build/api/v2/upload/files', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      return data.data[0].url;
    }
    throw new Error('Upload failed');
  } catch (error) {
    console.error('Image upload error:', error);
    return null;
  }
}