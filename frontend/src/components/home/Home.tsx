import React from 'react';
import { Helmet } from 'react-helmet-async';
import CategoryHighlights from './CategoryHighlights';
import FeaturedProducts from './FeaturedProducts';
import BestSellers from './BestSellers';
import DealsSection from './DealsSection';
import PcBuilderPromo from './PcBuilderPromo';
import FeaturedBrands from './FeaturedBrands';
import Testimonials from './Testimonials';
import BlogSection from './BlogSection';
import HomePage from './FetchBrandsAndCategories';
import HeroSection from '../heroSection/HeroSection';
import ProductShowcaseContainer from '../showcase/ProductShowcaseContainer';
import InstagramReels from './InstagramReels';
import VideoSectionsPage from '../video/VideoSectionsPage';
import PCPackageSection from './PCPackageSection';
import HomeLatestNews from './HomeLatestNews';
import TrustedBrandsSection from './TrustedBrandsSection';
import PreBuildSection from './PreBuildSection';
import YTVideoSection from './YTVideoSlider';
const App: React.FC = () => {
  // Business Details Constants
  const companyName = "iTech Computers";
  const siteUrl = "https://itechcomputers.shop/";
  const phoneNumber = "+91 63829 28973";
  const emailAddress = "itechcomputersno7@gmail.com";
  
  // SEO Strings
  const pageTitle = "iTech Computers | Best Custom PC Builder & Computer Shop in Salem";
  const pageDescription = "Visit iTech Computers at RBT Mall, Salem for the best custom gaming PCs, laptops, and accessories. Call +91 63829 28973 for deals on top tech brands.";
  
  // Placeholder for your Open Graph image
  const ogImage = `${siteUrl}og-home-banner.png`; 

  // Structured Data (LocalBusiness/ComputerStore Schema)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ComputerStore", 
    "name": companyName,
    "image": [ogImage],
    "description": pageDescription,
    "url": siteUrl,
    "telephone": phoneNumber,
    "email": emailAddress,
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "RBT Mall, Meyyanur Bypass Rd, opp. to iplanet",
      "addressLocality": "Meyyanur, Salem",
      "addressRegion": "Tamil Nadu",
      "postalCode": "636004",
      "addressCountry": "IN"
    },
    // Coordinates for RBT Mall, Salem
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "11.6663", 
      "longitude": "78.1465" 
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "09:30",
        "closes": "21:30"
      }
    ],
    "sameAs": [
      "https://www.instagram.com/iteckno7?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      "https://www.facebook.com/prithiv.raj.262802?mibextid=ZbWKwL"
    ]
  };

  return (
    <div className="bg-white font-sans">
      <Helmet>
        {/* Basic SEO */}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={siteUrl} />
        <meta name="keywords" content="iTech Computers Salem, Custom PC Build Salem, Computer Shop RBT Mall, Gaming PC Tamil Nadu, Computer Accessories Salem" />

        {/* Open Graph (Facebook/WhatsApp/LinkedIn) */}
        <meta property="og:type" content="business.business" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content="Your one-stop shop for Custom PCs and Tech in Salem. Located opp. iplanet, RBT Mall." />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content={companyName} />
        
        {/* Contact Specific OG Tags */}
        <meta property="business:contact_data:street_address" content="RBT Mall, Meyyanur Bypass Rd" />
        <meta property="business:contact_data:locality" content="Salem" />
        <meta property="business:contact_data:region" content="Tamil Nadu" />
        <meta property="business:contact_data:postal_code" content="636004" />
        <meta property="business:contact_data:country_name" content="India" />
        <meta property="business:contact_data:email" content={emailAddress} />
        <meta property="business:contact_data:phone_number" content={phoneNumber} />
        
        {/* Location Geo Tags for Social Maps */}
        <meta property="place:location:latitude" content="11.6663" />
        <meta property="place:location:longitude" content="78.1465" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />

        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* Main Content */}
      <section id="home-hero">
      <HeroSection />
      </section>
      <main>
        <ProductShowcaseContainer
            className="container mx-auto px-4"
          />
        <HomePage />
        {/* <DealsSection /> */}
        <PcBuilderPromo />
        <PreBuildSection />
        {/* <PCPackageSection /> */}
        <VideoSectionsPage />
        
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* <InstagramReels 
              autoPlay={true}
              showThumbnails={true}
              className="rounded-xl shadow-2xl"
            /> */}
          </div>
        </section>

        <TrustedBrandsSection />
        <HomeLatestNews />
        <YTVideoSection />
      </main>
    </div>
  );
};

export default App;