// src/components/blog/BlogList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { blogService, Blog } from '../admin/services/blogService';
import { BlogCardSkeleton } from './Skeleton';
import { getImageUrl, getPlaceholderImage } from '../utils/imageUtils';

interface BlogListProps {
  category?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
  showPagination?: boolean;
  infiniteScroll?: boolean;
}

const BlogList: React.FC<BlogListProps> = ({
  category: initialCategory,
  tag: initialTag,
  featured,
  limit = 12,
  showPagination = true,
  infiniteScroll = false
}) => {
  const location = useLocation();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [selectedTag, setSelectedTag] = useState(initialTag || '');
  const [sortBy, setSortBy] = useState('-published_at');
  
  // Filter options
  const [categories, setCategories] = useState<Array<{ _id: string; count: number }>>([]);
  const [tags, setTags] = useState<Array<{ _id: string; count: number }>>([]);

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [catResponse, tagResponse] = await Promise.all([
        blogService.getCategories(),
        blogService.getTags()
      ]);
      
      if (catResponse.success) setCategories(catResponse.data);
      if (tagResponse.success) setTags(tagResponse.data);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  // Load blogs with filters
  const loadBlogs = async (resetPage = false) => {
    try {
      if (resetPage) setPage(1);
      
      const currentPage = resetPage ? 1 : page;
      setLoading(true);
      setError('');
      
      const filters: any = {
        page: currentPage,
        limit,
        category: selectedCategory || undefined,
        tag: selectedTag || undefined,
        featured: featured ? 'true' : undefined,
        search: searchQuery || undefined,
        sort: sortBy
      };

      console.log('Loading blogs with filters:', filters);
      const response = await blogService.getPublishedBlogs(filters);
      
      if (response.success) {
        if (currentPage === 1 || resetPage) {
          setBlogs(response.data);
        } else {
          setBlogs(prev => [...prev, ...response.data]);
        }
        setTotal(response.total);
        setPages(response.pages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load blogs');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more for infinite scroll
  const loadMore = () => {
    if (page < pages && !loadingMore) {
      setLoadingMore(true);
      setPage(prev => prev + 1);
    }
  };

  // Handle infinite scroll
  useEffect(() => {
    if (!infiniteScroll || loading || loadingMore) return;

    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= 
          document.documentElement.offsetHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, infiniteScroll, page, pages]);

  // Load blogs when filters change
  useEffect(() => {
    loadBlogs(true);
  }, [selectedCategory, selectedTag, searchQuery, sortBy, featured]);

  // Load more blogs when page changes (for infinite scroll)
  useEffect(() => {
    if (page > 1 && infiniteScroll) {
      loadBlogs(false);
    }
  }, [page]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExcerpt = (metaTags: string, html: string) => {
    if (metaTags) return metaTags.substring(0, 120);
    if (html) {
      const text = html.replace(/<[^>]*>/g, '');
      return text.substring(0, 120) + '...';
    }
    return '';
  };

  const getBlogImageUrl = (blog: Blog) => {
    if (blog.image_url) {
      return getImageUrl(blog.image_url);
    }
    return getPlaceholderImage(blog.title || blog.Title || 'Blog');
  };

  const getCleanSlug = (blog: Blog) => {
    const slug = blog.slug || blog.Slug || '';
    return slug.toString().replace(/\n/g, '').trim();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBlogs(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTag('');
    setSortBy('-published_at');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      {/* Header with Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-2">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {selectedCategory ? `${selectedCategory} Blogs` : 
             selectedTag ? `#${selectedTag}` : 
             'Latest Blog Posts'}
          </h1>
          <p className="text-gray-600 text-lg">
            {selectedCategory ? `Explore articles about ${selectedCategory}` : 
             selectedTag ? `Browse posts tagged with ${selectedTag}` : 
             'Discover insights, tutorials, and industry news'}
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-4 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSearch} className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search blog posts..."
                    className="flex-1 px-1 py-1 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-1 py-2 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-1 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat._id} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-1 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="-published_at">Newest First</option>
                <option value="published_at">Oldest First</option>
                <option value="-created_at">Recently Added</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          {/* Tag Filters */}
          {tags.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-4 py-2 rounded-lg font-medium ${!selectedTag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All Tags
                </button>
                {tags.slice(0, 10).map((tag) => (
                  <button
                    key={tag._id}
                    onClick={() => setSelectedTag(tag._id)}
                    className={`px-4 py-2 rounded-lg font-medium ${selectedTag === tag._id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {tag._id} ({tag.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(selectedCategory || selectedTag || searchQuery) && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Active filters:</span>
                {selectedCategory && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Category: {selectedCategory}
                  </span>
                )}
                {selectedTag && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    Tag: #{selectedTag}
                  </span>
                )}
                {searchQuery && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Search: "{searchQuery}"
                  </span>
                )}
              </div>
              <button
                onClick={handleResetFilters}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {blogs.length} of {total} blog posts
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-500 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Blogs</h3>
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={() => loadBlogs(true)}
                  className="mt-3 text-red-700 hover:text-red-900 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blogs Grid with Modern Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading && page === 1 ? (
            <BlogCardSkeleton count={limit} />
          ) : (
            blogs.map((blog) => {
              const blogTitle = blog.title || blog.Title || 'Untitled Blog';
              const blogSlug = getCleanSlug(blog);
              const blogImageUrl = getBlogImageUrl(blog);
              const blogCategory = blog.category?.[0] || blog.Category || '';
              const blogExcerpt = getExcerpt(blog.meta_tags || blog['Meta-tags'] || '', blog.html || blog.Html || '');
              const blogTags = blog.tags || blog.Tags || [];
              const blogDate = formatDate(blog.published_at || blog.created_at);
              
              return (
                <article 
                  key={blog._id}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Image Container */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={blogImageUrl}
                      alt={blogTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.currentTarget.src = getPlaceholderImage(blogTitle);
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Category Badge */}
                    {blogCategory && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                          {blogCategory}
                        </span>
                      </div>
                    )}
                    
                    {/* Date Badge */}
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                        {blogDate}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Reading Time */}
                    {blog.reading_time && (
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {blog.reading_time} min read
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                      <Link to={`/blog/${blogSlug}`} className="hover:no-underline">
                        {blogTitle}
                      </Link>
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                      {blogExcerpt}
                    </p>

                    {/* Tags */}
                    {blogTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {blogTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                        {blogTags.length > 2 && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                            +{blogTags.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Read More Button */}
                    <Link
                      to={`/blog/${blogSlug}`}
                      className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700"
                    >
                      Read Full Article
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Empty State */}
        {!loading && blogs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-300 text-7xl mb-6">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No blog posts found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {selectedCategory || selectedTag || searchQuery 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Check back soon for new articles and insights.'}
            </p>
            {(selectedCategory || selectedTag || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Load More Button (for manual infinite scroll) */}
        {!infiniteScroll && !loading && page < pages && (
          <div className="mt-12 text-center">
            <button
              onClick={() => {
                setPage(prev => prev + 1);
                setLoadingMore(true);
              }}
              disabled={loadingMore}
              className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </span>
              ) : (
                `Load More (${total - blogs.length} remaining)`
              )}
            </button>
          </div>
        )}

        {/* Infinite Scroll Loading Indicator */}
        {infiniteScroll && loadingMore && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center text-gray-600">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading more articles...
            </div>
          </div>
        )}

        {/* Traditional Pagination */}
        {showPagination && !infiniteScroll && pages > 1 && (
          <div className="mt-16">
            <div className="flex items-center justify-between">
              <div className="text-gray-600">
                Page {page} of {pages} • {total} total posts
              </div>
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    let pageNum;
                    if (pages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pages - 2) {
                      pageNum = pages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Next
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;