# Image Management Portal

A modern, responsive web frontend for the RoboDickV2 image management system.

## ✨ Features

### 🖼️ Image Management
- **Browse images** in a responsive grid layout
- **Search functionality** by filename, uploader, or UUID
- **Paginated listing** with smart pagination controls
- **Full-size image viewing** with detailed metadata modal
- **One-click deletion** with confirmation prompts

### 📤 Upload System
- **Drag-and-drop upload** interface
- **Multi-file selection** support
- **Real-time upload progress** indicators
- **Automatic file validation** (images only)
- **File size display** and management

### 📊 Dashboard
- **Real-time statistics** cards showing total images, current page info
- **Search results counter** with clear filters
- **Responsive design** that works on all devices

### 🎨 Modern UI/UX
- **Beautiful gradient backgrounds** and modern styling
- **Dark mode support** (automatic based on system preference)
- **Smooth animations** and hover effects
- **Loading states** and error handling
- **Copy-to-clipboard** functionality for UUIDs, hashes, and links

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS 4** for styling
- **Axios** for API communication

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Image service backend running on port 3000

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
The portal will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file:
```env
VITE_API_URL=http://localhost:3000
```

### API Endpoints
The portal expects the image service backend with these endpoints:
- `GET /api/images` - List images with pagination
- `GET /api/images/count` - Get total image count  
- `GET /api/images/:uuid` - Get specific image metadata
- `POST /api/images` - Upload new images
- `DELETE /api/images/:uuid` - Delete images
- `GET /images/:filename` - Serve static image files

## 🎯 Usage

### Browsing Images
- View images in a responsive grid
- Click any image to view full-size with detailed metadata
- Use pagination controls to navigate through pages

### Searching
- Use the search bar to filter by filename, uploader name, or UUID
- Results update in real-time as you type
- Clear search with the "Clear" button

### Uploading Images  
- Click "Upload Images" button in the header
- Drag and drop files or click to browse
- Select multiple image files at once
- Review selected files before uploading
- Upload progress is shown during processing

### Managing Images
- View detailed metadata in the image modal
- Copy UUIDs, filenames, hashes, and direct links
- Delete images with confirmation prompts
- All actions update the dashboard statistics in real-time

## 🎨 UI Components

- **Header** - Navigation with upload button
- **StatsCard** - Dashboard statistics display
- **SearchBar** - Real-time search functionality  
- **ImageCard** - Individual image display with actions
- **ImageModal** - Full-size image viewer with metadata
- **UploadModal** - Drag-and-drop upload interface
- **Pagination** - Smart pagination with page numbers

## 🔧 Development

### Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

### Code Structure
```
src/
  components/     # Reusable UI components
  types.ts       # TypeScript type definitions
  api.ts         # API client functions
  App.tsx        # Main application component
  main.tsx       # Application entry point
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest) 
- Safari (latest)
- Edge (latest)

## 📱 Responsive Design

The portal is fully responsive and works on:
- Desktop computers
- Tablets  
- Mobile phones
- Various screen sizes and orientations

---

Built with ❤️ for the RoboDickV2 ecosystem
