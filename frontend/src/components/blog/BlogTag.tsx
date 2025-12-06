// src/components/blog/BlogTag.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import BlogList from './BlogList';

const BlogTag: React.FC = () => {
  const { tag } = useParams<{ tag: string }>();
  
  // Convert URL slug back to readable format
  const displayTag = tag 
    ? tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BlogList tag={displayTag} />
    </div>
  );
};

export default BlogTag;