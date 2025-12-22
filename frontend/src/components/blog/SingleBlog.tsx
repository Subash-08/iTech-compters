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

  // --- 1. SEO Configuration ---
  const SITE_URL = "https://itechcomputers.shop"; // ✅ Ensure this is your actual domain
  const SITE_NAME = "iTech Computers";
  const TWITTER_HANDLE = "@itechcomputers"; 

  useEffect(() => {
    if (slug) {
      loadBlog();
    }
  }, [slug]);

  const loadBlog = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await blogService.getBlogBySlug(slug!);
      
      if (response.success) {
        setBlog(response.data);
        setRelatedBlogs(response.data.related_blogs || []);
        
        // Canonical Redirection if slug mismatch
        const currentSlug = response.data.slug || response.data.Slug;
        if (currentSlug && currentSlug !== slug) {
          navigate(`/blog/${currentSlug}`, { replace: true });
        }
      } else {
        setError('Failed to load blog data');
      }
    } catch (err: any) {
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

  // Helper to ensure absolute URLs for SEO tags
  const getAbsoluteUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const createMarkup = (html: string) => {
    if (!html) return { __html: '' };
    const cleanHtml = html
      .replace(/^```html\s*/i, '')
      .replace(/```$/g, '')
      .trim();
    return { __html: cleanHtml };
  };

  const generateTableOfContents = (html: string) => {
    if (!html) return [];
    const headings: any[] = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const headingElements = tempDiv.querySelectorAll('h2, h3'); // Reduced to h2/h3 for cleaner TOC
    
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
    return headings.slice(0, 5);
  };

  if (loading) return <BlogDetailSkeleton />;

  if (error || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        {/* Error UI kept same as your code */}
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Blog Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The blog does not exist.'}</p>
          <div className="space-x-4">
            <Link to="/blog" className="bg-blue-600 text-white px-6 py-2 rounded-lg">View All Blogs</Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Data Preparation ---
  const displayTitle = blog.title || blog.Title || 'Untitled Blog';
  const displayContent = blog.html || blog.Html || '';
  const displayMetaTags = blog.meta_tags || blog['Meta-tags'] || '';
  const displayCategory = blog.category?.[0] || blog.Category || 'Tech';
  const displayTags = blog.tags || blog.Tags || [];
  const displayAuthor = blog.author || 'iTech Team';
  const displayDate = blog.published_at || blog.created_at;
  const tableOfContents = generateTableOfContents(displayContent);
  
  // SEO Logic
  const seoExcerpt = displayMetaTags ? displayMetaTags.substring(0, 160) : displayContent.replace(/<[^>]*>/g, '').substring(0, 160) + '...';
  const seoKeywords = displayTags.length > 0 ? displayTags.join(', ') : displayCategory;
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;
  const relativeImageUrl = blog.image_url ? getImageUrl(blog.image_url) : getPlaceholderImage(displayTitle);
  const absoluteImageUrl = getAbsoluteUrl(relativeImageUrl);

  // --- 2. Advanced Schema (Breadcrumbs + BlogPosting) ---
  const jsonLdSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": displayTitle,
      "description": seoExcerpt,
      "image": absoluteImageUrl,
      "author": { "@type": "Person", "name": displayAuthor },
      "publisher": {
        "@type": "Organization",
        "name": SITE_NAME,
        "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.png` }
      },
      "datePublished": displayDate,
      "dateModified": blog.updated_at || displayDate,
      "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
      "articleSection": displayCategory
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/blog` },
        { "@type": "ListItem", "position": 3, "name": displayCategory, "item": `${SITE_URL}/blog/category/${displayCategory.toLowerCase()}` },
        { "@type": "ListItem", "position": 4, "name": displayTitle, "item": canonicalUrl }
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>{displayTitle} | {SITE_NAME}</title>
        <meta name="description" content={seoExcerpt} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="author" content={displayAuthor} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={displayTitle} />
        <meta property="og:description" content={seoExcerpt} />
        <meta property="og:image" content={absoluteImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={TWITTER_HANDLE} />
        <meta name="twitter:title" content={displayTitle} />
        <meta name="twitter:description" content={seoExcerpt} />
        <meta name="twitter:image" content={absoluteImageUrl} />

        {/* JSON-LD Injection */}
        {jsonLdSchemas.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white relative">
          <div className="max-w-6xl mx-auto px-2 py-6 relative z-10">
            {/* 3. Visual Breadcrumbs (Great for UX & SEO) */}
            <nav className="flex items-center text-sm text-blue-100 mb-2 space-x-2">
                <Link to="/" className="hover:text-white">Home</Link>
                <span>/</span>
                <Link to="/blogs" className="hover:text-white">Blogs</Link>
                <span>/</span>
                <span className="text-white font-medium truncate max-w-[200px]">{displayTitle}</span>
            </nav>

            <div className="max-w-5xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {displayTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm mb-8">
                 {/* Author & Date metadata (Kept same as original) */}
                 <div className="flex items-center">
                    <span className="mx-2">•</span>
                    <span>{formatDate(displayDate)}</span>
                 </div>
              </div>

              {blog.image_url && (
                <div className="mb-8 rounded-xl overflow-hidden shadow-2xl border-4 border-white/10">
                  <img
                    src={relativeImageUrl}
                    alt={`${displayTitle} - Featured Image`} // Better Alt Text
                    className="w-full h-96 object-cover"
                    loading="eager" // Load hero image immediately
                    onError={(e) => { e.currentTarget.src = getPlaceholderImage(displayTitle); }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Article Column */}
            <main className="lg:col-span-8">
              <div className="mb-8">
                <ShareButtons title={displayTitle} url={canonicalUrl} description={seoExcerpt} />
              </div>

              <article className="prose prose-lg max-w-none bg-white rounded-xl shadow-sm p-8 border border-gray-100">
                {/* Render Content */}
                <div 
                  className="blog-content font-sans text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={createMarkup(displayContent)}
                />
              </article>

              {/* Tags Section */}
              {displayTags.length > 0 && (
                <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Related Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {displayTags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                        className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 text-sm font-medium"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Navigation Footer */}
              <div className="mt-8 flex justify-between items-center">
                 <button onClick={() => navigate('/blog')} className="text-blue-600 font-medium hover:underline">← Back to Blog</button>
              </div>
            </main>

            {/* Sidebar Column - Semantic ASIDE tag */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-4">
              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Table of Contents</h3>
                  <nav className="space-y-3">
                    {tableOfContents.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className="block text-gray-600 hover:text-blue-600 text-sm transition-colors pl-2 border-l-2 border-transparent hover:border-blue-500"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Related Blogs Widget */}
              {relatedBlogs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">You might also like</h3>
                  <div className="space-y-6">
                    {relatedBlogs.map((related) => {
                      const relatedSlug = related.slug || related.Slug;
                      return (
                        <Link key={related._id} to={`/blog/${relatedSlug}`} className="block group">
                          <div className="flex gap-4">
                             {related.image_url && (
                               <img 
                                 src={getImageUrl(related.image_url)} 
                                 alt={related.title}
                                 className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                               />
                             )}
                             <div>
                               <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2 leading-snug">
                                 {related.title || related.Title}
                               </h4>
                               <span className="text-xs text-gray-500 mt-2 block">
                                  Read Article →
                               </span>
                             </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>
            </aside>

          </div>
        </div>
      </div>
    </>
  );
};

const BlogDetailSkeleton = () => (
    /* Skeleton logic remains the same */
    <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-96 bg-gray-300 w-full mb-8"></div>
        <div className="max-w-6xl mx-auto px-4">
            <div className="h-8 bg-gray-300 w-3/4 mb-4 rounded"></div>
            <div className="h-4 bg-gray-300 w-1/2 mb-12 rounded"></div>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="h-4 bg-gray-300 w-full rounded"></div>
                    <div className="h-4 bg-gray-300 w-full rounded"></div>
                    <div className="h-4 bg-gray-300 w-5/6 rounded"></div>
                </div>
                <div className="h-64 bg-gray-300 rounded"></div>
            </div>
        </div>
    </div>
);

export default SingleBlog;