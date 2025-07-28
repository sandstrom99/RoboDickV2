import { Message, GuildMember } from 'discord.js';
import { Player, Track } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';

const MUSIC_CHANNEL_ID = '702454148616028171';
let player: Player | null = null;

// Helper function to check if command is in music channel
function checkMusicChannel(msg: Message): boolean {
  if (msg.channel.id !== MUSIC_CHANNEL_ID) {
    msg.reply(`🎵 Music commands can only be used in <#${MUSIC_CHANNEL_ID}>`);
    return false;
  }
  return true;
}

export async function initializePlayer(discordClient: any) {
  // Set FFmpeg path explicitly
  process.env.FFMPEG_PATH = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
  
  player = new Player(discordClient, {
    ytdlOptions: {
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
      filter: 'audioonly'
    },
    skipFFmpeg: false,  // Enable FFmpeg processing
    useLegacyFFmpeg: false,
    lagMonitor: 2000,
    connectionTimeout: 30000
  });

  try {
    // Load the more stable YouTubei extractor first
    await player.extractors.register(YoutubeiExtractor, {});
    console.log('✅ Registered YoutubeiExtractor');
  } catch (error) {
    console.log('❌ Failed to register YoutubeiExtractor:', error);
  }

  // Load default extractors but exclude problematic ones
  await player.extractors.loadDefault((ext: string) => 
    ext !== 'SpotifyExtractor' && ext !== 'AppleMusicExtractor' && ext !== 'YoutubeExtractor'
  );
  
  // Add error event listeners
  player.events.on('error', (queue, error) => {
    console.error(`[Music Player] General Error: ${error.message}`);
    console.error(`[Music Player] Error details:`, error);
  });

  player.events.on('playerError', (queue, error, track) => {
    console.error(`[Music Player] Player Error for track "${track.title}": ${error.message}`);
    console.error(`[Music Player] Error details:`, error);
    console.error(`[Music Player] Error stack:`, error.stack);
    if (queue.metadata && queue.metadata.reply) {
      queue.metadata.reply(`❌ Error playing **${track.title}**: ${error.message}`);
    }
  });

  player.events.on('audioTrackAdd', (queue, track) => {
    console.log(`[Music Player] Track added: ${track.title}`);
  });

  player.events.on('playerStart', (queue, track) => {
    console.log(`[Music Player] Started playing: ${track.title}`);
    console.log(`[Music Player] Volume: ${queue.node.volume}%`);
    console.log(`[Music Player] Connection state: ${queue.dispatcher?.voiceConnection?.state?.status}`);
    console.log(`[Music Player] Audio player state: ${queue.dispatcher?.audioPlayer?.state?.status}`);
    console.log(`[Music Player] Track URL: ${track.url}`);
    console.log(`[Music Player] Track raw source: ${track.raw?.source || 'unknown'}`);
    console.log(`[Music Player] Track extractor: ${track.extractor?.identifier || 'unknown'}`);
    
    // Check audio resource immediately
    if (queue.dispatcher?.audioResource) {
      console.log(`[Music Player] Audio resource created successfully`);
      console.log(`[Music Player] Audio resource metadata:`, queue.dispatcher.audioResource.metadata?.title || 'unknown');
      console.log(`[Music Player] Audio resource started:`, queue.dispatcher.audioResource.started);
      console.log(`[Music Player] Audio resource readable:`, queue.dispatcher.audioResource.readable);
      
      // Listen for audio resource events
      queue.dispatcher.audioResource.playStream.on('error', (error) => {
        console.error(`[Music Player] Audio stream error:`, error);
      });
      
      queue.dispatcher.audioResource.playStream.on('end', () => {
        console.log(`[Music Player] Audio stream ended`);
      });
      
      queue.dispatcher.audioResource.playStream.on('close', () => {
        console.log(`[Music Player] Audio stream closed`);
      });
      
    } else {
      console.log(`[Music Player] ❌ No audio resource found!`);
    }
    
    if (queue.metadata && queue.metadata.reply) {
      queue.metadata.reply(`🎵 Now playing: **${track.title}** by **${track.author}**`);
    }
  });

  player.events.on('playerFinish', (queue, track) => {
    console.log(`[Music Player] Finished playing: ${track.title}`);
    console.log(`[Music Player] Track duration was: ${track.duration}`);
    console.log(`[Music Player] Playback duration was: ${queue.dispatcher?.audioResource?.playbackDuration || 'unknown'}ms`);
  });

  player.events.on('disconnect', (queue) => {
    console.log(`[Music Player] Disconnected from voice channel`);
  });

  player.events.on('emptyChannel', (queue) => {
    console.log(`[Music Player] Voice channel is empty`);
  });

  player.events.on('audioTracksAdd', (queue, tracks) => {
    console.log(`[Music Player] Added ${tracks.length} track(s) to queue`);
  });

  player.events.on('playerSkip', (queue, track) => {
    console.log(`[Music Player] Skipped: ${track.title}`);
  });

  player.events.on('connection', (queue) => {
    console.log(`[Music Player] Connected to voice channel: ${queue.channel?.name}`);
  });

  console.log('Music player initialized with extractors:', player.extractors.size);
  console.log('FFmpeg path set to:', process.env.FFMPEG_PATH);
}

export async function handlePlay(msg: Message, args: string) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const member = msg.member as GuildMember;
  const voiceChannel = member?.voice?.channel;

  if (!voiceChannel) {
    await msg.reply('You need to be in a voice channel to play music!');
    return;
  }

  if (!args) {
    await msg.reply('Please provide a song URL or search term!');
    return;
  }

  try {
    console.log(`[Music Player] Attempting to play: "${args}"`);
    
    // For search terms, explicitly search YouTube
    const searchQuery = args.startsWith('http') ? args : `ytsearch:${args}`;
    console.log(`[Music Player] Search query: "${searchQuery}"`);
    
    const result = await player.play(voiceChannel, searchQuery, {
      nodeOptions: {
        metadata: msg,
        selfDeaf: false,
        volume: 100,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 60000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 60000,
        bufferingTimeout: 3000,  // Increase buffer timeout
        connectionTimeout: 30000,  // Increase connection timeout
        disableVolume: false,
        pauseOnEmpty: false,  // Don't pause when channel is empty
        maxHistorySize: 50,
        maxSize: 100
      }
    });

    console.log(`[Music Player] Play result:`, {
      track: result.track?.title,
      searchResult: result.searchResult?.tracks?.length || 0
    });

    const queue = player.nodes.get(msg.guild!.id);
    if (queue) {
      console.log(`[Music Player] Queue status: playing=${queue.node.isPlaying()}, paused=${queue.node.isPaused()}, tracks=${queue.tracks.size}`);
    }

    await msg.reply(`🎵 Added to queue: **${result.track.title}** by **${result.track.author}**`);
    console.log(`[Music Player] Successfully queued: ${result.track.title}`);
    
    // Wait a moment and check if it's actually playing
    setTimeout(() => {
      const queueCheck = player!.nodes.get(msg.guild!.id);
      if (queueCheck) {
        console.log(`[Music Player] Status check after 3s: playing=${queueCheck.node.isPlaying()}, current=${queueCheck.currentTrack?.title || 'none'}`);
        if (queueCheck.dispatcher?.audioResource) {
          console.log(`[Music Player] Audio resource playback duration: ${queueCheck.dispatcher.audioResource.playbackDuration}ms`);
        }
      }
    }, 3000);
    
  } catch (error) {
    console.error('Error playing music:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    await msg.reply('❌ There was an error trying to play that song! Make sure the song exists or try a different search term.');
  }
}

export async function handleVolume(msg: Message, volumeArg?: string) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const queue = player.nodes.get(msg.guild!.id);
  if (!queue) {
    await msg.reply('❌ No music is currently playing!');
    return;
  }

  if (!volumeArg) {
    await msg.reply(`🔊 Current volume: ${queue.node.volume}%`);
    return;
  }

  const volume = parseInt(volumeArg, 10);
  if (isNaN(volume) || volume < 0 || volume > 200) {
    await msg.reply('❌ Volume must be a number between 0 and 200!');
    return;
  }

  queue.node.setVolume(volume);
  await msg.reply(`🔊 Volume set to ${volume}%`);
}

export async function handleSkip(msg: Message) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const queue = player.nodes.get(msg.guild!.id);
  if (!queue || !queue.currentTrack) {
    await msg.reply('❌ No music is currently playing!');
    return;
  }

  queue.node.skip();
  await msg.reply('⏭️ Skipped the current song!');
}

export async function handleQueue(msg: Message) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const queue = player.nodes.get(msg.guild!.id);
  if (!queue || !queue.currentTrack) {
    await msg.reply('❌ No music is currently playing!');
    return;
  }

  const currentTrack = queue.currentTrack;
  const tracks = queue.tracks.data.slice(0, 10); // Show first 10 tracks

  let queueString = `🎵 **Currently Playing:** ${currentTrack.title} by ${currentTrack.author}\n`;
  queueString += `🔊 **Volume:** ${queue.node.volume}%\n\n`;

  if (tracks.length === 0) {
    queueString += 'No more songs in queue.';
  } else {
    queueString += '**Up Next:**\n';
    tracks.forEach((track: Track, index: number) => {
      queueString += `${index + 1}. ${track.title} by ${track.author}\n`;
    });
  }

  await msg.reply(queueString);
}

export async function handlePause(msg: Message) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const queue = player.nodes.get(msg.guild!.id);
  if (!queue || !queue.currentTrack) {
    await msg.reply('❌ No music is currently playing!');
    return;
  }

  queue.node.pause();
  await msg.reply('⏸️ Paused the music!');
}

export async function handleResume(msg: Message) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const queue = player.nodes.get(msg.guild!.id);
  if (!queue || !queue.currentTrack) {
    await msg.reply('❌ No music is currently playing!');
    return;
  }

  queue.node.resume();
  await msg.reply('▶️ Resumed the music!');
}

export async function handleExit(msg: Message) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const queue = player.nodes.get(msg.guild!.id);
  if (!queue) {
    await msg.reply('❌ No music is currently playing!');
    return;
  }

  queue.delete();
  await msg.reply('👋 Left the voice channel and cleared the queue!');
} 

export async function handleDebug(msg: Message) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const queue = player.nodes.get(msg.guild!.id);
  if (!queue) {
    await msg.reply('❌ No music queue found!');
    return;
  }

  const connectionState = queue.dispatcher?.voiceConnection?.state?.status || 'unknown';
  const audioPlayerState = queue.dispatcher?.audioPlayer?.state?.status || 'unknown';
  const currentTrack = queue.currentTrack?.title || 'none';
  const volume = queue.node.volume;
  const isPlaying = queue.node.isPlaying();
  const isPaused = queue.node.isPaused();

  const debugInfo = `🔧 **Debug Info:**
**Connection State:** ${connectionState}
**Audio Player State:** ${audioPlayerState}
**Current Track:** ${currentTrack}
**Volume:** ${volume}%
**Is Playing:** ${isPlaying}
**Is Paused:** ${isPaused}
**Queue Size:** ${queue.tracks.size}`;

  await msg.reply(debugInfo);
} 

export async function handleStatus(msg: Message) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const queue = player.nodes.get(msg.guild!.id);
  if (!queue) {
    await msg.reply('❌ No music queue found! Bot may not be connected to a voice channel.');
    return;
  }

  const isPlaying = queue.node.isPlaying();
  const isPaused = queue.node.isPaused();
  const currentTrack = queue.currentTrack?.title || 'None';
  const queueSize = queue.tracks.size;
  const volume = queue.node.volume;

  await msg.reply(`📊 **Music Status:**
🎵 **Current Track:** ${currentTrack}
▶️ **Playing:** ${isPlaying ? 'Yes' : 'No'}
⏸️ **Paused:** ${isPaused ? 'Yes' : 'No'}
📝 **Queue Size:** ${queueSize}
🔊 **Volume:** ${volume}%`);
} 

export async function handleTestAudio(msg: Message) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const member = msg.member as GuildMember;
  const voiceChannel = member?.voice?.channel;

  if (!voiceChannel) {
    await msg.reply('You need to be in a voice channel to test audio!');
    return;
  }

  try {
    // Try a longer, more standard audio file
    const testUrl = 'https://www.soundjay.com/misc/sounds/beep-07a.wav';
    
    console.log(`[Music Player] Testing audio with: ${testUrl}`);
    
    const result = await player.play(voiceChannel, testUrl, {
      nodeOptions: {
        metadata: msg,
        selfDeaf: false,
        volume: 100,
        leaveOnEmpty: false,
        leaveOnEnd: false
      }
    });

    // Check voice connection status
    const queue = player.nodes.get(msg.guild!.id);
    if (queue?.dispatcher?.voiceConnection) {
      const connection = queue.dispatcher.voiceConnection;
      console.log(`[Music Player] Voice connection state: ${connection.state.status}`);
      console.log(`[Music Player] Voice connection ready: ${connection.state.status === 'ready'}`);
      console.log(`[Music Player] Voice receiver subscribers: ${connection.receiver.speaking.listenerCount('start')}`);
    }

    await msg.reply(`🔧 Testing audio: **${result.track.title}** - Check if you can hear a beep sound!`);
    console.log(`[Music Player] Test audio result: ${result.track.title}`);
    
  } catch (error) {
    console.error('Error testing audio:', error);
    await msg.reply('❌ Audio test failed: ' + error);
  }
} 

export async function handleVoiceTest(msg: Message) {
  if (!checkMusicChannel(msg)) return;
  
  if (!player) {
    await msg.reply('Music player not initialized!');
    return;
  }

  const member = msg.member as GuildMember;
  const voiceChannel = member?.voice?.channel;

  if (!voiceChannel) {
    await msg.reply('You need to be in a voice channel to test voice!');
    return;
  }

  const queue = player.nodes.get(msg.guild!.id);
  if (!queue?.dispatcher?.voiceConnection) {
    await msg.reply('❌ No voice connection found! Try playing something first.');
    return;
  }

  const connection = queue.dispatcher.voiceConnection;
  
  await msg.reply('🎤 Voice test: **Say something now!** I\'ll listen for 10 seconds...');
  
  // Listen for voice activity
  let voiceHeard = false;
  
  const onSpeakingStart = (userId: string) => {
    if (userId !== msg.client.user!.id) { // Don't detect our own voice
      console.log(`[Voice Test] Heard voice from user: ${userId}`);
      voiceHeard = true;
    }
  };
  
  connection.receiver.speaking.on('start', onSpeakingStart);
  
  // Wait 10 seconds
  setTimeout(() => {
    connection.receiver.speaking.off('start', onSpeakingStart);
    
    if (voiceHeard) {
      (msg.channel as any).send('✅ Voice test successful! I can hear you speaking.');
      console.log('[Voice Test] Successfully detected user voice');
    } else {
      (msg.channel as any).send('❌ Voice test failed! I couldn\'t hear any voice. Check your microphone and Discord settings.');
      console.log('[Voice Test] No voice detected');
    }
  }, 10000);
  
  console.log(`[Voice Test] Listening for voice activity on connection: ${connection.state.status}`);
} 