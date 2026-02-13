import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPlaceholderImage } from '../utils/imageUtils';

interface MediaItem {
    type: 'image' | 'video';
    url: string;
    altText: string;
    thumbnailUrl?: string;
    duration?: number;
}

interface GalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: MediaItem[];
    videos: MediaItem[];
    initialIndex?: number;
    initialTab?: 'images' | 'videos';
}

const GalleryModal: React.FC<GalleryModalProps> = ({
    isOpen,
    onClose,
    images,
    videos,
    initialIndex = 0,
    initialTab = 'images'
}) => {
    const allMedia = useMemo(() => [...images, ...videos], [images, videos]);
    const [activeTab, setActiveTab] = useState<'images' | 'videos'>(initialTab);

    // Initialize index
    const [selectedIndex, setSelectedIndex] = useState(() => {
        if (initialTab === 'videos' && videos.length > 0) {
            return images.length + initialIndex; // Start at first video
        }
        return initialIndex;
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const currentItem = allMedia[selectedIndex];
    const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Pause video when switching/closing
    useEffect(() => {
        if (videoRef.current) videoRef.current.pause();
    }, [selectedIndex, isOpen]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Keyboard navigation & ESC
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, allMedia.length]);

    // Sync Active Tab with Current Item
    useEffect(() => {
        if (currentItem) {
            setActiveTab(currentItem.type === 'video' ? 'videos' : 'images');
        }
    }, [currentItem]);

    // Scroll active thumbnail into view
    useEffect(() => {
        const activeThumb = thumbnailRefs.current[selectedIndex];
        if (activeThumb) {
            activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedIndex]);

    const goToPrevious = () => {
        setSelectedIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
    };

    const goToNext = () => {
        setSelectedIndex((prev) => (prev + 1) % allMedia.length);
    };

    const handleTabClick = (tab: 'images' | 'videos') => {
        setActiveTab(tab);
        if (tab === 'videos') {
            // Find first video index
            const firstVideoIndex = allMedia.findIndex(m => m.type === 'video');
            if (firstVideoIndex !== -1) setSelectedIndex(firstVideoIndex);
        } else {
            // Find first image index
            const firstImageIndex = allMedia.findIndex(m => m.type === 'image');
            if (firstImageIndex !== -1) setSelectedIndex(firstImageIndex);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    // REDUCED HEIGHT: h-[500px]
                    className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[500px] flex flex-col overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header: Tabs & Close */}
                    <div className="flex items-center justify-between px-6 border-b border-gray-200 h-14 bg-white shrink-0">
                        {/* Tabs at Top */}
                        <div className="flex h-full space-x-6">
                            <button
                                onClick={() => handleTabClick('videos')}
                                className={`h-full flex items-center px-2 text-sm font-bold tracking-wider border-b-[3px] transition-colors ${activeTab === 'videos'
                                    ? 'border-teal-600 text-teal-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                VIDEOS
                            </button>
                            <button
                                onClick={() => handleTabClick('images')}
                                className={`h-full flex items-center px-2 text-sm font-bold tracking-wider border-b-[3px] transition-colors ${activeTab === 'images'
                                    ? 'border-teal-600 text-teal-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                IMAGES
                            </button>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-1 overflow-hidden">

                        {/* Left Sidebar: Thumbnails */}
                        <div className="w-24 bg-gray-50 border-r border-gray-200 overflow-y-auto custom-scrollbar p-3 space-y-3 shrink-0">
                            {allMedia.map((item, index) => (
                                <button
                                    key={index}
                                    ref={(el) => (thumbnailRefs.current[index] = el)}
                                    onClick={() => setSelectedIndex(index)}
                                    className={`relative w-full aspect-square rounded overflow-hidden border-2 transition-all ${selectedIndex === index
                                        ? 'border-teal-600 ring-1 ring-teal-600 opacity-100 shadow-sm'
                                        : 'border-transparent hover:border-gray-300  hover:opacity-100'
                                        }`}
                                >
                                    <img
                                        src={item.type === 'video' ? item.thumbnailUrl : item.url}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {item.type === 'video' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <svg className="w-6 h-6 text-white drop-shadow-md" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M6 4l10 6-10 6V4z" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Main Preview Area */}
                        <div className="flex-1 relative flex items-center justify-center bg-white p-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="w-full h-full flex items-center justify-center"
                                >
                                    {currentItem?.type === 'video' ? (
                                        <video
                                            ref={videoRef}
                                            src={currentItem.url}
                                            controls
                                            className="max-h-full max-w-full rounded shadow-sm"
                                        />
                                    ) : (
                                        <img
                                            src={currentItem?.url || getPlaceholderImage('Image', 800, 800)}
                                            alt={currentItem?.altText}
                                            className="max-h-full max-w-full object-contain"
                                            onError={(e) => {
                                                e.currentTarget.src = getPlaceholderImage('Error', 800, 800);
                                            }}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Floating Navigation Arrows */}
                            {allMedia.length > 1 && (
                                <>
                                    <button
                                        onClick={goToPrevious}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-700 hover:text-teal-600 hover:scale-105 transition-all border border-gray-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={goToNext}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-700 hover:text-teal-600 hover:scale-105 transition-all border border-gray-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GalleryModal;