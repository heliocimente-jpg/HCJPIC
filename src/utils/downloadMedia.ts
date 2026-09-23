/**
 * Universal media downloader for MePic AI
 * Downloads images (PNG/JPG/WEBP), videos (MP4/WEBM), and audios (MP3/WAV)
 * Handles data: URLs, blob: URLs, and remote/relative URLs without cross-origin blocks.
 */
export async function downloadMediaFile(url: string, suggestedFilename: string): Promise<boolean> {
  try {
    if (!url) return false;

    // If it's already a data: URL
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    // For relative or remote URLs, fetch as blob to bypass cross-origin download restrictions
    const response = await fetch(url);
    if (!response.ok) {
      // Fallback: direct anchor click
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = suggestedFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = suggestedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 5000);

    return true;
  } catch (err) {
    console.error('Download error:', err);
    // Last-ditch fallback
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = suggestedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return false;
  }
}
