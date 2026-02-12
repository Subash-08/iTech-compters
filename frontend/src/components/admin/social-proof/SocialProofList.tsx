import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocialProofSection } from '../types/socialProof';
import { socialProofService } from '../services/socialProofService';
import { Icons } from '../Icon';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/imageUtils';

const SocialProofList: React.FC = () => {
    const navigate = useNavigate();
    const [section, setSection] = useState<SocialProofSection | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchSection = async () => {
        try {
            setLoading(true);
            const response = await socialProofService.getAdminSocialProof();
            setSection(response.data);
        } catch (err: any) {
            if (err.response?.status !== 404) {
                toast.error(err.response?.data?.message || 'Failed to fetch section');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSection();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Social Proof Section</h1>
                    <p className="text-gray-600">Manage the "JOIN OUR THRIVING TRIBE" section</p>
                </div>
                <button
                    onClick={() => navigate('/admin/social-proof/edit')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                >
                    <Icons.Edit className="w-5 h-5" />
                    <span>{section ? 'Edit Section' : 'Create Section'}</span>
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="p-8 text-center">
                        <Icons.Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                        <p className="mt-2 text-gray-600">Loading section...</p>
                    </div>
                ) : section ? (
                    <div className="p-6">
                        {/* Status Badge */}
                        <div className="mb-6">
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${section.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                            >
                                {section.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {/* Preview */}
                        <div
                            className="rounded-lg p-8 mb-6"
                            style={{ backgroundColor: section.backgroundColor }}
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Side */}
                                <div className="flex flex-col justify-center">
                                    <h2 className="text-3xl font-bold text-white mb-6">{section.heading}</h2>
                                    {section.illustrationImage && (
                                        <img
                                            src={getImageUrl(section.illustrationImage)}
                                            alt={section.illustrationImage.altText}
                                            className="w-64 h-64 object-contain rounded-lg"
                                        />
                                    )}
                                </div>

                                {/* Right Side - Metrics */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Google */}
                                    <div className="bg-white rounded-lg p-4 shadow-md">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
                                                <span className="text-xl font-bold text-blue-600">G</span>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-gray-900">
                                                    {section.google.rating} Stars
                                                </div>
                                                <div className="text-sm text-gray-600">{section.google.label}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Instagram */}
                                    <div className="bg-white rounded-lg p-4 shadow-md">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow">
                                                <span className="text-xl font-bold text-white">I</span>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-gray-900">
                                                    {section.instagram.followers}
                                                </div>
                                                <div className="text-sm text-gray-600">{section.instagram.label}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* YouTube */}
                                    <div className="bg-white rounded-lg p-4 shadow-md col-span-1 sm:col-span-2">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow">
                                                <span className="text-xl font-bold text-white">Y</span>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-gray-900">
                                                    {section.youtube.subscribers}
                                                </div>
                                                <div className="text-sm text-gray-600">{section.youtube.label}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Table */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Details</h3>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Background Color</dt>
                                    <dd className="mt-1 flex items-center space-x-2">
                                        <div
                                            className="w-6 h-6 rounded border border-gray-300"
                                            style={{ backgroundColor: section.backgroundColor }}
                                        />
                                        <span className="text-sm text-gray-900">{section.backgroundColor}</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Date(section.updatedAt).toLocaleString()}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <Icons.Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Section Created</h3>
                        <p className="text-gray-600 mb-6">
                            Create your social proof section to showcase your social media presence
                        </p>
                        <button
                            onClick={() => navigate('/admin/social-proof/edit')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            Create Section
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialProofList;
