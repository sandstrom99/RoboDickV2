import { Message, EmbedBuilder } from 'discord.js';

export async function handleHelp(msg: Message) {
  const helpEmbed = new EmbedBuilder()
    .setTitle('🤖 RoboDick Bot Commands')
    .setDescription('Here are all available commands:')
    .setColor(0x00AE86)
    .addFields(
      {
        name: '🖼️ **Image Commands**',
        value: `
\`.sfwcount\` - Show total number of images
\`.sfw [count]\` - Get random images (1-9)
\`.sfwid <uuid>\` - Get image details by UUID
\`.sfwdelete <uuid>\` - Delete image (owner only)
**Upload:** Send image attachments to upload
        `,
        inline: false
      },
      {
        name: '�� **Music Commands** (Music channel only)',
        value: `
\`.play <song/url>\` - Play music from YouTube
\`.skip\` - Skip current song
\`.queue\` - Show current queue
\`.pause\` - Pause playback
\`.resume\` - Resume playback
\`.volume [0-200]\` - Check/set volume
\`.exit\` - Leave voice channel

*Music commands only work in <#702454148616028171>*
        `,
        inline: false
      },
      {
        name: '🛠️ **Utility Commands**',
        value: `
\`.clean [count]\` - Delete recent messages (1-100)
\`.help\` - Show this help message
        `,
        inline: false
      },
      {
        name: '🔧 **Debug Commands** (Music channel only)',
        value: `
\`.status\` - Show music player status
\`.debug\` - Show detailed debug info
\`.test\` - Test audio playback
\`.voicetest\` - Test voice connection
        `,
        inline: false
      }
    )
    .setFooter({ text: 'Use commands with a dot prefix (e.g., .play)' })
    .setTimestamp();

  await msg.reply({ embeds: [helpEmbed] });
} 