import React, { useState, useRef, useEffect } from 'react';
import { ProductFormData } from '../../types/product';
import { toast } from 'react-toastify';

interface VideosSectionProps {
    formData: ProductFormData;
    updateFormData: (updates: Partial<ProductFormData>) => void;
    isEditing?: boolean;
    onFilesChange?: (files: {
        videos: File[];
        videoThumbnails: File[];
    }) => void;
    videoFiles?: File[];
    videoThumbnailFiles?: File[];
    existingVideos?: string[];
    setExistingVideos?: (ids: string[]) => void;
}

const VideosSection: React.FC<VideosSectionProps> = ({
    formData,
    onFilesChange,
    videoFiles = [],
    videoThumbnailFiles = [],
    existingVideos = [],
    setExistingVideos
}) => {
    const videoInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    // 2-step upload state
    const [pendingVideo, setPendingVideo] = useState<File | null>(null);
    const [pendingVideoPreview, setPendingVideoPreview] = useState<string>('');

    // Object URL state for memory management
    const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
    const [thumbnailPreviews, setThumbnailPreviews] = useState<string[]>([]);

    // Maximum limits
    const MAX_VIDEOS = 5;
    const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            videoPreviews.forEach(url => URL.revokeObjectURL(url));
            thumbnailPreviews.forEach(url => URL.revokeObjectURL(url));
            if (pendingVideoPreview) URL.revokeObjectURL(pendingVideoPreview);
        };
    }, []);

    // STEP 1: Select Video
    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size
        if (file.size > MAX_VIDEO_SIZE) {
            toast.error(`Video size must be less than 25MB. Current: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
            e.target.value = '';
            return;
        }

        // Validate total count
        const totalVideos = existingVideos.length + videoFiles.length + 1;
        if (totalVideos > MAX_VIDEOS) {
            toast.error(`Maximum ${MAX_VIDEOS} videos allowed per product.`);
            e.target.value = '';
            return;
        }

        // Store pending video and create preview
        const previewUrl = URL.createObjectURL(file);
        setPendingVideo(file);
        setPendingVideoPreview(previewUrl);

        toast.info("Video selected! Now please upload a thumbnail for it.");
        e.target.value = '';
    };

    // STEP 2: Select Thumbnail for Pending Video
    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const thumbnailFile = e.target.files?.[0];
        if (!thumbnailFile || !pendingVideo) return;

        // Create preview URLs
        const videoPreviewUrl = pendingVideoPreview;
        const thumbnailPreviewUrl = URL.createObjectURL(thumbnailFile);

        // Add to file arrays
        onFilesChange?.({
            videos: [...videoFiles, pendingVideo],
            videoThumbnails: [...videoThumbnailFiles, thumbnailFile]
        });

        // Update preview arrays
        setVideoPreviews(prev => [...prev, videoPreviewUrl]);
        setThumbnailPreviews(prev => [...prev, thumbnailPreviewUrl]);

        // Clear pending state
        setPendingVideo(null);
        setPendingVideoPreview('');

        toast.success("Video and thumbnail added successfully!");
        e.target.value = '';
    };

    // Remove new video (before upload)
    const removeNewVideo = (index: number) => {
        // Revoke object URLs
        URL.revokeObjectURL(videoPreviews[index]);
        URL.revokeObjectURL(thumbnailPreviews[index]);

        // Update file arrays
        const newVideos = videoFiles.filter((_, i) => i !== index);
        const newThumbnails = videoThumbnailFiles.filter((_, i) => i !== index);

        onFilesChange?.({
            videos: newVideos,
            videoThumbnails: newThumbnails
        });

        // Update preview arrays
        setVideoPreviews(prev => prev.filter((_, i) => i !== index));
        setThumbnailPreviews(prev => prev.filter((_, i) => i !== index));

        toast.info("Video removed");
    };

    // Remove existing video
    const removeExistingVideo = (publicId: string) => {


        if (setExistingVideos) {
            const newExistingVideos = existingVideos.filter(id => id !== publicId);
            setExistingVideos(newExistingVideos);
            toast.info("Video marked for removal");
        } else {
            console.error('❌ [VideosSection] setExistingVideos is not defined!');
        }
    };

    // Safe display of existing videos
    const displayExistingVideos = Array.isArray(formData.videos)
        ? formData.videos.filter(v => existingVideos.includes(v.public_id))
        : [];

    const totalVideoCount = displayExistingVideos.length + videoFiles.length;
    const canAddMore = totalVideoCount < MAX_VIDEOS;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Product Videos</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Upload up to {MAX_VIDEOS} videos (max 25MB each). Each video requires a thumbnail.
                    </p>
                </div>
                <span className="text-sm text-gray-600">
                    {totalVideoCount} / {MAX_VIDEOS} videos
                </span>
            </div>

            {/* Existing Videos */}
            {displayExistingVideos.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Existing Videos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayExistingVideos.map((video: any) => (
                            <div key={video.public_id} className="relative border rounded-lg p-3">
                                <div className="flex gap-3">
                                    <img
                                        src={video.thumbnailUrl}
                                        alt="Video thumbnail"
                                        className="w-24 h-24 object-cover rounded"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            Video {video.duration}s
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(video.bytes / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                        <p className="text-xs text-gray-500">{video.format}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeExistingVideo(video.public_id)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Videos */}
            {videoFiles.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">New Videos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videoFiles.map((file, index) => (
                            <div key={index} className="relative border rounded-lg p-3">
                                <div className="flex gap-3">
                                    <img
                                        src={thumbnailPreviews[index]}
                                        alt="Video thumbnail"
                                        className="w-24 h-24 object-cover rounded"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeNewVideo(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Video (waiting for thumbnail) */}
            {pendingVideo && (
                <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
                    <div className="flex gap-3 mb-3">
                        <video
                            src={pendingVideoPreview}
                            className="w-32 h-32 object-cover rounded"
                            controls
                        />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{pendingVideo.name}</p>
                            <p className="text-xs text-gray-600">
                                {(pendingVideo.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <p className="text-xs text-blue-600 font-medium mt-2">
                                ⚠️ Please select a thumbnail for this video
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Upload Thumbnail
                    </button>
                </div>
            )}

            {/* Upload Controls */}
            {!pendingVideo && canAddMore && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Select Video
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                        Step 1: Select a video file (max 25MB)
                    </p>
                </div>
            )}

            {!canAddMore && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-yellow-800">
                        Maximum video limit reached ({MAX_VIDEOS} videos)
                    </p>
                </div>
            )}

            {/* Hidden inputs */}
            <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoSelect}
                className="hidden"
            />
            <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbnailSelect}
                className="hidden"
            />
        </div>
    );
};

export default VideosSection;
