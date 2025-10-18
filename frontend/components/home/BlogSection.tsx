
import React from 'react';

const blogPosts = [
  {
    title: 'The Ultimate Guide to Choosing the Right GPU in 2024',
    excerpt: 'NVIDIA vs. AMD vs. Intel - we break down the latest graphics cards to help you find the perfect fit for your rig.',
    imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=GPU+Guide',
    href: '#',
  },
  {
    title: '5 Essential Tips for Your First Custom PC Build',
    excerpt: 'Building your own PC can be rewarding. Here are five crucial tips to ensure your first build is a success.',
    imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=PC+Build+Tips',
    href: '#',
  },
  {
    title: 'How to Optimize Your PC for Maximum Gaming Performance',
    excerpt: 'Unlock the full potential of your gaming PC with these software tweaks and hardware optimizations.',
    imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=Gaming+Perf',
    href: '#',
  },
];

const BlogSection: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">From Our Blog</h2>
          <p className="text-gray-600 mt-2">Get the latest tech tips, news, and build guides from our experts.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <div key={post.title} className="bg-white rounded-lg shadow-md overflow-hidden group">
              <a href={post.href} className="block">
                <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                  <p className="text-gray-600 mt-2 text-sm">{post.excerpt}</p>
                  <span className="inline-block mt-4 text-blue-600 font-semibold group-hover:underline">
                    Read More &rarr;
                  </span>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
