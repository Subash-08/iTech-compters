// src/components/blog/BlogCategory.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import BlogList from './BlogList';

const BlogCategory: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  
  // Convert URL slug back to readable format
  const displayCategory = category 
    ? category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BlogList category={displayCategory} />
    </div>
  );
};

export default BlogCategory;