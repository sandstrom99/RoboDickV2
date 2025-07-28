# RoboDickV2

A multi-channel image management system with a web portal, REST API backend, and Discord bot integration.

---

## Overview
RoboDickV2 is a full-stack application for managing images across web and Discord platforms. It consists of three main components:

- **Image Management Portal** (`portal/`): A React web app for browsing, viewing, and deleting images.
- **Image Service Backend** (`image-service/`): A Node.js/Express API for serving, listing, and deleting images.
- **Discord Bot** (`discord-bot/`): A Discord bot for uploading, fetching, and managing images via chat commands.

---

## Components

### 1. Portal (`portal/`)
- **Tech:** React, TypeScript, Vite, Tailwind CSS
- **Features:**
  - Browse and view images in a responsive grid
  - Paginated image listing
  - Delete images from the collection
- **Usage:**
  - Run `npm install` and `npm run dev` in the `portal/` folder
  - Access at [http://localhost:5173](http://localhost:5173) (default)

### 2. Image Service (`image-service/`)
- **Tech:** Node.js, Express, TypeScript
- **Features:**
  - REST API for image listing, deletion, and serving static files
  - Handles image uploads (used by the bot)
  - Stores image metadata in a JSON file
- **Usage:**
  - Run `npm install` and `npm run dev` in the `image-service/` folder
  - API runs at [http://localhost:3000](http://localhost:3000) (default)

### 3. Discord Bot (`discord-bot/`)
- **Tech:** Node.js, discord.js, TypeScript
- **Features:**
  - Responds to image-related commands in Discord (upload, fetch, delete, info, count)
  - Handles image uploads via Discord attachments
- **Usage:**
  - Set up a Discord bot token in a `.env` file as `DISCORD_TOKEN`
  - Run `npm install` and `npm run dev` in the `discord-bot/` folder

---

## How It Works
- The **portal** and **Discord bot** both interact with the **image service backend** via its REST API.
- Images can be uploaded via Discord, viewed and managed via the portal, and all actions are reflected across both interfaces.

---

## Getting Started
1. Clone the repository and install dependencies in each subfolder (`portal/`, `image-service/`, `discord-bot/`).
2. Start the backend (`image-service/`), then the portal and/or Discord bot as needed.
3. Configure API endpoints and Discord tokens as required.

---

## Project Structure
```
RoboDickV2/
  portal/         # Web frontend (React)
  image-service/  # Backend API (Express)
  discord-bot/    # Discord bot
```

---

## License
MIT (or specify your license here) 