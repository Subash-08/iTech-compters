// src/components/blog/BlogList.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  const [searchQuery, setSearchQuery] = useState(''); // Controls the input field
  const [activeSearch, setActiveSearch] = useState(''); // Controls the actual API call
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [selectedTag, setSelectedTag] = useState(initialTag || '');
  const [sortBy, setSortBy] = useState('-published_at');
  
  // Filter options
  const [categories, setCategories] = useState<Array<{ _id: string; count: number }>>([]);
  const [tags, setTags] = useState<Array<{ _id: string; count: number }>>([]);
  const [recentPosts, setRecentPosts] = useState<Blog[]>([]);

  // --- SEO HELPER LOGIC ---
  const siteUrl = "https://itechcomputers.shop";
  const currentUrl = `${siteUrl}${location.pathname}${location.search}`;
  
  let pageTitle = "Tech Blog, PC Build Guides & Reviews | iTech Computers";
  let pageDescription = "Explore the latest insights on custom PC building, hardware reviews, and technology trends. Expert advice from iTech Computers Salem.";

  if (selectedCategory) {
    pageTitle = `${selectedCategory} Blogs & Articles | iTech Computers`;
    pageDescription = `Read our latest articles and guides about ${selectedCategory}. Expert insights and tutorials.`;
  } else if (selectedTag) {
    pageTitle = `Posts tagged "${selectedTag}" | iTech Computers Blog`;
    pageDescription = `Browse all our tech articles tagged with ${selectedTag}.`;
  }

  if (page > 1) {
    pageTitle = `${pageTitle} - Page ${page}`;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "headline": pageTitle,
    "description": pageDescription,
    "url": currentUrl,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": blogs.map((blog, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `${siteUrl}/blog/${blog.slug || blog.Slug}`,
        "name": blog.title || blog.Title
      }))
    }
  };

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
    fetchRecentPosts();
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

  const fetchRecentPosts = async () => {
    try {
      const response = await blogService.getPublishedBlogs({
        limit: 5,
        sort: '-published_at'
      });
      if (response.success) {
        setRecentPosts(response.data);
      }
    } catch (err) {
      console.error('Failed to load recent posts:', err);
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
        // ✅ CHANGED: Use activeSearch instead of searchQuery
        search: activeSearch || undefined,
        sort: sortBy
      };
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

  // ✅ CHANGED: Load blogs when filters change (Removed searchQuery, added activeSearch)
  useEffect(() => {
    loadBlogs(true);
  }, [selectedCategory, selectedTag, activeSearch, sortBy, featured]);

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
    if (metaTags) return metaTags.substring(0, 180);
    if (html) {
      const text = html.replace(/<[^>]*>/g, '');
      return text.substring(0, 180) + '...';
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

  // ✅ CHANGED: Only update activeSearch when form is submitted
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery); // This triggers the useEffect above
  };

  // ✅ CHANGED: Reset both states
  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveSearch('');
    setSelectedCategory('');
    setSelectedTag('');
    setSortBy('-published_at');
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={currentUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={currentUrl} />
        {activeSearch && <meta name="robots" content="noindex, follow" />}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="max-w-[85rem] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Content Area (Blog Posts) */}
          <div className="lg:w-3/4">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
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

            {error && (
              <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg">
                <p className="font-medium">Error Loading Blogs</p>
                <p className="text-sm mt-1">{error}</p>
                <button 
                  onClick={() => loadBlogs(true)}
                  className="mt-3 text-red-800 hover:text-red-900 font-medium text-sm"
                >
                  Try Again
                </button>
              </div>
            )}

            <div className="space-y-10">
              {loading && page === 1 ? (
                <BlogCardSkeleton count={limit} />
              ) : (
                blogs.map((blog, index) => {
                  const blogTitle = blog.title || blog.Title || 'Untitled Blog';
                  const blogSlug = getCleanSlug(blog);
                  const blogImageUrl = getBlogImageUrl(blog);
                  const blogCategory = blog.category?.[0] || blog.Category || '';
                  const blogExcerpt = getExcerpt(blog.meta_tags || blog['Meta-tags'] || '', blog.html || blog.Html || '');
                  const blogDate = formatDate(blog.published_at || blog.created_at);
                  
                  return (
                    <article 
                      key={blog._id}
                      className="group"
                    >
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-2/5">
                          <div className="relative overflow-hidden rounded-xl">
                            <img
                              src={blogImageUrl}
                              alt={blogTitle}
                              className="w-full h-64 object-cover"
                              onError={(e) => {
                                e.currentTarget.src = getPlaceholderImage(blogTitle);
                              }}
                            />
                            {blogCategory && (
                              <div className="absolute bottom-3 left-3">
                                <span className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                  {blogCategory}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="lg:w-3/5">
                          <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                            <Link to={`/blog/${blogSlug}`} className="hover:no-underline hover:text-gray-900">
                              {blogTitle}
                            </Link>
                          </h2>

                          <p className="text-gray-600 mb-6 leading-relaxed">
                            {blogExcerpt}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className="text-gray-500 text-sm">
                              {blogDate}
                            </span>
                            <Link
                              to={`/blog/${blogSlug}`}
                              className="text-gray-700 hover:text-gray-900 font-medium text-sm flex items-center"
                            >
                              Read More
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {index < blogs.length - 1 && (
                        <div className="mt-10 pt-10 border-t border-gray-200"></div>
                      )}
                    </article>
                  );
                })
              )}
            </div>

            {!loading && blogs.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No blog posts found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {selectedCategory || selectedTag || activeSearch 
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Check back soon for new articles and insights.'}
                </p>
                {(selectedCategory || selectedTag || activeSearch) && (
                  <button
                    onClick={handleResetFilters}
                    className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {!infiniteScroll && !loading && page < pages && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => {
                    setPage(prev => prev + 1);
                    setLoadingMore(true);
                  }}
                  disabled={loadingMore}
                  className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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

            {showPagination && !infiniteScroll && pages > 1 && (
              <div className="mt-16">
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 text-sm">
                    Page {page} of {pages}
                  </div>
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
                            className={`w-8 h-8 rounded text-sm font-medium ${
                              page === pageNum
                                ? 'bg-gray-900 text-white'
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
                      className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-8">
              {/* Search - Simplified */}
              <div className="mb-12">
                <form onSubmit={handleSearch} className="max-w-md">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      // Just updates local input state, doesn't trigger load
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      placeholder="Search blog posts..."
                      className="flex-1 px-2 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 text-base"
                    />
                    <button
                      type="submit"
                      className="bg-gray-900 text-white px-6 py-1 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                    >
                      Search
                    </button>
                  </div>
                </form>
              </div>

              {/* Recent Posts Widget */}
              <div className="mb-10">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                  RECENT POSTS
                </h3>
                <ul className="space-y-5">
                  {recentPosts.map((post) => {
                    const postTitle = post.title || post.Title || 'Untitled Blog';
                    const postSlug = getCleanSlug(post);
                    
                    return (
                      <li key={post._id}>
                        <Link 
                          to={`/blog/${postSlug}`}
                          className="text-gray-900 hover:text-gray-700 font-medium leading-tight block hover:no-underline"
                        >
                          {postTitle}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-8 pt-6 border-t border-gray-200"></div>
              </div>

              {/* Categories Widget */}
              {categories.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                    CATEGORIES
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => setSelectedCategory('')}
                        className={`text-left w-full py-2 px-3 rounded text-sm ${
                          !selectedCategory ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        All Categories
                      </button>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat._id}>
                        <button
                          onClick={() => setSelectedCategory(cat._id)}
                          className={`text-left w-full py-2 px-3 rounded text-sm flex justify-between items-center ${
                            selectedCategory === cat._id ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <span>{cat._id}</span>
                          <span className="text-gray-400 text-xs">
                            ({cat.count})
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags Widget */}
              {tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                    TAGS
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTag('')}
                      className={`px-3 py-1.5 rounded text-sm ${
                        !selectedTag ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {tags.slice(0, 8).map((tag) => (
                      <button
                        key={tag._id}
                        onClick={() => setSelectedTag(tag._id)}
                        className={`px-3 py-1.5 rounded text-sm ${
                          selectedTag === tag._id 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag._id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogList;