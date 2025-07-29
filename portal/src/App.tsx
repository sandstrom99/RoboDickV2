import React, { useEffect, useState } from 'react';
import { fetchImages, deleteImage, getTotalImageCount, uploadImage } from './api';
import type { ImageMeta } from './types';
import { ImageCard } from './components/ImageCard';
import { Pagination } from './components/Pagination';
import { Header } from './components/Header';
import { UploadModal } from './components/UploadModal';
import { StatsCard } from './components/StatsCard';
import { SearchBar } from './components/SearchBar';
import { ImageModal } from './components/ImageModal';
import { Screensaver } from './components/Screensaver';
import { PasswordLogin } from './components/PasswordLogin';

export default function App() {
  // ALL HOOKS MUST BE AT THE TOP - NEVER CONDITIONAL
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageMeta | null>(null);
  const [totalImages, setTotalImages] = useState(0);
  const [currentTab, setCurrentTab] = useState<'gallery' | 'screensaver'>('gallery');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');

  // Check if user is already authenticated on app load
  useEffect(() => {
    const authenticated = sessionStorage.getItem('portal_authenticated');
    const adminStatus = sessionStorage.getItem('portal_admin');
    const storedUsername = sessionStorage.getItem('portal_username');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
      setIsAdmin(adminStatus === 'true');
      setUsername(storedUsername || '');
    }
  }, []);

  // Load page data when authenticated and conditions change
  useEffect(() => {
    if (isAuthenticated && currentTab === 'gallery') {
      loadPage(page);
      loadTotalStats();
    }
  }, [page, currentTab, isAuthenticated]);

  // Handle search changes when authenticated
  useEffect(() => {
    if (isAuthenticated && currentTab === 'gallery') {
      if (page !== 1) {
        setPage(1); // This will trigger the first useEffect to call loadPage(1)
      }
      // Don't call loadPage directly here - let the page dependency handle it
    }
  }, [searchTerm, currentTab, isAuthenticated]);

  // ALL FUNCTIONS DEFINED HERE (NOT CONDITIONAL)
  async function loadPage(p: number) {
    setLoading(true);
    try {
      console.log('🔍 Loading page:', p, 'with limit:', limit);
      console.log('🌐 API URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/images?page=${p}&limit=${limit}&orderBy=createdAt&orderDirection=desc`);
      
      const data = await fetchImages(p, limit, 'createdAt', 'desc');
      console.log('✅ Received data:', data);
      
      setImages(data.images);
      setTotal(data.total);
      
      console.log('📊 Set images count:', data.images.length, 'Total:', data.total);
    } catch (error) {
      console.error('❌ Failed to load images:', error);
      alert('Failed to connect to image service. Make sure it\'s running on http://localhost:3000');
    } finally {
      setLoading(false);
    }
  }

  async function loadTotalStats() {
    try {
      console.log('📈 Loading total stats...');
      const count = await getTotalImageCount();
      console.log('📊 Total image count:', count);
      setTotalImages(count);
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) return;
    
    try {
      await deleteImage(id);
      await loadPage(page);
      await loadTotalStats();
      
      // Close modal if the deleted image was open
      if (selectedImage?.uuid === id) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image. Please try again.');
    }
  }

  async function handleUpload(files: FileList) {
    let uploaded = 0;
    let duplicates = 0;
    let errors = 0;
    
    try {
      for (const file of Array.from(files)) {
        try {
          await uploadImage(file, username);
          uploaded++;
          console.log(`✅ Uploaded: ${file.name}`);
        } catch (error) {
          if (error instanceof Error && error.message.includes('Duplicate image detected')) {
            duplicates++;
            console.log(`🚫 Duplicate: ${file.name} - ${error.message}`);
          } else {
            errors++;
            console.error(`❌ Failed to upload ${file.name}:`, error);
          }
        }
      }
      
      // Show results
      let message = '';
      if (uploaded > 0) message += `✅ Uploaded ${uploaded} new image(s). `;
      if (duplicates > 0) message += `🚫 Skipped ${duplicates} duplicate(s). `;
      if (errors > 0) message += `❌ Failed to upload ${errors} image(s). `;
      
      if (message) {
        alert(message.trim());
      }
      
      // Only refresh if we uploaded something new
      if (uploaded > 0) {
        await loadPage(page);
        await loadTotalStats();
      }
      
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Upload process failed:', error);
      alert('Upload process failed. Please try again.');
    }
  }

  // Handle successful authentication
  const handleAuthentication = (adminAccess: boolean = false, userUsername: string = '') => {
    setIsAuthenticated(true);
    setIsAdmin(adminAccess);
    setUsername(userUsername);
    sessionStorage.setItem('portal_authenticated', 'true');
    sessionStorage.setItem('portal_admin', adminAccess.toString());
    sessionStorage.setItem('portal_username', userUsername);
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('portal_authenticated');
    sessionStorage.removeItem('portal_admin');
    sessionStorage.removeItem('portal_username');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUsername('');
    // Reset app state
    setCurrentTab('gallery');
    setIsUploadModalOpen(false);
    setSelectedImage(null);
    setSearchTerm('');
    setPage(1);
  };

  // Handle tab change
  const handleTabChange = (tab: 'gallery' | 'screensaver') => {
    setCurrentTab(tab);
    // Close any open modals when switching tabs
    setIsUploadModalOpen(false);
    setSelectedImage(null);
  };

  // Handle screensaver exit
  const handleScreensaverExit = () => {
    setCurrentTab('gallery');
  };

  const filteredImages = images.filter(img => 
    searchTerm === '' || 
    img.uploaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.uuid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CONDITIONAL RENDERING ONLY AT THE RETURN LEVEL
  if (!isAuthenticated) {
    return <PasswordLogin onAuthenticated={handleAuthentication} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {currentTab === 'screensaver' ? (
        <Screensaver onExit={handleScreensaverExit} />
      ) : (
        <>
          <Header 
            onUploadClick={() => setIsUploadModalOpen(true)} 
            currentTab={currentTab}
            onTabChange={handleTabChange}
            onLogout={handleLogout}
            username={username}
          />
        
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {/* Stats Dashboard */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-6 mb-8">
            <StatsCard
              title="Total Images"
              value={totalImages.toLocaleString()}
              icon="🖼️"
              color="blue"
            />
            <StatsCard
              title="Current Page"
              value={`${images.length} images`}
              icon="📄"
              color="green"
            />
            <StatsCard
              title="Page"
              value={`${page} of ${Math.ceil(total / limit)}`}
              icon="📊"
              color="purple"
            />
          </div>

          {/* Search and Controls */}
          <div className="mb-8">
            <SearchBar 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              totalResults={filteredImages.length}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg text-gray-600">Loading images...</span>
            </div>
          )}

          {/* Images Grid */}
          {!loading && (
            <>
              {filteredImages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {searchTerm ? 'No images found' : 'No images available'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms' : 'Upload some images to get started'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
                  {filteredImages.map(img => (
                    <ImageCard
                      key={img.uuid}
                      image={img}
                      onDelete={handleDelete}
                      onView={setSelectedImage}
                      showDelete={isAdmin}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {!loading && filteredImages.length > 0 && (
            <Pagination 
              page={page} 
              total={total} 
              limit={limit} 
              onPageChange={setPage} 
            />
          )}
        </main>

        {/* Modals */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
        />

        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDelete}
          showDelete={isAdmin}
        />
        </>
      )}
    </div>
  );
}
