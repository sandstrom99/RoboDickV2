import { Message, TextChannel } from 'discord.js';

export async function handleClean(msg: Message, countArg?: string) {
  // Parse the number of messages to delete
  let count = parseInt(countArg || '1', 10);
  
  if (isNaN(count) || count < 1) {
    await msg.reply('❌ Please provide a valid number of messages to delete (1-100).');
    return;
  }
  
  // Discord API limits bulk delete to 100 messages
  if (count > 100) {
    count = 100;
    await msg.reply('⚠️ Limited to 100 messages max.');
  }
  
  // Check if it's a text channel
  if (!msg.channel || msg.channel.type !== 0) { // 0 = GUILD_TEXT
    await msg.reply('❌ This command can only be used in text channels.');
    return;
  }
  
  const channel = msg.channel as TextChannel;
  
  try {
    // Fetch messages to delete (including the command message itself)
    const messages = await channel.messages.fetch({ limit: count + 1 });
    
    // Filter out messages older than 14 days (Discord limitation for bulk delete)
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recentMessages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);
    
    if (recentMessages.size === 0) {
      await msg.reply('❌ No recent messages found to delete (messages must be less than 14 days old).');
      return;
    }
    
    // Delete messages
    if (recentMessages.size === 1) {
      // Single message deletion
      await recentMessages.first()?.delete();
    } else {
      // Bulk deletion
      await channel.bulkDelete(recentMessages, true);
    }
    
    // Send confirmation (this will also get auto-deleted after a few seconds)
    const confirmation = await channel.send(`🗑️ Deleted ${recentMessages.size} message(s).`);
    
    // Auto-delete the confirmation message after 3 seconds
    setTimeout(() => {
      confirmation.delete().catch(() => {}); // Ignore errors if already deleted
    }, 3000);
    
    console.log(`[Clean] Deleted ${recentMessages.size} messages in channel ${channel.name}`);
    
  } catch (error) {
    console.error('Error cleaning messages:', error);
    await msg.reply('❌ Failed to delete messages. Make sure I have the "Manage Messages" permission.');
  }
} 