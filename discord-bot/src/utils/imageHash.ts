import { Jimp } from 'jimp';

export async function computeHash(buffer: Buffer): Promise<string> {
  try {
    const image = await Jimp.read(buffer);
    return image.hash();
  } catch (error) {
    if (error instanceof Error && error.message.includes('maxMemoryUsageInMB')) {
      console.warn('Image too large for hashing, using simplified hash instead');
      // Fallback: create a simple hash from the first few bytes
      const hashBytes = buffer.slice(0, 1024); // Use first 1KB
      let hash = '';
      for (let i = 0; i < hashBytes.length; i += 4) {
        hash += hashBytes[i].toString(16).padStart(2, '0');
      }
      return hash.substring(0, 16); // Return 16-character hash
    }
    
    console.warn('Failed to process image for hashing (unsupported format or other error), will use server-side file hash:', error instanceof Error ? error.message : 'Unknown error');
    return ''; // Return empty hash to let image-service handle file hashing
  }
}

export function hammingDistance(a: string, b: string): number {
  let dist = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) dist++;
  return dist + Math.abs(a.length - b.length);
}