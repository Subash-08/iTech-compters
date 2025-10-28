import React from 'react';
import { BrandFilters } from '../types/brand';

// Define Icons locally if there's an import issue
const Icons = {
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
};

interface BrandFiltersProps {
  filters: BrandFilters;
  onSearch: (search: string) => void;
  onStatusFilter: (status: string) => void;
}

const BrandFiltersComponent: React.FC<BrandFiltersProps> = ({
  filters,
  onSearch,
  onStatusFilter
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Icons.Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands by name..."
            value={filters.search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <select
          value={filters.status}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
};

export default BrandFiltersComponent;