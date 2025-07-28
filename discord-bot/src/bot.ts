import 'dotenv/config';
import { Client, IntentsBitField, Partials, Message } from 'discord.js';
import { handleCount, handleDelete, handleInfo, handleUpload, handleRandom } from './commands/sfwCommands';
import { 
  initializePlayer, 
  handlePlay, 
  handleSkip, 
  handleQueue, 
  handlePause, 
  handleResume, 
  handleExit,
  handleVolume,
  handleDebug,
  handleStatus,
  handleTestAudio,
  handleVoiceTest
} from './commands/musicCommands';
import { handleClean } from './commands/cleanCommands';
import { handleHelp } from './commands/helpCommands';

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

client.once('ready', async () => {
  console.log(`Bot ready as ${client.user?.tag}`);
  // Initialize the music player
  await initializePlayer(client);
});

client.on('messageCreate', async (msg: Message) => {
  if (msg.author.bot) return;
  console.log(`[bot] Received message from ${msg.author.tag}: "${msg.content}" in channel ${msg.channel.id}`);
  const [cmd, ...args] = msg.content.trim().split(/\s+/);
  const arg = args.join(' ');
  console.log(`[bot] Parsed cmd=${cmd}, arg=${arg}`);

  switch (cmd) {
    // Utility commands
    case '.help':
      await handleHelp(msg);
      break;
    case '.clean':
      await handleClean(msg, args[0]);
      break;
    
    // Image commands
    case '.sfwcount':
      await handleCount(msg);
      break;
    case '.sfwdelete':
      await handleDelete(msg, args[0]);
      break;
    case '.sfwid':
      await handleInfo(msg, args[0]);
      break;
    case '.sfw':
      await handleRandom(msg, args[0]);
      break;
    
    // Music commands
    case '.play':
      await handlePlay(msg, arg);
      break;
    case '.skip':
      await handleSkip(msg);
      break;
    case '.queue':
      await handleQueue(msg);
      break;
    case '.pause':
      await handlePause(msg);
      break;
    case '.resume':
      await handleResume(msg);
      break;
    case '.volume':
      await handleVolume(msg, args[0]);
      break;
    case '.debug':
      await handleDebug(msg);
      break;
    case '.status':
      await handleStatus(msg);
      break;
    case '.test':
      await handleTestAudio(msg);
      break;
    case '.voicetest':
      await handleVoiceTest(msg);
      break;
    case '.exit':
      await handleExit(msg);
      break;
    
    default:
      if (msg.attachments.size > 0) {
        await handleUpload(msg);
      }
  }
});

// Add error handling for connection issues
client.on('error', (error: any) => {
  if (error.code === 'EPIPE' || error.errno === -32) {
    console.warn('🔗 Discord connection broken (EPIPE), will attempt to reconnect...');
    // Don't crash, let Discord.js handle reconnection
    return;
  }
  console.error('🚫 Discord client error:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚫 Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Don't crash the process for upload-related errors
  if (reason && typeof reason === 'object' && 'code' in reason && reason.code === 'EPIPE') {
    console.warn('🔗 Upload interrupted due to connection issue, continuing...');
    return;
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: any) => {
  if (error.code === 'EPIPE' || error.errno === -32) {
    console.warn('🔗 Uncaught EPIPE error during upload, continuing...');
    return;
  }
  console.error('🚫 Uncaught Exception:', error);
  // Graceful shutdown for other critical errors
  console.log('🔄 Attempting graceful shutdown...');
  client.destroy();
  process.exit(1);
});

console.log('Starting Discord bot...');
client.login(process.env.DISCORD_TOKEN!);