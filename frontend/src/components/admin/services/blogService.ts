import api from '../../config/axiosConfig';

// Blog Interfaces - Updated to match your MongoDB data
export interface Blog {
  _id: string;
  'Meta-tags': string; // With hyphen, capitalized
  Title: string; // Capitalized
  Html: string; // Capitalized
  Slug: string; // Capitalized
  Category: string | null; // Capitalized, null in your data
  Tags: string[]; // Capitalized
  Status: 'Draft' | 'Review' | 'Published' | 'Archived'; // Capitalized
  // Additional fields you might add later
  excerpt?: string;
  author?: string;
  featured?: boolean;
  image_url?: string | null;
  published_at?: string | null;
  workflow?: {
    auto_generated: boolean;
    generated_at: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
    quality_checks: Record<string, any>;
  };
  created_at: string;
  updated_at: string;
  // Virtual/computed fields
  reading_time?: number;
  // Compatibility fields (will be added by backend transformation)
  meta_tags?: string;
  title?: string;
  html?: string;
  slug?: string;
  category?: string[];
  tags?: string[];
  status?: string;
}

export interface BlogFormData {
  'Meta-tags': string;
  Title: string;
  Html: string;
  Slug: string;
  Category: string | null;
  Tags: string[];
  Status: 'Draft' | 'Review' | 'Published' | 'Archived';
  excerpt?: string;
  author?: string;
  featured?: boolean;
  image_url?: string | null;
  published_at?: string | null;
}

export interface BlogFilters {
  page?: number;
  limit?: number;
  status?: string; // Accepts both 'published' and 'Published'
  category?: string;
  tag?: string;
  search?: string;
  sort?: string;
  featured?: boolean;
}

export interface BlogStatistics {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  featured: number;
  recentActivity: Blog[];
  byCategory: Array<{ _id: string; count: number }>;
}

// In blogService.ts, update the transformBlog function:
const transformBlog = (blog: any): Blog => {
  // Trim and clean slug
  const cleanSlug = (blog.slug || blog.Slug || '')
    .toString()
    .replace(/\n/g, '') // Remove newlines
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]/g, '') // Remove special characters
    .toLowerCase()
    .trim();

  return {
    ...blog,
    // Clean slug
    slug: cleanSlug,
    Slug: cleanSlug,
    
    // Add compatibility fields if not present
    meta_tags: blog.meta_tags || blog['Meta-tags'],
    title: blog.title || blog.Title,
    html: blog.html || blog.Html,
    category: blog.category || (blog.Category ? [blog.Category] : []),
    tags: blog.tags || blog.Tags || [],
    status: blog.status || blog.Status?.toLowerCase() || 'draft',
    
    // Clean HTML
    Html: blog.Html?.replace(/^```html\s*/i, '').replace(/```$/g, '').trim() || blog.Html,
  };
};

export const blogService = {
  
  // ==================== ADMIN METHODS ====================
  
  // Get all blogs with filters
  getAllBlogs: async (filters: BlogFilters = {}): Promise<{ 
    success: boolean; 
    data: Blog[]; 
    total: number;
    pages: number;
    currentPage: number;
    statusCounts?: Array<{ _id: string; count: number }>;
  }> => {
    try {
      // Convert status to capitalized for backend
      const backendFilters = { ...filters };
      if (backendFilters.status) {
        backendFilters.status = backendFilters.status.charAt(0).toUpperCase() + 
                                backendFilters.status.slice(1).toLowerCase();
      }

      const params = new URLSearchParams();
      Object.entries(backendFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/admin/blogs?${params}`);
      
      // Transform data
      const transformedData = {
        ...response.data,
        data: response.data.data?.map(transformBlog) || []
      };
      
      return transformedData;
    } catch (error: any) {
      console.error('Error fetching blogs:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch blogs');
    }
  },

  // Get blog by ID
  getBlogById: async (id: string): Promise<{ success: boolean; data: Blog }> => {
    try {
      const response = await api.get(`/admin/blogs/${id}`);
      
      // Transform data
      const transformedData = {
        ...response.data,
        data: transformBlog(response.data.data)
      };
      
      return transformedData;
    } catch (error: any) {
      console.error('Error fetching blog:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch blog');
    }
  },

  // Create blog (manual or from n8n)
  createBlog: async (data: BlogFormData): Promise<{ success: boolean; data: Blog }> => {
    try {
      // Ensure data matches backend format
      const backendData = {
        'Meta-tags': data['Meta-tags'],
        Title: data.Title,
        Html: data.Html,
        Slug: data.Slug,
        Category: data.Category,
        Tags: data.Tags,
        Status: data.Status,
        excerpt: data.excerpt,
        author: data.author,
        featured: data.featured,
        image_url: data.image_url,
        published_at: data.published_at
      };

      const response = await api.post('/admin/blogs', backendData);
      
      // Transform data
      const transformedData = {
        ...response.data,
        data: transformBlog(response.data.data)
      };
      
      return transformedData;
    } catch (error: any) {
      console.error('Error creating blog:', error);
      throw new Error(error.response?.data?.message || 'Failed to create blog');
    }
  },

  // Update blog
  updateBlog: async (id: string, data: Partial<BlogFormData>): Promise<{ success: boolean; data: Blog }> => {
    try {
      // Convert lowercase fields to capitalized for backend
      const backendData: any = {};
      
      // Map lowercase to uppercase
      if (data.meta_tags !== undefined) backendData['Meta-tags'] = data.meta_tags;
      if (data.title !== undefined) backendData.Title = data.title;
      if (data.html !== undefined) backendData.Html = data.html;
      if (data.slug !== undefined) backendData.Slug = data.slug;
      if (data.category !== undefined) backendData.Category = data.category?.[0] || null;
      if (data.tags !== undefined) backendData.Tags = data.tags;
      if (data.status !== undefined) {
        backendData.Status = data.status.charAt(0).toUpperCase() + data.status.slice(1).toLowerCase();
      }
      
      // Direct mappings
      if (data['Meta-tags'] !== undefined) backendData['Meta-tags'] = data['Meta-tags'];
      if (data.Title !== undefined) backendData.Title = data.Title;
      if (data.Html !== undefined) backendData.Html = data.Html;
      if (data.Slug !== undefined) backendData.Slug = data.Slug;
      if (data.Category !== undefined) backendData.Category = data.Category;
      if (data.Tags !== undefined) backendData.Tags = data.Tags;
      if (data.Status !== undefined) backendData.Status = data.Status;
      
      // Other fields
      if (data.excerpt !== undefined) backendData.excerpt = data.excerpt;
      if (data.author !== undefined) backendData.author = data.author;
      if (data.featured !== undefined) backendData.featured = data.featured;
      if (data.image_url !== undefined) backendData.image_url = data.image_url;
      if (data.published_at !== undefined) backendData.published_at = data.published_at;

      const response = await api.put(`/admin/blogs/${id}`, backendData);
      
      // Transform data
      const transformedData = {
        ...response.data,
        data: transformBlog(response.data.data)
      };
      
      return transformedData;
    } catch (error: any) {
      console.error('Error updating blog:', error);
      throw new Error(error.response?.data?.message || 'Failed to update blog');
    }
  },

updateBlogStatus: async (id: string, status: string): Promise<{ success: boolean; data: Blog }> => {
  try {
    // Convert common status variations to proper backend format
    const statusMap: Record<string, string> = {
      'publish': 'Published',
      'published': 'Published',
      'draft': 'Draft',
      'review': 'Review',
      'archived': 'Archived',
      'Publish': 'Published',
    };
    
    // Use mapping or capitalize
    const backendStatus = statusMap[status.toLowerCase()] || 
                         status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    const response = await api.put(`/admin/blogs/${id}/status`, { status: backendStatus });
    
    // Transform data
    const transformedData = {
      ...response.data,
      data: transformBlog(response.data.data)
    };
    
    return transformedData;
  } catch (error: any) {
    console.error('Error updating blog status:', error);
    throw new Error(error.response?.data?.message || 'Failed to update blog status');
  }
},

  // Toggle featured status
  toggleFeatured: async (id: string, featured: boolean): Promise<{ success: boolean; data: Blog }> => {
    try {
      const response = await api.put(`/admin/blogs/${id}/featured`, { featured });
      
      // Transform data
      const transformedData = {
        ...response.data,
        data: transformBlog(response.data.data)
      };
      
      return transformedData;
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      throw new Error(error.response?.data?.message || 'Failed to update featured status');
    }
  },

updateBlogImage: async (id: string, file: File): Promise<{ success: boolean; data: Blog }> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.put(`/admin/blogs/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const transformedData = {
      ...response.data,
      data: transformBlog(response.data.data)
    };
    
    return transformedData;
  } catch (error: any) {
    console.error('Error updating blog image:', error);
    throw new Error(error.response?.data?.message || 'Failed to update blog image');
  }
},

  // Archive blog
  deleteBlog: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/admin/blogs/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting blog:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete blog');
    }
  },

  // Get blog statistics
  getBlogStatistics: async (): Promise<{ success: boolean; data: BlogStatistics }> => {
    try {
      const response = await api.get('/admin/blogs/statistics');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching blog statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  },

  // Bulk operations
  bulkUpdateBlogs: async (ids: string[], action: string, data?: any): Promise<{ 
    success: boolean; 
    message: string;
    data: { matched: number; modified: number } 
  }> => {
    try {
      const response = await api.post('/admin/blogs/bulk', { ids, action, data });
      return response.data;
    } catch (error: any) {
      console.error('Error in bulk operation:', error);
      throw new Error(error.response?.data?.message || 'Failed to perform bulk operation');
    }
  },

  // ==================== PUBLIC METHODS ====================
  
  // Get published blogs
  getPublishedBlogs: async (filters: Omit<BlogFilters, 'status'> = {}): Promise<{ 
    success: boolean; 
    data: Blog[]; 
    total: number;
    pages: number;
    currentPage: number;
  }> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/blogs?${params}`);
      
      // Transform data
      const transformedData = {
        ...response.data,
        data: response.data.data?.map(transformBlog) || []
      };
      
      return transformedData;
    } catch (error: any) {
      console.error('Error fetching published blogs:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch published blogs');
    }
  },

  // Get blog by slug
  getBlogBySlug: async (slug: string): Promise<{ success: boolean; data: Blog & { related_blogs?: Blog[] } }> => {
    try {
      const response = await api.get(`/blogs/${slug}`);
      
      // Transform data
      const transformedData = {
        ...response.data,
        data: {
          ...transformBlog(response.data.data),
          related_blogs: response.data.data?.related_blogs?.map(transformBlog) || []
        }
      };
      
      return transformedData;
    } catch (error: any) {
      console.error('Error fetching blog by slug:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch blog');
    }
  },

  // Get categories
  getCategories: async (): Promise<{ success: boolean; data: Array<{ _id: string; count: number }> }> => {
    try {
      const response = await api.get('/blogs/categories');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Get tags
  getTags: async (): Promise<{ success: boolean; data: Array<{ _id: string; count: number }> }> => {
    try {
      const response = await api.get('/blogs/tags');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch tags');
    }
  },

  // Get featured blogs
  getFeaturedBlogs: async (): Promise<{ success: boolean; data: Blog[] }> => {
    try {
      const response = await api.get('/blogs/featured');
      
      // Transform data
      const transformedData = {
        ...response.data,
        data: response.data.data?.map(transformBlog) || []
      };
      
      return transformedData;
    } catch (error: any) {
      console.error('Error fetching featured blogs:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch featured blogs');
    }
  },

  // Get recent blogs
  getRecentBlogs: async (): Promise<{ success: boolean; data: Blog[] }> => {
    try {
      const response = await api.get('/blogs/recent');
      
      // Transform data
      const transformedData = {
        ...response.data,
        data: response.data.data?.map(transformBlog) || []
      };
      
      return transformedData;
    } catch (error: any) {
      console.error('Error fetching recent blogs:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch recent blogs');
    }
  }
};