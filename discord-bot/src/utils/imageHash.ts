import { Jimp } from 'jimp';

export async function computeHash(buffer: Buffer): Promise<string> {
  const image = await Jimp.read(buffer);
  return image.hash();
}

export function hammingDistance(a: string, b: string): number {
  let dist = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) dist++;
  return dist + Math.abs(a.length - b.length);
}