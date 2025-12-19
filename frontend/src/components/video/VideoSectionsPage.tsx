// src/pages/VideoSectionsPage.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SectionRenderer from '../sections/SectionRenderer';
import { Section } from '../admin/types/section';
import { videoService } from '../admin/services/videoService';

interface ApiSection {
  id: string;
  title: string;
  description: string;
  layoutType: string;
  backgroundColor: string;
  textColor: string;
  maxWidth: string;
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  gridConfig: {
    columns: number;
    gap: number;
  };
  sliderConfig: {
    autoplay: boolean;
    delay: number;
    loop: boolean;
    showNavigation: boolean;
    showPagination: boolean;
  };
  videos: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
    settings: {
      autoplay: boolean;
      loop: boolean;
      muted: boolean;
      controls: boolean;
      playsInline: boolean;
    };
  }>;
  order?: number;
  visible?: boolean;
}

const VideoSectionsPage: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await videoService.getVisibleSections();
           
      if (response.success) {
        // Map API response to Section interface
        const apiSections = response.data?.sections as ApiSection[] || [];
        
        const mappedSections: Section[] = apiSections.map((apiSection: ApiSection) => ({
          _id: apiSection.id, // Map id to _id
          title: apiSection.title,
          description: apiSection.description,
          layoutType: apiSection.layoutType,
          backgroundColor: apiSection.backgroundColor,
          textColor: apiSection.textColor,
          maxWidth: apiSection.maxWidth,
          padding: apiSection.padding,
          gridConfig: apiSection.gridConfig,
          sliderConfig: apiSection.sliderConfig,
          videos: apiSection.videos.map(video => ({
            _id: video.id, // Map id to _id
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnailUrl: video.thumbnailUrl,
            settings: video.settings
          })),
          order: apiSection.order || 0,
          visible: apiSection.visible !== undefined ? apiSection.visible : true
        }));

        // Sort sections by order
        const sortedSections = mappedSections
          .filter((section: Section) => section.visible)
          .sort((a: Section, b: Section) => (a.order || 0) - (b.order || 0));
        
        setSections(sortedSections);
      } else {
        setError(response.message || 'Failed to load sections');
      }
    } catch (err: any) {
      console.error('Error fetching sections:', err); // Debug log
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component remains the same

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchSections}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No videos available</h2>
          <p className="text-gray-600">Check back later for new content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {sections.map((section, index) => (
        <motion.div
          key={section._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <SectionRenderer section={section} />
        </motion.div>
      ))}
    </div>
  );
};

export default VideoSectionsPage;