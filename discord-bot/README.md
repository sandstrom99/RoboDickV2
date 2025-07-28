# Discord Bot - RoboDickV2

A multi-purpose Discord bot with image management, music playback, and utility features.

## Features

- 🖼️ **Image Management** - Upload, view, and manage images
- 🎵 **Music Player** - Play music from YouTube with queue support
- 🛠️ **Utility Tools** - Message cleanup and bot management
- 🔧 **Debug Tools** - Audio testing and connection diagnostics

---

## Setup

### Prerequisites
- Node.js 18+ 
- FFmpeg installed on system
- Discord Bot Token

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file with:
```env
DISCORD_TOKEN=your_discord_bot_token
SFW_CHANNEL_ID=your_image_channel_id
OWNER_ID=your_discord_user_id
BASE_URL=http://localhost:3000
MAX_IMAGES=9
HASH_THRESHOLD=5
```

### Running
```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

---

## Commands

### 🖼️ Image Commands

| Command | Description | Example |
|---------|-------------|---------|
| `.sfwcount` | Show total number of images | `.sfwcount` |
| `.sfw [count]` | Get 1-9 random images | `.sfw 3` |
| `.sfwid <uuid>` | Get image details by UUID | `.sfwid abc123` |
| `.sfwdelete <uuid>` | Delete image (owner only) | `.sfwdelete abc123` |
| **Upload** | Send image attachments to upload | *Attach images* |

### 🎵 Music Commands

| Command | Description | Example |
|---------|-------------|---------|
| `.play <song/url>` | Play music from YouTube | `.play never gonna give you up` |
| `.skip` | Skip current song | `.skip` |
| `.queue` | Show current queue | `.queue` |
| `.pause` | Pause playback | `.pause` |
| `.resume` | Resume playback | `.resume` |
| `.volume [0-200]` | Check/set volume | `.volume 150` |
| `.exit` | Leave voice channel | `.exit` |

### 🛠️ Utility Commands

| Command | Description | Example |
|---------|-------------|---------|
| `.clean [count]` | Delete recent messages (1-100) | `.clean 10` |
| `.help` | Show help message | `.help` |

### 🔧 Debug Commands

| Command | Description | Example |
|---------|-------------|---------|
| `.status` | Show music player status | `.status` |
| `.debug` | Show detailed debug info | `.debug` |
| `.test` | Test audio playback | `.test` |
| `.voicetest` | Test voice connection | `.voicetest` |

---

## Usage Examples

### Playing Music
```
.play https://www.youtube.com/watch?v=dQw4w9WgXcQ
.play rick astley never gonna give you up
.volume 80
.queue
.skip
```

### Managing Images
```
.sfw 5          # Get 5 random images
.sfwcount       # Check total images
.sfwid abc123   # View specific image
```

### Cleanup
```
.clean 20       # Delete last 20 messages
.help           # Show all commands
```

---

## Bot Permissions Required

### Basic Permissions
- Read Messages
- Send Messages
- Read Message History
- Use External Emojis

### Voice Permissions
- Connect (to voice channels)
- Speak (in voice channels)
- Use Voice Activity

### Moderation Permissions
- Manage Messages (for `.clean` command)

---

## Technical Details

### Dependencies
- **discord.js** - Discord API wrapper
- **discord-player** - Music playback functionality
- **@discordjs/opus** - Audio encoding
- **ffmpeg-static** - Audio processing
- **axios** - HTTP requests
- **image-hash** - Image duplicate detection

### Architecture
- **Commands** - Modular command handlers
- **Image Service** - Integration with image management API
- **Music Player** - YouTube audio streaming
- **Voice Connection** - Discord voice channel integration

### Development
```bash
# Start with file watching
npm run dev

# Type checking
npm run lint

# Code formatting
npm run format
```

---

## Troubleshooting

### Music Not Playing
1. Check bot has "Speak" permission in voice channel
2. Verify FFmpeg is installed (`ffmpeg -version`)
3. Try different voice channel or server region
4. Check bot volume in Discord (right-click bot in voice channel)

### Image Upload Issues
1. Ensure image service backend is running
2. Check `BASE_URL` in `.env` file
3. Verify image channel permissions

### General Issues
1. Check Discord bot token validity
2. Verify all environment variables are set
3. Check console logs for error details
4. Use `.debug` command for diagnostics

---

## License
MIT 