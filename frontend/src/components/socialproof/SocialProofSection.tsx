import React, { useState, useEffect } from 'react';
import { Instagram } from 'lucide-react'; // Removed Youtube import, using custom SVG
import { socialProofService } from '../admin/services/socialProofService';
import { getImageUrl } from '../utils/imageUtils';

interface SocialProofData {
    isActive: boolean;
    backgroundColor: string;
    backgroundImage?: { url: string; altText: string };
    heading: string;
    illustrationImage?: { url: string; altText: string };
    google: { rating: number; label: string };
    instagram: { followers: string; label: string };
    youtube: { subscribers: string; label: string };
}

const SocialProofSection: React.FC = () => {
    const [data, setData] = useState<SocialProofData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await socialProofService.getSocialProof();
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch social proof data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading || !data || !data.isActive) return null;

    // Updated gradient to match the reference image's teal-to-green shift more closely
    const defaultBg = 'linear-gradient(90deg, #0c6674 0%, #10b981 100%)';

    const backgroundStyle = data.backgroundImage?.url
        ? {
            backgroundImage: `url(${getImageUrl(data.backgroundImage)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }
        : { background: data.backgroundColor || defaultBg };

    return (
        <section
            className="relative w-full overflow-hidden font-sans py-6 md:py-8 lg:py-4"
            style={{ ...backgroundStyle }}
        >
            {/* Overlay for readability if needed */}
            {data.backgroundImage?.url && (
                <div className="absolute inset-0 bg-teal-900/30 backdrop-blur-[1px]"></div>
            )}

            <div className="relative container mx-auto px-4">
                {/* Main Flex Container - Adjusted gap for tighter desktop layout */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-6">

                    {/* === LEFT SECTION: Typography & Illustration === */}
                    <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 xl:gap-8 shrink-0">

                        {/* Typography Group - Refined sizes and colors */}
                        <div className="flex flex-col uppercase leading-[0.9] tracking-wider z-10 shrink-0 select-none">
                            <span className="text-2xl md:text-3xl lg:text-4xl text-white font-light block">
                                JOIN OUR
                            </span>
                            <span className="text-3xl md:text-4xl lg:text-5xl text-white font-bold block mt-1">
                                THRIVING
                            </span>
                            {/* Darker text color to match reference cutout look */}
                            <span className="text-4xl md:text-5xl lg:text-[3.5rem] text-[#054950] font-extrabold block mt-1">
                                TRIBE
                            </span>
                        </div>

                        {/* Gamer Illustration */}
                        {data.illustrationImage?.url && (
                            <div className="relative w-36 h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 shrink-0 animate-fade-in-up md:-ml-4 lg:-ml-0">
                                <img
                                    src={getImageUrl(data.illustrationImage)}
                                    alt={data.illustrationImage.altText || "Gamer"}
                                    className="w-full h-full object-contain drop-shadow-xl"
                                />
                            </div>
                        )}
                    </div>

                    {/* === RIGHT SECTION: Stats Flow === */}
                    {/* Adjusted gap between stats items */}
                    <div className="flex flex-col md:flex-row items-center justify-center lg:justify-end gap-8 md:gap-12 lg:gap-16 w-full lg:w-auto">

                        {/* --- Google Stat --- */}
                        <div
                            onClick={() => window.open('https://share.google/eYKOp3ZNwf1tws95n', '_blank')}
                            className="flex items-center gap-4 group cursor-pointer hover:scale-105 transition-transform duration-300"
                        >
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-md shrink-0">
                                {/* Custom Multi-color Google 'G' SVG */}
                                <svg className="w-8 h-8 md:w-9 md:h-9" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </div>
                            <div className="text-white">
                                {/* Increased Font Size significantly */}
                                <div className="font-extrabold text-2xl md:text-3xl lg:text-4xl leading-none flex items-center gap-1">
                                    {data.google.rating} Stars
                                </div>
                                {/* Increased Label Size */}
                                <div className="text-base md:text-lg font-medium opacity-95 mt-1">{data.google.label}</div>
                            </div>
                        </div>

                        {/* --- Instagram Stat --- */}
                        <div
                            onClick={() => window.open('https://www.instagram.com/iteckno7', '_blank')}
                            className="flex items-center gap-4 group cursor-pointer hover:scale-105 transition-transform duration-300"
                        >
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-md shrink-0">
                                {/* Increased Icon size */}
                                <Instagram className="w-8 h-8 md:w-9 md:h-9 text-[#E1306C]" />
                            </div>
                            <div className="text-white">
                                {/* Increased Font Size */}
                                <div className="font-extrabold text-2xl md:text-3xl lg:text-4xl leading-none">
                                    {data.instagram.followers}
                                </div>
                                {/* Increased Label Size */}
                                <div className="text-base md:text-lg font-medium opacity-95 mt-1">{data.instagram.label}</div>
                            </div>
                        </div>

                        {/* --- YouTube Stat --- */}
                        <div
                            onClick={() => window.open('https://youtube.com', '_blank')}
                            className="flex items-center gap-4 group cursor-pointer hover:scale-105 transition-transform duration-300"
                        >
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                                {/* FIXED: Custom solid YouTube SVG instead of line icon */}
                                <svg className="w-full h-full" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
                                    <circle cx="12" cy="12" r="12" fill="white" /> {/* Optional: ensures white background if the container isn't perfect */}
                                    {/* The red rounded rectangle container */}
                                    <path fill="#FF0000" d="M19.615 3.184c-2.369-.148-12.861-.148-15.23 0-2.597.162-4.729 2.188-4.922 4.774-.166 2.218-.166 8.867 0 11.085.193 2.586 2.325 4.611 4.922 4.774 2.369.148 12.861.148 15.23 0 2.597-.162 4.729-2.188 4.922-4.774.166-2.218.166-8.867 0-11.085-.193-2.586-2.325-4.611-4.922-4.774z" />
                                    {/* The white play triangle */}
                                    <path fill="#FFF" d="M9.545 15.168l6.545-3.791-6.545-3.791z" />
                                </svg>
                            </div>
                            <div className="text-white">
                                {/* Increased Font Size */}
                                <div className="font-extrabold text-2xl md:text-3xl lg:text-4xl leading-none">
                                    {data.youtube.subscribers}
                                </div>
                                {/* Increased Label Size */}
                                <div className="text-base md:text-lg font-medium opacity-95 mt-1">{data.youtube.label}</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
            `}</style>
        </section>
    );
};

export default SocialProofSection;