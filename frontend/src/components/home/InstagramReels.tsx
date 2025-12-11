import React, { useState, useEffect, useRef } from 'react';

// --- Types ---
interface ReelData {
  id: string;
  url: string;
  username: string;
  avatar: string;
  thumbnail: string;
  likes: string;
  caption: string;
  isVideo: boolean;
  loading: boolean;
}

// --- Configuration ---
// You can use the free Microlink API for testing. 
// For production, you may need a paid API key from microlink.io or iframely.com
const API_ENDPOINT = "https://api.microlink.io";

const InstagramReels: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 1. INPUT: Just the raw Instagram Links here!
  const reelLinks = [
    "https://www.instagram.com/reel/DJb1baQTZFO/", 
    "https://www.instagram.com/reel/DKR9Ul-TlEd/",
    "https://www.instagram.com/reel/C_X-WJEyc5j/",
    "https://www.instagram.com/reel/C8o-DeTyOtQ/"
  ];

  const [reels, setReels] = useState<ReelData[]>([]);

  // 2. FETCH: Automatically get data from the links
  useEffect(() => {
    const fetchReelData = async () => {
      const promises = reelLinks.map(async (url, index) => {
        try {
          // We use Microlink to "scrape" the metadata securely
          const response = await fetch(`${API_ENDPOINT}/?url=${encodeURIComponent(url)}&palette=true`);
          const data = await response.json();
          const meta = data.data;

          return {
            id: index.toString(),
            url: url,
            // Fallbacks in case the API hits a limit
            username: meta.author || "instagram_user",
            avatar: meta.logo?.url || "https://cdn-icons-png.flaticon.com/512/87/87390.png",
            thumbnail: meta.image?.url || "https://via.placeholder.com/350x450?text=No+Image", 
            caption: meta.description || "Check out this amazing reel on Instagram! #trending",
            isVideo: true,
            loading: false
          };
        } catch (error) {
          console.error("Error fetching reel:", error);
          // Return a fallback object if fetch fails
          return {
            id: index.toString(),
            url: url,
            username: "Error Loading",
            avatar: "",
            thumbnail: "",
            likes: "",
            caption: "Could not load data.",
            isVideo: false,
            loading: false
          };
        }
      });

      const results = await Promise.all(promises);
      setReels(results);
    };

    fetchReelData();
  }, []); // Run once on mount

  // --- Icons (Same as before) ---
  const Icons = {
    Heart: () => <svg className="w-6 h-6 text-gray-800 hover:text-gray-500 cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    Comment: () => <svg className="w-6 h-6 text-gray-800 hover:text-gray-500 cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    Share: () => <svg className="w-6 h-6 text-gray-800 hover:text-gray-500 cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    Bookmark: () => <svg className="w-6 h-6 text-gray-800 hover:text-gray-500 cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
    Play: () => <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white pl-1 shadow-lg"><svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div>,
  };

  return (
    <div className="w-full bg-white font-sans py-8">
      <div className="text-center mb-10">
        <h2 className="text-[#0095f6] text-4xl font-bold mb-2">Latest Reels</h2>
        <p className="text-gray-400 text-sm tracking-wide">Discover our latest content and updates</p>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto px-4 pb-10 gap-6 snap-x scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {reels.map((reel) => (
          <div key={reel.id} className="snap-center flex-shrink-0 w-[350px] bg-white border border-gray-300 rounded-[3px] flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <a href={reel.url} target="_blank" rel="noreferrer" className="flex items-center space-x-3 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px]">
                   {reel.loading ? (
                     <div className="w-full h-full bg-gray-200 rounded-full animate-pulse"></div>
                   ) : (
                     <img src={reel.avatar} alt={reel.username} className="w-full h-full rounded-full border border-white object-cover" />
                   )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 group-hover:underline">
                    {reel.loading ? "Loading..." : reel.username}
                  </span>
                  <span className="text-xs text-gray-500">Original audio</span>
                </div>
              </a>
              <a href={reel.url} target="_blank" rel="noreferrer" className="bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-semibold px-4 py-1.5 rounded-[4px] transition-colors">
                View profile
              </a>
            </div>

            {/* Thumbnail Image */}
            <a href={reel.url} target="_blank" rel="noreferrer" className="relative aspect-[4/5] bg-gray-100 group overflow-hidden block">
              {reel.loading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center text-gray-400">Loading Preview...</div>
              ) : (
                <>
                  <img src={reel.thumbnail} alt="Reel thumbnail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                    <Icons.Play />
                  </div>
                </>
              )}
            </a>

            {/* Footer */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex space-x-4">
                  <Icons.Heart />
                  <Icons.Comment />
                  <Icons.Share />
                </div>
                <Icons.Bookmark />
              </div>

              <div className="font-semibold text-sm text-gray-900 mb-2">{reel.likes}</div>
              <div className="text-sm text-gray-900 mb-2 leading-snug">
                <span className="font-semibold mr-2">{reel.username}</span>
                <span className="line-clamp-2">{reel.caption}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstagramReels;