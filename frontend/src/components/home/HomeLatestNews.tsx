// src/components/home/HomeLatestNews.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService, Blog } from '../admin/services/blogService'; // Adjust path relative to your project structure
import { getImageUrl, getPlaceholderImage } from '../utils/imageUtils'; // Adjust path relative to your project structure
import { ArrowRight, Calendar } from 'lucide-react';

const HomeLatestNews: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchLatestBlogs = async () => {
      try {
        setLoading(true);
        // Fetch exactly 5 posts for the layout (1 big + 4 small)
        const response = await blogService.getPublishedBlogs({
          limit: 5,
          sort: '-published_at'
        });
        
        if (response.success) {
          setBlogs(response.data);
        }
      } catch (err: any) {
        console.error('Failed to load home blogs:', err);
        setError('Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestBlogs();
  }, []);

  // --- Helpers ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getBlogImageUrl = (blog: Blog) => {
    if (blog.image_url) {
      return getImageUrl(blog.image_url);
    }
    return getPlaceholderImage(blog.title || 'Blog');
  };

  const getCleanSlug = (blog: Blog) => {
    const slug = blog.slug || '';
    return slug.toString().replace(/\n/g, '').trim();
  };

  const getCategory = (blog: Blog) => {
    // Handle array or string category structure
    if (Array.isArray(blog.category)) return blog.category[0];
    return blog.category || 'News';
  };

  if (loading) {
    return (
      <div className="max-w-[85rem] mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
           <div className="h-8 bg-gray-200 w-48 rounded"></div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="h-96 bg-gray-200 rounded-xl"></div>
             <div className="grid grid-cols-2 gap-6">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
               ))}
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (error || blogs.length === 0) return null;

  // Split data: First item is "Featured", rest are "Grid"
  const featuredPost = blogs[0];
  const sidePosts = blogs.slice(1, 5);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- Header --- */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-5xl font-black uppercase tracking-tight">
            <span className="text-blue-500">LATEST</span> <span className="text-gray-900">NEWS</span>
          </h2>
          <Link 
            to="/blogs" 
            className="text-xs font-bold text-gray-800 hover:text-blue-500 uppercase tracking-wide flex items-center transition-colors"
          >
            View All Post
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        {/* --- Layout Content --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: Featured Big Post */}
          <div className="flex flex-col h-full group">
            <Link to={`/blog/${getCleanSlug(featuredPost)}`} className="block overflow-hidden rounded-xl relative mb-4">
              <img 
                src={getBlogImageUrl(featuredPost)} 
                alt={featuredPost.title} 
                className="w-full aspect-video object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              {/* Floating Badge */}
              <span className="absolute bottom-4 left-4 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-sm shadow-sm">
                {getCategory(featuredPost)}
              </span>
            </Link>
            
            <div className="flex flex-col flex-1">
              <Link to={`/blog/${getCleanSlug(featuredPost)}`}>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                  {featuredPost.title}
                </h3>
              </Link>
              
              <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                 {/* Strip HTML and limit length */}
                 {featuredPost.meta_tags || featuredPost.html?.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
              </p>

              <div className="mt-auto flex items-center justify-between pt-2">
                 <span className="text-xs font-bold text-gray-400 uppercase">
                    {formatDate(featuredPost.published_at || featuredPost.created_at)}
                 </span>
                 <Link 
                    to={`/blog/${getCleanSlug(featuredPost)}`} 
                    className="text-xs font-bold text-gray-900 uppercase flex items-center hover:text-blue-600 transition-colors"
                 >
                    Read More <ArrowRight className="w-3 h-3 ml-1 text-blue-500" />
                 </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Grid of Smaller Posts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
            {sidePosts.map((post) => (
              <div key={post._id} className="group flex flex-col">
                <Link to={`/blog/${getCleanSlug(post)}`} className="block overflow-hidden rounded-xl relative mb-3">
                   <img 
                     src={getBlogImageUrl(post)} 
                     alt={post.title} 
                     className="w-full aspect-[4/3] object-cover transform group-hover:scale-105 transition-transform duration-500"
                   />
                   {/* Badge Overlapping Image Bottom */}
                   <span className="absolute bottom-3 left-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm shadow-sm">
                      {getCategory(post)}
                   </span>
                </Link>
                
                <Link to={`/blog/${getCleanSlug(post)}`}>
                  <h4 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h4>
                </Link>
              </div>
            ))}
            
            {/* If fewer than 5 posts, this grid will just naturally show what is available */}
          </div>

        </div>
      </div>
    </section>
  );
};

export default HomeLatestNews;