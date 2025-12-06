// src/components/blog/SingleBlog.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { blogService, Blog } from '../admin/services/blogService';
import { getImageUrl, getPlaceholderImage } from '../utils/imageUtils';
import { ShareButtons } from './ShareButtons';
import '../style.css';

const SingleBlog: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (slug) {
      loadBlog();
    }
  }, [slug]);

  const loadBlog = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Loading blog with slug:', slug); // Debug
      
      const response = await blogService.getBlogBySlug(slug!);
      
      console.log('📦 API Response:', response); // Debug
      
      if (response.success) {
        console.log('✅ Blog loaded successfully:', response.data); // Debug
        setBlog(response.data);
        setRelatedBlogs(response.data.related_blogs || []);
        
        // Update URL if slug changed
        const currentSlug = response.data.slug || response.data.Slug;
        if (currentSlug && currentSlug !== slug) {
          navigate(`/blog/${currentSlug}`, { replace: true });
        }
      } else {
        setError('Failed to load blog data');
      }
    } catch (err: any) {
      console.error('❌ Load error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.status === 404) {
        setError('Blog not found. It may have been removed or unpublished.');
      } else {
        setError(err.message || 'Failed to load blog');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  // Function to safely render HTML
  const createMarkup = (html: string) => {
    if (!html) return { __html: '' };
    
    // Clean HTML before rendering
    const cleanHtml = html
      .replace(/^```html\s*/i, '')
      .replace(/```$/g, '')
      .trim();
    
    return { __html: cleanHtml };
  };

  // Generate table of contents from HTML headings
  const generateTableOfContents = (html: string) => {
    if (!html) return [];
    
    const headings = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const headingElements = tempDiv.querySelectorAll('h1, h2, h3');
    
    headingElements.forEach((heading, index) => {
      if (heading.textContent && heading.textContent.trim()) {
        const id = `heading-${index}`;
        heading.id = id;
        
        headings.push({
          id,
          text: heading.textContent.trim(),
          level: heading.tagName
        });
      }
    });
    
    return headings.slice(0, 5); // Limit to 5 headings
  };

  if (loading) {
    return <BlogDetailSkeleton />;
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Blog Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The blog you are looking for does not exist or has been removed.'}
          </p>
          <div className="space-x-4">
            <Link
              to="/blog"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              View All Blogs
            </Link>
            <button
              onClick={loadBlog}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayTitle = blog.title || blog.Title || 'Untitled Blog';
  const displayContent = blog.html || blog.Html || '';
  const displayMetaTags = blog.meta_tags || blog['Meta-tags'] || '';
  const displayCategory = blog.category?.[0] || blog.Category || 'Uncategorized';
  const displayTags = blog.tags || blog.Tags || [];
  const displayAuthor = blog.author || 'Admin';
  const displayDate = formatDate(blog.published_at || blog.created_at);
  const tableOfContents = generateTableOfContents(displayContent);
  
  // Create excerpt for SEO
  const getExcerpt = () => {
    if (displayMetaTags && displayMetaTags.trim()) {
      return displayMetaTags.substring(0, 160);
    }
    if (displayContent) {
      const text = displayContent.replace(/<[^>]*>/g, '');
      return text.substring(0, 160) + (text.length > 160 ? '...' : '');
    }
    return 'Read this informative blog post about ' + displayCategory;
  };

  const seoExcerpt = getExcerpt();
  const seoKeywords = displayTags.length > 0 ? displayTags.join(', ') : displayCategory;
  const currentUrl = window.location.href;
  const imageUrl = blog.image_url ? getImageUrl(blog.image_url) : getPlaceholderImage(displayTitle);
  const siteName = 'Your Blog Name'; // Replace with your actual site name
  const twitterHandle = '@yourhandle'; // Replace with your Twitter handle

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{displayTitle} | {siteName}</title>
        <meta name="description" content={seoExcerpt} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="author" content={displayAuthor} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={displayTitle} />
        <meta property="og:description" content={seoExcerpt} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="article:published_time" content={blog.published_at || blog.created_at} />
        <meta property="article:modified_time" content={blog.updated_at || blog.created_at} />
        <meta property="article:author" content={displayAuthor} />
        <meta property="article:section" content={displayCategory} />
        {displayTags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={twitterHandle} />
        <meta name="twitter:creator" content={twitterHandle} />
        <meta name="twitter:title" content={displayTitle} />
        <meta name="twitter:description" content={seoExcerpt} />
        <meta name="twitter:image" content={imageUrl} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={currentUrl} />
        
        {/* Additional Meta */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Structured Data / Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": displayTitle,
            "description": seoExcerpt,
            "image": imageUrl,
            "author": {
              "@type": "Person",
              "name": displayAuthor
            },
            "publisher": {
              "@type": "Organization",
              "name": siteName,
              "logo": {
                "@type": "ImageObject",
                "url": `${window.location.origin}/logo.png`
              }
            },
            "datePublished": blog.published_at || blog.created_at,
            "dateModified": blog.updated_at || blog.created_at,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": currentUrl
            },
            "wordCount": displayContent ? displayContent.split(/\s+/).length : 0,
            "timeRequired": `PT${blog.reading_time || 5}M`,
            "articleSection": displayCategory,
            "keywords": seoKeywords
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="max-w-5xl">
              {/* Category */}
              {displayCategory && displayCategory !== 'Uncategorized' && (
                <div className="mb-4">
                  <Link
                    to={`/blog/category/${displayCategory.toLowerCase().replace(/\s+/g, '-')}`}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                  >
                    {displayCategory}
                  </Link>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {displayTitle}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm mb-8">
                {displayAuthor && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>{displayAuthor}</span>
                  </div>
                )}
                {displayDate && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{displayDate}</span>
                  </div>
                )}
                {blog.reading_time && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{blog.reading_time} min read</span>
                  </div>
                )}
              </div>

              {/* Featured Image */}
              {blog.image_url && (
                <div className="mb-8 rounded-xl overflow-hidden shadow-2xl">
                  <img
                    src={getImageUrl(blog.image_url)}
                    alt={displayTitle}
                    className="w-full h-96 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getPlaceholderImage(displayTitle);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Article Content */}
            <div className="lg:col-span-2">
              {/* Share Buttons */}
              <div className="mb-8">
                <ShareButtons 
                  title={displayTitle}
                  url={currentUrl}
                  description={seoExcerpt}
                />
              </div>

              {/* Blog Content */}
              <article className="prose prose-lg max-w-none bg-white rounded-xl shadow-sm p-8">
                {/* Meta Description */}
                {displayMetaTags && displayMetaTags.trim() && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                    <p className="text-gray-700 italic">{displayMetaTags}</p>
                  </div>
                )}

                {/* Render HTML Content */}
                <div 
                  className="blog-content"
                  dangerouslySetInnerHTML={createMarkup(displayContent)}
                />
              </article>

              {/* Tags */}
              {displayTags.length > 0 && (
                <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {displayTags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 flex justify-between items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Blogs
                </button>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex items-center text-gray-600 hover:text-gray-800"
                >
                  Back to Top
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Author Card */}
              {displayAuthor && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {displayAuthor.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{displayAuthor}</h3>
                      <p className="text-sm text-gray-600">Blog Author</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    {displayAuthor} is an experienced writer sharing insights and knowledge on various topics.
                  </p>
                </div>
              )}

              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h3>
                  <nav className="space-y-2">
                    {tableOfContents.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className="block text-blue-600 hover:text-blue-800 text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(heading.id);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Related Blogs */}
              {relatedBlogs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Articles</h3>
                  <div className="space-y-4">
                    {relatedBlogs.map((related) => {
                      const relatedTitle = related.title || related.Title || 'Untitled';
                      const relatedSlug = related.slug || related.Slug;
                      const relatedDate = formatDate(related.published_at || related.created_at);
                      
                      return (
                        <Link
                          key={related._id}
                          to={`/blog/${relatedSlug}`}
                          className="block group"
                        >
                          <div className="flex items-start space-x-3">
                            {related.image_url && (
                              <img
                                src={getImageUrl(related.image_url)}
                                alt={relatedTitle}
                                className="w-16 h-16 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = getPlaceholderImage(relatedTitle);
                                }}
                              />
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                                {relatedTitle}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {relatedDate}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Newsletter Subscription */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-sm p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
                <p className="text-blue-100 mb-4">
                  Subscribe to our newsletter for the latest blog posts and updates.
                </p>
                <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-blue-200 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Skeleton loader for blog detail
const BlogDetailSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Hero Skeleton */}
    <div className="bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="max-w-3xl">
          <div className="h-8 bg-blue-500/30 rounded w-32 mb-6 animate-pulse"></div>
          <div className="h-12 bg-white/20 rounded mb-4 animate-pulse"></div>
          <div className="h-12 bg-white/20 rounded mb-4 w-3/4 animate-pulse"></div>
          <div className="flex gap-4 mb-8">
            <div className="h-4 bg-white/20 rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-white/20 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-96 bg-blue-500/30 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default SingleBlog;