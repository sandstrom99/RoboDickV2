// src/bot.ts

import 'dotenv/config';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import { Jimp } from 'jimp';
import {
  Client,
  IntentsBitField,
  Partials,
  AttachmentBuilder,
  Message
  
} from 'discord.js';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
const API_URL = process.env.API_URL!;
const SFW_CHANNEL_ID = process.env.SFW_CHANNEL_ID!;
const PREFIX = '.sfw';
const MAX_IMAGES = 9;

// 0–5: virtually bit‑for‑bit identical (exact copies, maybe tiny compression artifacts)
// 6–15: minor changes (cropping, small rotations, color tweaks)
// 16+: increasingly different images
const HASH_THRESHOLD = 3; 

if (!DISCORD_TOKEN || !API_URL || !SFW_CHANNEL_ID || !PREFIX) {
  console.error(
    'Missing one of DISCORD_TOKEN, API_URL, SFW_CHANNEL_ID, or PREFIX in .env'
  );
  process.exit(1);
}

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

// Allowed image extensions
type AttachmentHash = string;
const VALID_EXT = ['.png', '.jpg', '.jpeg', '.gif'];
function hasImageExtension(url: string): boolean {
  const lower = url.toLowerCase();
  return VALID_EXT.some(ext => lower.endsWith(ext));
}

interface ImageData {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

async function fetchRandomImages(count: number): Promise<ImageData[]> {
  const responses: AxiosResponse<ArrayBuffer>[] = await Promise.all(
    Array.from({ length: count }, () =>
      axios.get(`${API_URL}/random`, { responseType: 'arraybuffer' })
    )
  );

  return responses.map((res, idx) => {
    const contentType = res.headers['content-type'] as string;
    const ext = contentType.split('/').pop() || 'jpg';
    const filename = `sfw-${Date.now()}-${idx}.${ext}`;

    return {
      buffer: Buffer.from(res.data),
      filename,
      contentType
    };
  });
}

// Compute perceptual hash using Jimp
async function getHash(buffer: Buffer): Promise<string> {
  const image = await Jimp.read(buffer);
  return image.hash(); // 64-bit hash string
}

// Compute Hamming distance between two hex hash strings
function hammingDistance(a: string, b: string): number {
  let dist = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist + Math.abs(a.length - b.length);
}

client.on('messageCreate', async (msg: Message) => {
  if (msg.author.bot) return;

  // Handle .sfw [1-9]
  if (msg.content.startsWith(PREFIX)) {
    const parts = msg.content.trim().split(/\s+/);
    let requested = parseInt(parts[1], 10);
    if (isNaN(requested) || requested < 1) requested = 1;
    const num = Math.min(requested, MAX_IMAGES);
    const status =
      parts[1] === undefined
        ? 'No number provided; defaulting to 1 image.'
        : requested > MAX_IMAGES
        ? `Requested ${requested}; using max ${MAX_IMAGES}.`
        : `Here's ${num} image${num > 1 ? 's' : ''}.`;

    try {
      const images = await fetchRandomImages(num);
      const attachments = images.map(img => new AttachmentBuilder(img.buffer, { name: img.filename }));
      await msg.reply({ content: status, files: attachments });
    } catch (error) {
      console.error('Error fetching images:', error);
      await msg.reply('Failed to fetch images.');
    }
    return;
  }

  // Handle uploads in SFW channel
  if (msg.channel.id === SFW_CHANNEL_ID) {
    if (msg.attachments.size === 0) {
      await msg.reply('Go away');
      return;
    }

    // Filter valid image attachments
    const valid = msg.attachments.filter(att => att.name ? hasImageExtension(att.name) : false);
    if (valid.size === 0) {
      await msg.reply('Go away');
      return;
    }

    // Retrieve existing hashes
    const { data: existing }: { data: { hash: AttachmentHash }[] } = await axios.get(`${API_URL}/hashes`);

    // Track hashes seen within this message to avoid duplicates
    const seenInMessage = new Set<AttachmentHash>();

    const newFiles: AttachmentBuilder[] = [];
    const dupFiles: AttachmentBuilder[] = [];

    for (const att of valid.values()) {
      try {
        const res = await axios.get<ArrayBuffer>(att.url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);

        // Compute hash
        const hash = await getHash(buffer);

        // Check duplicates: within message first, then against existing
        if (seenInMessage.has(hash)) {
          dupFiles.push(new AttachmentBuilder(buffer, { name: att.name! }));
          continue;
        }
        seenInMessage.add(hash);

        const isExistingDup = existing.some(e => hammingDistance(e.hash, hash) <= HASH_THRESHOLD);
        if (isExistingDup) {
          dupFiles.push(new AttachmentBuilder(buffer, { name: att.name! }));
        } else {
          // Upload to service
          const form = new FormData();
          form.append('image', buffer, { filename: att.name!, contentType: att.contentType || 'application/octet-stream' });
          form.append('hash', hash);
          await axios.post(API_URL, form, { headers: form.getHeaders() });
          newFiles.push(new AttachmentBuilder(buffer, { name: att.name! }));
        }
      } catch (err) {
        console.error(`Failed processing ${att.url}:`, err);
      }
    }

    // Consolidate reply content and attachments
    let content = '';
    if (newFiles.length > 0) content += `Uploaded ${newFiles.length} new image${newFiles.length > 1 ? 's' : ''}.\n`;
    if (dupFiles.length > 0) content += `Skipped ${dupFiles.length} duplicate image${dupFiles.length > 1 ? 's' : ''}.`;
    const files = [...newFiles, ...dupFiles];

    if (content) {
      await msg.reply({ content, files });
    }
    await msg.react('👍');
  }
});

client.login(DISCORD_TOKEN);
