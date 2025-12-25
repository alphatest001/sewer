import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Play } from 'lucide-react';
import { WorkEntryMedia } from '../lib/supabase';

interface MediaGalleryProps {
  media: WorkEntryMedia[];
  type: 'photo' | 'video';
  title: string;
}

export default function MediaGallery({ media, type, title }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filteredMedia = media
    .filter(m => m.media_type === type)
    .sort((a, b) => a.display_order - b.display_order);

  if (filteredMedia.length === 0) return null;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < filteredMedia.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') closeLightbox();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {title} ({filteredMedia.length})
      </h3>

      {/* Thumbnail Grid for Photos */}
      {type === 'photo' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredMedia.map((item, index) => (
            <div
              key={item.id}
              onClick={() => openLightbox(index)}
              className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-orange-500 transition-colors"
            >
              <img
                src={item.media_url}
                alt={item.file_name || `Photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
            </div>
          ))}
        </div>
      ) : (
        // Video List View
        <div className="space-y-3">
          {filteredMedia.map((item, index) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-orange-500 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-32 h-20 bg-gray-900 rounded-lg flex items-center justify-center cursor-pointer"
                    onClick={() => openLightbox(index)}
                  >
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.file_name || `Video ${index + 1}`}
                  </p>
                  {item.file_size && (
                    <p className="text-sm text-gray-500">
                      {(item.file_size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <a
                  href={item.media_url}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-[60]"
            onClick={closeLightbox}
          />
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg text-sm z-10">
              {selectedIndex + 1} / {filteredMedia.length}
            </div>

            {/* Navigation Buttons */}
            {selectedIndex > 0 && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 p-3 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {selectedIndex < filteredMedia.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 p-3 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Media Content */}
            <div className="max-w-5xl max-h-full">
              {type === 'photo' ? (
                <img
                  src={filteredMedia[selectedIndex].media_url}
                  alt={filteredMedia[selectedIndex].file_name || `Photo ${selectedIndex + 1}`}
                  className="max-w-full max-h-[90vh] object-contain"
                />
              ) : (
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    autoPlay
                    className="max-w-full max-h-[90vh]"
                    preload="metadata"
                  >
                    <source src={filteredMedia[selectedIndex].media_url} type="video/mp4" />
                    <source src={filteredMedia[selectedIndex].media_url} type="video/webm" />
                    Your browser does not support the video player.
                  </video>
                </div>
              )}
            </div>

            {/* Download Button for Current Item */}
            <a
              href={filteredMedia[selectedIndex].media_url}
              download
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors z-10"
            >
              <Download className="w-5 h-5" />
              Download
            </a>
          </div>
        </>
      )}
    </div>
  );
}
