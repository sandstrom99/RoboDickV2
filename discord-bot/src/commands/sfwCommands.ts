import { Message, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import FormData from 'form-data';
import { apiClient } from '../utils/api';
import { computeHash, hammingDistance } from '../utils/imageHash';

const MAX_IMAGES = parseInt(process.env.MAX_IMAGES || '9', 10);
const HASH_THRESHOLD = parseInt(process.env.HASH_THRESHOLD || '5', 10);
const SFW_CHANNEL_ID = process.env.SFW_CHANNEL_ID!;
const OWNER_ID = process.env.OWNER_ID!;
const BASE_URL = process.env.BASE_URL!;
const IMAGE_URL = process.env.IMAGE_URL!;

interface ImageMeta {
  uuid: string;
  filename: string;
  createdAt: string;
  hash: string;
  uploaderId: string;
  uploaderName: string;
}

export async function handleCount(msg: Message) {
  const { data } = await apiClient.get<{ count: number }>('/images/count');
  await msg.reply(`Total images: ${data.count}`);
}

export async function handleDelete(msg: Message, uuid: string) {
  if (msg.channel.id !== SFW_CHANNEL_ID) return;
  if (msg.author.id !== OWNER_ID) {
    await msg.reply('Access denied');
    return;
  }
  try {
    await apiClient.delete(`/images/${uuid}`);
    await msg.reply(`Deleted image ${uuid}`);
  } catch (err: any) {
    if (err.response?.status === 404) await msg.reply('Image not found');
    else await msg.reply('Failed to delete image');
  }
}

export async function handleInfo(msg: Message, uuid: string) {
  try {
    const { data } = await apiClient.get<ImageMeta>(`/images/${uuid}`);
    const imageUrl = `${IMAGE_URL}/images/${data.filename}`;
    const resp = await apiClient.get<ArrayBuffer>(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(resp.data);
    const attachment = new AttachmentBuilder(buffer, { name: data.filename });

    const embed = new EmbedBuilder()
      .setTitle('Image Details')
      .setColor(0x00AE86)
      .setImage(`attachment://${data.filename}`)
      .addFields(
        { name: 'UUID', value: data.uuid, inline: true },
        { name: 'Filename', value: data.filename, inline: true },
        { name: 'Created At', value: data.createdAt, inline: false },
        { name: 'Hash', value: data.hash, inline: false },
        { name: 'Uploader', value: `${data.uploaderName} (${data.uploaderId})`, inline: false }
      );

    await msg.reply({ embeds: [embed], files: [attachment] });
  } catch (err: any) {
    if (err.response?.status === 404) await msg.reply('Image not found');
    else await msg.reply('Failed to fetch metadata');
  }
}

export async function handleFetch(msg: Message, countArg?: string) {
  let count = parseInt(countArg || '1', 10);
  if (isNaN(count) || count < 1) count = 1;
  const num = Math.min(count, MAX_IMAGES);
  const { data } = await apiClient.get<{ images: ImageMeta[] }>(`/images?page=1&limit=${num}`);
  const attachments = await Promise.all(
    data.images.map(async img => {
      const url = `${IMAGE_URL}/images/${img.filename}`;
      const resp = await apiClient.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
      return new AttachmentBuilder(Buffer.from(resp.data), { name: img.filename });
    })
  );
  await msg.reply({ content: `Here's ${attachments.length} image(s).`, files: attachments });
}

export async function handleRandom(msg: Message, countArg?: string) {
  let count = parseInt(countArg || '1', 10);
  if (isNaN(count) || count < 1) count = 1;
  const num = Math.min(count, MAX_IMAGES);
  // Fetch random image URLs from the backend
  const { data } = await apiClient.get<{ urls: string[] }>(`/images/random?count=${num}`);
  if (!data.urls || data.urls.length === 0) {
    await msg.reply('No images available.');
    return;
  }
  const attachments = await Promise.all(
    data.urls.map(async urlPath => {
      const url = `${IMAGE_URL}${urlPath}`;
      const resp = await apiClient.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
      const filename = urlPath.split('/').pop() || 'image.jpg';
      return new AttachmentBuilder(Buffer.from(resp.data), { name: filename });
    })
  );
  await msg.reply({ content: `Here's ${attachments.length} random image(s).`, files: attachments });
}

export async function handleUpload(msg: Message) {
  if (msg.channel.id !== SFW_CHANNEL_ID || msg.attachments.size === 0) return;
  const valid = msg.attachments.filter(att => /\.(png|jpe?g|gif|webp)$/i.test(att.name || ''));
  if (valid.size === 0) {
    await msg.reply('Go away');
    return;
  }
  const { data: existing } = await apiClient.get<{ hash: string }[]>('/images/hashes');
  const seen = new Set<string>();
  const newFiles: AttachmentBuilder[] = [];
  const dupFiles: AttachmentBuilder[] = [];
  for (const att of valid.values()) {
    const resp = await apiClient.get<ArrayBuffer>(att.url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(resp.data);
    const hash = await computeHash(buffer);
    if (seen.has(hash)) { dupFiles.push(new AttachmentBuilder(buffer, { name: att.name! })); continue; }
    seen.add(hash);
    if (existing.some(e => hammingDistance(e.hash, hash) <= HASH_THRESHOLD)) {
      dupFiles.push(new AttachmentBuilder(buffer, { name: att.name! }));
    } else {
      const form = new FormData();
      form.append('image', buffer, { filename: att.name! });
      form.append('hash', hash);
      form.append('uploaderId', msg.author.id);
      form.append('uploaderName', msg.author.username);
      await apiClient.post('/images', form, { headers: form.getHeaders() });
      newFiles.push(new AttachmentBuilder(buffer, { name: att.name! }));
    }
  }
  let reply = '';
  if (newFiles.length) reply += `Uploaded ${newFiles.length} new image(s).\n`;
  if (dupFiles.length) reply += `Skipped ${dupFiles.length} duplicate(s).`;
  await msg.reply({ content: reply, files: [...newFiles, ...dupFiles] });
  await msg.react('👍');
}