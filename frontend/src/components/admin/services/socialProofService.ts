import api from '../../config/axiosConfig';
import { SocialProofSection } from '../types/socialProof';

export const socialProofService = {
    // Public: Get active section for user page
    async getSocialProof() {
        const response = await api.get('/social-proof');
        return response.data;
    },

    // Admin: Get section (active & inactive)
    async getAdminSocialProof() {
        const response = await api.get('/admin/social-proof');
        return response.data;
    },

    // Admin: Create or Update section
    async createOrUpdate(formData: FormData) {
        const response = await api.post('/admin/social-proof', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Admin: Update section by ID
    async updateById(id: string, formData: FormData) {
        const response = await api.put(`/admin/social-proof/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
