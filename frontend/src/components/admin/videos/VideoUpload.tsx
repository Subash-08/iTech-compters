// src/pages/admin/videos/VideoUpload.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoService } from '../services/videoService';
import { UploadProgress } from '../types/video';
import { toast } from 'react-toastify';

interface ThumbnailFile {
  file: File;
  preview: string;
  index: number;
}

const VideoUpload: React.FC = () => {
  const navigate = useNavigate();
  const [uploadType, setUploadType] = useState<'single' | 'multiple'>('single');
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnails, setThumbnails] = useState<ThumbnailFile[]>([]);
  const [titles, setTitles] = useState<string[]>(['']);
  const [descriptions, setDescriptions] = useState<string[]>(['']);
  const [tags, setTags] = useState<string[]>(['']);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [videoDragActive, setVideoDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement[]>([]);

  const handleVideoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setVideoDragActive(true);
    } else if (e.type === 'dragleave') {
      setVideoDragActive(false);
    }
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVideoDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const videoFiles = droppedFiles.filter(file => 
      file.type.startsWith('video/') || 
      ['.mp4', '.mov', '.avi', '.webm', '.ogg', '.mkv'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );

    if (videoFiles.length === 0) {
      toast.error('No valid video files found. Please upload MP4, MOV, AVI, WebM, OGG, or MKV files.');
      return;
    }

    handleSelectedVideos(videoFiles);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const videoFiles = Array.from(selectedFiles);
    handleSelectedVideos(videoFiles);
  };

  const handleSelectedVideos = (videoFiles: File[]) => {
    if (uploadType === 'single' && videoFiles.length > 1) {
      toast.warning('Single upload mode selected. Only the first file will be used.');
      const singleFile = videoFiles[0];
      setFiles([singleFile]);
      setTitles([singleFile.name.replace(/\.[^/.]+$/, '')]);
      setDescriptions(['']);
      setTags(['']);
      setThumbnails([]); // Clear thumbnails
    } else {
      setFiles(videoFiles);
      setTitles(videoFiles.map(file => file.name.replace(/\.[^/.]+$/, '')));
      setDescriptions(Array(videoFiles.length).fill(''));
      setTags(Array(videoFiles.length).fill(''));
      setThumbnails([]); // Clear existing thumbnails
    }
  };

  const handleThumbnailSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate image file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Thumbnail size should be less than 5MB');
      return;
    }

    const preview = URL.createObjectURL(selectedFile);
    const newThumbnail: ThumbnailFile = {
      file: selectedFile,
      preview,
      index
    };

    // Remove existing thumbnail for this index if any
    const updatedThumbnails = thumbnails.filter(t => t.index !== index);
    updatedThumbnails.push(newThumbnail);
    setThumbnails(updatedThumbnails);
  };

  const handleTitleChange = (index: number, value: string) => {
    const newTitles = [...titles];
    newTitles[index] = value;
    setTitles(newTitles);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const newDescriptions = [...descriptions];
    newDescriptions[index] = value;
    setDescriptions(newDescriptions);
  };

  const handleTagsChange = (index: number, value: string) => {
    const newTags = [...tags];
    newTags[index] = value;
    setTags(newTags);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one video file');
      return;
    }

    // Validate file sizes (max 500MB each)
    const maxSize = 500 * 1024 * 1024; // 500MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error(`File "${oversizedFiles[0].name}" exceeds 500MB limit`);
      return;
    }

    setUploading(true);
    setProgress(null);

    try {
      if (uploadType === 'single') {
        await uploadSingleVideo();
      } else {
        await uploadMultipleVideos();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Upload failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const uploadSingleVideo = async () => {
    const formData = new FormData();
    formData.append('video', files[0]);
    formData.append('title', titles[0]);
    formData.append('description', descriptions[0]);
    
    // Add tags
    const tagsArray = tags[0] 
      ? tags[0].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];
    formData.append('tags', JSON.stringify(tagsArray));
    
    // Add thumbnail if provided
    const thumbnailForIndex = thumbnails.find(t => t.index === 0);
    if (thumbnailForIndex) {
      formData.append('thumbnail', thumbnailForIndex.file);
    }

    const response = await videoService.uploadVideo(formData, (progress) => {
      setProgress(progress);
    });

    if (response.success) {
      toast.success('Video uploaded successfully!');
      navigate('/admin/videos');
    } else {
      toast.error(response.message || 'Upload failed');
    }
  };

  const uploadMultipleVideos = async () => {
    const formData = new FormData();
    
    // Add videos
    files.forEach((file, index) => {
      formData.append('videos', file);
    });
    
    // Add thumbnails
    thumbnails.forEach(thumbnail => {
      formData.append('thumbnails', thumbnail.file);
    });
    
    // Add metadata
    formData.append('titles', JSON.stringify(titles));
    formData.append('descriptions', JSON.stringify(descriptions));
    
    // Convert all tags strings to arrays
    const tagsArrays = tags.map(tagStr => 
      tagStr ? tagStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []
    );
    formData.append('tags', JSON.stringify(tagsArrays));

    const response = await videoService.uploadMultipleVideos(formData, (progress) => {
      setProgress(progress);
    });

    if (response.success) {
      toast.success(`${response.data.videos?.length || files.length} videos uploaded successfully!`);
      navigate('/admin/videos');
    } else {
      toast.error(response.message || 'Upload failed');
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    const newTitles = [...titles];
    const newDescriptions = [...descriptions];
    const newTags = [...tags];
    
    newFiles.splice(index, 1);
    newTitles.splice(index, 1);
    newDescriptions.splice(index, 1);
    newTags.splice(index, 1);
    
    // Remove associated thumbnail
    const newThumbnails = thumbnails.filter(t => t.index !== index);
    // Update indices for remaining thumbnails
    const updatedThumbnails = newThumbnails.map(t => {
      if (t.index > index) {
        return { ...t, index: t.index - 1 };
      }
      return t;
    });
    
    setFiles(newFiles);
    setTitles(newTitles);
    setDescriptions(newDescriptions);
    setTags(newTags);
    setThumbnails(updatedThumbnails);
  };

  const removeThumbnail = (index: number) => {
    const newThumbnails = thumbnails.filter(t => t.index !== index);
    setThumbnails(newThumbnails);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerThumbnailInput = (index: number) => {
    if (!thumbnailInputRef.current[index]) return;
    thumbnailInputRef.current[index].click();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Upload Videos</h1>
        <p className="text-gray-600 mt-2">Upload video files with custom thumbnails</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Upload Type Toggle */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => {
                setUploadType('single');
                setFiles([]);
                setThumbnails([]);
                setTitles(['']);
                setDescriptions(['']);
                setTags(['']);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadType === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Single Upload
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadType('multiple');
                setFiles([]);
                setThumbnails([]);
                setTitles(['']);
                setDescriptions(['']);
                setTags(['']);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadType === 'multiple'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Multiple Upload (Up to 5)
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {uploadType === 'single'
              ? 'Upload one video at a time with custom thumbnail'
              : 'Upload multiple videos with custom thumbnails'}
          </p>
        </div>

        {/* Video Drag & Drop Area */}
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              videoDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleVideoDrag}
            onDragLeave={handleVideoDrag}
            onDragOver={handleVideoDrag}
            onDrop={handleVideoDrop}
          >
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag & drop your video files here
            </p>
            <p className="text-gray-500 mb-4">
              or click to browse files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              id="video-upload"
              multiple={uploadType === 'multiple'}
              accept="video/*,.mp4,.mov,.avi,.webm,.ogg,.mkv"
              onChange={handleVideoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={triggerFileInput}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Select Video Files
            </button>
            <p className="text-sm text-gray-400 mt-4">
              Supported formats: MP4, MOV, AVI, WebM, OGG, MKV • Max 500MB per file
            </p>
          </div>
        </div>

        {/* Selected Files List with Thumbnail Upload */}
        {files.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Selected Videos ({files.length})
            </h3>
            <div className="space-y-6">
              {files.map((file, index) => {
                const thumbnail = thumbnails.find(t => t.index === index);
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="text-blue-600 mr-3">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - Thumbnail Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Custom Thumbnail (Optional)
                        </label>
                        <div className="space-y-4">
                          <div
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                              thumbnail ? 'border-green-500' : 'border-gray-300 hover:border-blue-400'
                            }`}
                            onClick={() => triggerThumbnailInput(index)}
                          >
                            <input
                              ref={el => {
                                if (el) thumbnailInputRef.current[index] = el;
                              }}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleThumbnailSelect(index, e)}
                              className="hidden"
                            />
                            
                            {thumbnail ? (
                              <div className="relative">
                                <img
                                  src={thumbnail.preview}
                                  alt="Thumbnail preview"
                                  className="w-full h-40 object-cover rounded-md"
                                />
                                <div className="absolute top-2 right-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeThumbnail(index);
                                    }}
                                    className="bg-red-500 text-white p-1 rounded-full"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-gray-400 mb-2">
                                  <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <p className="text-sm text-gray-600">Click to upload thumbnail</p>
                                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP • Max 5MB</p>
                              </>
                            )}
                          </div>
                          {!thumbnail && (
                            <p className="text-xs text-gray-500 text-center">
                              Leave empty for auto-generated thumbnail
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Column - Video Info */}
                      <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title *
                            </label>
                            <input
                              type="text"
                              value={titles[index]}
                              onChange={(e) => handleTitleChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter video title"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tags (comma separated)
                            </label>
                            <input
                              type="text"
                              value={tags[index]}
                              onChange={(e) => handleTagsChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., product, showcase, tutorial"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Separate tags with commas
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={descriptions[index]}
                              onChange={(e) => handleDescriptionChange(index, e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter video description (optional)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && progress && (
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm text-gray-500">{progress.percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(progress.loaded / 1024 / 1024)}MB / {Math.round(progress.total / 1024 / 1024)}MB
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/videos')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload Videos'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;