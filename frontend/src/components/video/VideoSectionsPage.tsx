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
    duration?: string;
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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setHasError(false);

      const response = await videoService.getVisibleSections();

      if (response.success) {
        // Map API response to Section interface
        const apiSections = response.data?.sections as ApiSection[] || [];

        // Filter sections that have videos
        const sectionsWithVideos = apiSections.filter(apiSection =>
          apiSection.videos && apiSection.videos.length > 0
        );

        if (sectionsWithVideos.length === 0) {
          setSections([]);
          return;
        }

        const mappedSections: Section[] = sectionsWithVideos.map((apiSection: ApiSection) => ({
          _id: apiSection.id,
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
            _id: video.id,
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
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
        // If API returns success: false, set empty sections
        setSections([]);
      }
    } catch (err: any) {
      setHasError(true);
      setSections([]); // Set empty array to show nothing
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  // Show NOTHING when:
  // 1. There's an error (500 or any error)
  // 2. There are no sections
  // 3. Sections array is empty
  if (hasError || sections.length === 0) {
    return null; // Returns absolutely nothing
  }

  // Only render when we have sections with videos
  return (
    <div className="bg-rose-50">
      {sections.map((section, index) => (
        <motion.div
          key={section._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-rose-50"
        >
          <SectionRenderer section={section} />
        </motion.div>
      ))}
    </div>
  );
};

export default VideoSectionsPage;