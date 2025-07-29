import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useImages } from '../hooks/useImages';
import { ImageCard } from '../components/ImageCard';
import { Pagination } from '../components/Pagination';
import { Header } from '../components/Header';
import { UploadModal } from '../components/UploadModal';
import { StatsCard } from '../components/StatsCard';
import { SearchBar } from '../components/SearchBar';
import { ImageModal } from '../components/ImageModal';
import type { ImageMeta } from '../types';

export function HomePage() {
  const { isAuthenticated, isAdmin, username, logout } = useAuth();
  const navigate = useNavigate();
  const {
    filteredImages,
    total,
    page,
    limit,
    loading,
    searchTerm,
    totalImages,
    setPage,
    setSearchTerm,
    handleDelete,
    handleUpload,
  } = useImages();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageMeta | null>(null);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleImageDelete = async (id: string) => {
    const success = await handleDelete(id);
    if (success && selectedImage?.uuid === id) {
      setSelectedImage(null);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    await handleUpload(files, username);
    setIsUploadModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Header 
        onUploadClick={() => setIsUploadModalOpen(true)} 
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
            value={`${filteredImages.length} images`}
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
                    onDelete={handleImageDelete}
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
        onUpload={handleImageUpload}
      />

      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onDelete={handleImageDelete}
        showDelete={isAdmin}
      />
    </div>
  );
} 