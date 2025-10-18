import React from "react";

interface Specification {
  label: string;
  value: string;
  _id?: string; // Use this as the unique key
}

interface SpecificationSection {
  sectionTitle: string;
  specs: Specification[];
  // Assuming the section itself might also have an _id from the database
  _id?: string; 
}

interface ProductSpecificationsProps {
  specifications: SpecificationSection[];
}

export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({
  specifications,
}) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-gray-900">Specifications</h2>

      {specifications.map((section, i) => (
        <div
          // 💡 FIXED: Use section._id if available, otherwise fallback to index but log a warning
          key={section._id || i} 
          className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-600">
              {section.sectionTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {section.specs.map((spec, j) => (
                <div 
                  // 💡 FIXED: Use spec._id if available, otherwise fallback to index
                  key={spec._id || j} 
                  className="flex justify-between border-b py-2"
                >
                  <span className="text-gray-600">{spec.label}</span>
                  <span className="font-medium text-gray-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};