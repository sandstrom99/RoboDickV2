import { Jimp } from 'jimp';

export async function computeHash(buffer: Uint8Array): Promise<string> {
  try {
    // Create a Blob from the Uint8Array and get its ArrayBuffer
    const blob = new Blob([buffer]);
    const arrayBuffer = await blob.arrayBuffer();
    
    // Read the image from the ArrayBuffer
    const image = await Jimp.read(arrayBuffer);
    return image.hash();
  } catch (error) {
    console.error('Failed to process image for hashing:', error);
    throw new Error(`Failed to process image for hashing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function hammingDistance(a: string, b: string): number {
  let dist = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) dist++;
  return dist + Math.abs(a.length - b.length);
} 