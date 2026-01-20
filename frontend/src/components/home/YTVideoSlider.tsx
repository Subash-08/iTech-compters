import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play } from "lucide-react"; 
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ytVideoService } from "../admin/services/ytVideoService";
import { YTVideoItem } from "../admin/types/ytVideo";

const NextArrow = ({ onClick, className, style }: any) => (
  <div
    className={`${className} !bg-slate-800 !rounded-full !w-10 !h-10 !flex !items-center !justify-center !right-[-15px] md:!right-[-25px] z-10 hover:!bg-slate-700 transition-colors shadow-lg`}
    style={{ ...style }}
    onClick={onClick}
  />
);

const PrevArrow = ({ onClick, className, style }: any) => (
  <div
    className={`${className} !bg-slate-800 !rounded-full !w-10 !h-10 !flex !items-center !justify-center !left-[-15px] md:!left-[-25px] z-10 hover:!bg-slate-700 transition-colors shadow-lg`}
    style={{ ...style }}
    onClick={onClick}
  />
);

const YTVideoSection = () => {
  const [videos, setVideos] = useState<YTVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
        try {
            const response = await ytVideoService.getVideos();
            setVideos(response.data);
        } catch (error) {
            console.error("Failed to fetch videos", error);
        } finally {
            setLoading(false);
        }
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedVideo(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const settings = {
    dots: false,
    infinite: videos.length > 4,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1536, settings: { slidesToShow: 4 } },
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1, centerMode: true, centerPadding: '20px' } }
    ],
  };

  if (loading) return null;
  if (videos.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#E0F7FA] overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1600px]">
        
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-4 md:mb-5 uppercase"
          >
            LATEST <span className="text-slate-400">TECH REVIEWS</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-slate-500 font-medium text-base sm:text-lg md:text-xl leading-relaxed"
          >
            Watch our in-depth analysis, performance benchmarks, and honest opinions on the latest gaming gear.
          </motion.p>
        </div>

        <div className="px-4">
          <Slider {...settings} className="-mx-3">
            {videos.map((video) => (
              <div key={video._id} className="px-3 pb-6 pt-2">
                <div 
                  onClick={() => setSelectedVideo(video.videoId)}
                  className="group bg-white rounded-2xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer h-full flex flex-col"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                      <div className="w-14 h-9 bg-[#FF0000] rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-5 h-5 text-white fill-current ml-1" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex-grow">
                    <h3 className="text-slate-900 font-bold text-sm leading-snug line-clamp-2 group-hover:text-blue-500 transition-colors">
                      {video.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>

      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setSelectedVideo(null)}
          >
            <button 
              className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:text-red-500 transition-colors z-50 p-2"
              onClick={() => setSelectedVideo(null)}
            >
              <X size={40} />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`}
                title="YouTube video player"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default YTVideoSection;