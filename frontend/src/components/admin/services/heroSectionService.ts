import api from '../../config/axiosConfig';// src/components/admin/services/heroSectionService.ts


export interface VideoDetails {
    _id: string;
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
    durationFormatted: string;
    optimizedUrl: string;
}

export interface HeroSlide {
    _id: string;
    title: string;
    subtitle: string;
    description: string;
    mediaType: 'image' | 'video';
    image: string;
    videoId?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: string;
    videoDetails?: VideoDetails;
    videoSettings?: {
        autoplay: boolean;
        loop: boolean;
        muted: boolean;
        controls: boolean;
        playsInline: boolean;
    };
    buttonText: string;
    buttonLink: string;
    backgroundColor: string;
    textColor: string;
    order: number;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface HeroSection {
    _id: string;
    name: string;
    slides: HeroSlide[];
    isActive: boolean;
    autoPlay: boolean;
    autoPlaySpeed: number;
    transitionEffect: string;
    showNavigation: boolean;
    showPagination: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface HeroSectionFormData {
    name: string;
    autoPlay: boolean;
    autoPlaySpeed: number;
    transitionEffect: string;
    showNavigation: boolean;
    showPagination: boolean;
    order?: number;
}

export interface SlideFormData {
    title: string;
    subtitle?: string;
    description?: string;
    mediaType: 'image' | 'video';
    videoId?: string;
    videoSettings?: {
        autoplay: boolean;
        loop: boolean;
        muted: boolean;
        controls: boolean;
        playsInline: boolean;
    };
    buttonText?: string;
    buttonLink?: string;
    backgroundColor?: string;
    textColor?: string;
    isActive: boolean;
    order: number;
    startDate?: string;
    endDate?: string;
}

export interface Video {
    _id: string;
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
    durationFormatted: string;
    optimizedUrl: string;
    createdAt: string;
}

export const heroSectionService = {
    // Get active hero sections (for frontend display)
    getActiveHeroSections: async () => {
        const response = await api.get('/hero-sections/active');
        return response.data;
    },

    // Get all hero sections (for admin)
    getAllHeroSections: async () => {
        const response = await api.get('/admin/hero-sections');
        return response.data;
    },

    // Get available videos for hero section
    getAvailableVideos: async (search?: string, page = 1, limit = 20) => {
        const params: any = { page, limit };
        if (search) params.search = search;
        
        const response = await api.get('/admin/hero-sections/available-videos', { params });
        return response.data;
    },

    // Get hero section by ID
    getHeroSectionById: async (id: string) => {
        const response = await api.get(`/admin/hero-sections/${id}`);
        return response.data;
    },

    // Create hero section
    createHeroSection: async (data: HeroSectionFormData) => {
        const response = await api.post('/admin/hero-sections', data);
        return response.data;
    },

    // Update hero section
    updateHeroSection: async (id: string, data: Partial<HeroSectionFormData>) => {
        const response = await api.put(`/admin/hero-sections/${id}`, data);
        return response.data;
    },

reorderHeroSections: async (sectionsOrder: string[]) => {
    const response = await api.put('/admin/hero-sections/reorder', { sectionsOrder });
    return response.data;
},

    // Add slide
    addSlide: async (heroSectionId: string, formData: FormData) => {
        const response = await api.post(`/admin/hero-sections/${heroSectionId}/slides`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Update slide
    updateSlide: async (heroSectionId: string, slideId: string, formData: FormData) => {
        const response = await api.put(`/admin/hero-sections/${heroSectionId}/slides/${slideId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Delete slide
    deleteSlide: async (heroSectionId: string, slideId: string) => {
        const response = await api.delete(`/admin/hero-sections/${heroSectionId}/slides/${slideId}`);
        return response.data;
    },

    // Reorder slides
    reorderSlides: async (heroSectionId: string, slidesOrder: string[]) => {
        const response = await api.put(`/admin/hero-sections/${heroSectionId}/reorder`, { slidesOrder });
        return response.data;
    },

    // Toggle slide active status
    toggleSlideActive: async (heroSectionId: string, slideId: string) => {
        const response = await api.put(`/admin/hero-sections/${heroSectionId}/slides/${slideId}/toggle`);
        return response.data;
    },
};

export default heroSectionService;