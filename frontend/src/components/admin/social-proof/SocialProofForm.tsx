import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocialProofFormData } from '../types/socialProof';
import { socialProofService } from '../services/socialProofService';
import { Icons } from '../Icon';
import { toast } from 'react-toastify';
import { getImageUrl, createPreviewUrl, revokePreviewUrl } from '../../utils/imageUtils';
import ColorPicker from '../common/ColorPicker';

const SocialProofForm: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [backgroundPreview, setBackgroundPreview] = useState<string>('');
    const [sectionId, setSectionId] = useState<string>('');
    const [isEdit, setIsEdit] = useState(false);

    const [formData, setFormData] = useState<SocialProofFormData>({
        isActive: true,
        backgroundColor: '#0FA3A3',
        backgroundImage: null,
        heading: 'JOIN OUR THRIVING TRIBE',
        illustrationImage: null,
        googleRating: 4.8,
        googleLabel: 'Rating on Google Review',
        instagramFollowers: '168K',
        instagramLabel: 'Followers on Instagram',
        youtubeSubscribers: '12K+',
        youtubeLabel: 'Subscribers on YouTube'
    });

    useEffect(() => {
        fetchSection();
    }, []);

    const fetchSection = async () => {
        try {
            setLoading(true);
            const response = await socialProofService.getAdminSocialProof();

            if (response.data) {
                const section = response.data;
                setSectionId(section._id);
                setIsEdit(true);

                setFormData({
                    isActive: section.isActive,
                    backgroundColor: section.backgroundColor,
                    backgroundImage: null,
                    heading: section.heading,
                    illustrationImage: null,
                    googleRating: section.google.rating,
                    googleLabel: section.google.label,
                    instagramFollowers: section.instagram.followers,
                    instagramLabel: section.instagram.label,
                    youtubeSubscribers: section.youtube.subscribers,
                    youtubeLabel: section.youtube.label
                });

                setPreviewImage(getImageUrl(section.illustrationImage));
                if (section.backgroundImage?.url) {
                    setBackgroundPreview(getImageUrl(section.backgroundImage));
                }
            }
        } catch (err: any) {
            // Section doesn't exist yet, that's okay
            if (err.response?.status !== 404) {
                toast.error('Failed to fetch section details');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, illustrationImage: file }));
            const previewUrl = createPreviewUrl(file);
            setPreviewImage(previewUrl);
        }
    };

    const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, backgroundImage: file }));
            const previewUrl = createPreviewUrl(file);
            setBackgroundPreview(previewUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('isActive', String(formData.isActive));
            submitData.append('backgroundColor', formData.backgroundColor);
            submitData.append('heading', formData.heading);
            submitData.append('googleRating', String(formData.googleRating));
            submitData.append('googleLabel', formData.googleLabel);
            submitData.append('instagramFollowers', formData.instagramFollowers);
            submitData.append('instagramLabel', formData.instagramLabel);
            submitData.append('youtubeSubscribers', formData.youtubeSubscribers);
            submitData.append('youtubeLabel', formData.youtubeLabel);

            if (formData.illustrationImage) {
                submitData.append('illustrationImage', formData.illustrationImage);
            }
            if (formData.backgroundImage) {
                submitData.append('backgroundImage', formData.backgroundImage);
            }

            if (isEdit && sectionId) {
                await socialProofService.updateById(sectionId, submitData);
                toast.success('Social proof section updated successfully');
            } else {
                await socialProofService.createOrUpdate(submitData);
                toast.success('Social proof section created successfully');
            }

            navigate('/admin/social-proof');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    // Cleanup preview URLs
    useEffect(() => {
        return () => {
            if (previewImage.startsWith('blob:')) revokePreviewUrl(previewImage);
            if (backgroundPreview.startsWith('blob:')) revokePreviewUrl(backgroundPreview);
        };
    }, [previewImage, backgroundPreview]);

    if (loading && !formData.heading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEdit ? 'Edit Social Proof Section' : 'Create Social Proof Section'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage the "JOIN OUR THRIVING TRIBE" section with social media metrics
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Global Settings */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Global Settings</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Background Color */}
                            <ColorPicker
                                label="Background Color"
                                value={formData.backgroundColor}
                                onChange={(color) => setFormData(prev => ({ ...prev, backgroundColor: color }))}
                            />

                            {/* Active Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Section Status
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                        Active (Visible on website)
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Background Image */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Background Image (Optional)
                            </label>
                            <div className="flex items-start space-x-6">
                                <div className="flex-shrink-0">
                                    {backgroundPreview ? (
                                        <img
                                            src={backgroundPreview}
                                            alt="Background Preview"
                                            className="w-48 h-32 object-cover rounded-lg border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-48 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                            <Icons.Image className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBackgroundImageChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
                                    />
                                    <div className="mt-2 flex items-center gap-2 text-sm">
                                        <Icons.Info className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium text-blue-700">Recommended Size: 1920x250px (Wide)</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">If provided, will be used instead of background color. Max size: 5MB.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left Side Content */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Left Side Content</h3>

                        {/* Heading */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700">Heading *</label>
                            <input
                                type="text"
                                name="heading"
                                value={formData.heading}
                                onChange={handleInputChange}
                                required
                                placeholder="JOIN OUR THRIVING TRIBE"
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Illustration Image */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Illustration Image *
                            </label>
                            <div className="flex items-start space-x-6">
                                <div className="flex-shrink-0">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="w-48 h-48 object-cover rounded-lg border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                            <Icons.Image className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
                                        required={!isEdit}
                                    />
                                    <div className="mt-2 flex items-center gap-2 text-sm">
                                        <Icons.Info className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium text-blue-700">Recommended Size: 400x400px (Square)</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Formats: JPG, PNG, WebP.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Social Metrics */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Metrics</h3>

                        <div className="space-y-6">
                            {/* Google */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-2 text-xs">G</span>
                                    Google Reviews
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Rating (0-5) *</label>
                                        <input
                                            type="number"
                                            name="googleRating"
                                            value={formData.googleRating}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            placeholder="4.8"
                                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Label *</label>
                                        <input
                                            type="text"
                                            name="googleLabel"
                                            value={formData.googleLabel}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Rating on Google Review"
                                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Instagram */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <span className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2 text-xs text-white">I</span>
                                    Instagram
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Followers *</label>
                                        <input
                                            type="text"
                                            name="instagramFollowers"
                                            value={formData.instagramFollowers}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="168K"
                                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Label *</label>
                                        <input
                                            type="text"
                                            name="instagramLabel"
                                            value={formData.instagramLabel}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Followers on Instagram"
                                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* YouTube */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <span className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center mr-2 text-xs text-white">Y</span>
                                    YouTube
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subscribers *</label>
                                        <input
                                            type="text"
                                            name="youtubeSubscribers"
                                            value={formData.youtubeSubscribers}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="12K+"
                                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Label *</label>
                                        <input
                                            type="text"
                                            name="youtubeLabel"
                                            value={formData.youtubeLabel}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Subscribers on YouTube"
                                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/social-proof')}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                            {loading && <Icons.Loader className="w-4 h-4 animate-spin" />}
                            <span>{isEdit ? 'Update Section' : 'Create Section'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SocialProofForm;
