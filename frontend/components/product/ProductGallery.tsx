import React, { useState } from "react";

interface Image {
  url: string;
  alt?: string;
  _id?: string;
}

interface ProductGalleryProps {
  images: Image[];
  thumbnail: string;
  hoverImage?: string;
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  thumbnail,
  hoverImage,
  productName,
}) => {
  const [selectedImage, setSelectedImage] = useState(thumbnail || images[0]?.url);

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative w-full aspect-square overflow-hidden rounded-2xl border bg-gray-50">
        <img
          src={selectedImage}
          alt={productName}
          className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* Thumbnail images */}
      <div className="flex gap-3 justify-center">
        {[thumbnail, hoverImage, ...images.map(i => i.url)].filter(Boolean).map((img, i) => (
          <img
            key={i}
            src={img!}
            onClick={() => setSelectedImage(img!)}
            className={`w-20 h-20 rounded-xl cursor-pointer object-cover border-2 ${
              selectedImage === img ? "border-green-500" : "border-transparent"
            } hover:border-green-400 transition`}
            alt={`Thumbnail ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
