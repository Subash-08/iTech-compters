import React from "react";

interface ManufacturerSlide {
  imageUrl: string;
  caption?: string;
}

interface ManufacturerSection {
  title: string;
  description: string;
  slides: ManufacturerSlide[];
}

interface ManufacturerInfoProps {
  fromManufacturer: ManufacturerSection[];
}

export const ManufacturerInfo: React.FC<ManufacturerInfoProps> = ({
  fromManufacturer,
}) => {
  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-semibold text-gray-900">From the Manufacturer</h2>
      {fromManufacturer.map((section, i) => (
        <div key={i} className="space-y-4">
          <h3 className="text-xl font-semibold text-green-600">{section.title}</h3>
          <p className="text-gray-700">{section.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.slides.map((slide, j) => (
              <div
                key={j}
                className="rounded-xl overflow-hidden border bg-gray-50 shadow-sm"
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.caption || section.title}
                  className="w-full h-56 object-cover"
                />
                {slide.caption && (
                  <p className="text-sm p-3 text-gray-600">{slide.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
