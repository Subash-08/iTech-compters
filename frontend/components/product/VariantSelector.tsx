// VariantSelector.tsx (New File)
import React from 'react';

interface Option {
    value: string;
    isAvailable: boolean;
    displayColor?: string; // For rendering color circles
    price?: number; // Price specific to this option (if needed for display)
}

interface VariantSelectorProps {
    variantName: string;
    options: Option[];
    selectedValue: string | undefined;
    onSelect: (value: string) => void;
    isColor: boolean; // Flag to render color circles
}
// VariantSelector.tsx (The key difference is the JSX output for isColor)

// ... interfaces and props ...

export const VariantSelector: React.FC<VariantSelectorProps> = ({
    variantName,
    options,
    selectedValue,
    onSelect,
    isColor, // Crucial prop
}) => {
    return (
        <div className="pt-2">
            <h4 className="font-medium mb-2">{variantName}: <span className="text-gray-600 font-normal">{selectedValue}</span></h4>
            <div className="flex gap-3 flex-wrap">
                {options.map((opt, index) => {
                    const isSelected = selectedValue === opt.value;
                    const isDisabled = !opt.isAvailable;
                    
                    if (isColor) {
                        // --- CUSTOM COLOR TILE MARKUP ---
                        return (
                            <div
                                key={index}
                                className={`
                                    p-1 cursor-pointer rounded-lg border 
                                    ${isSelected ? 'border-2 border-blue-600' : 'border-gray-200 hover:border-gray-400'}
                                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                onClick={isDisabled ? undefined : () => onSelect(opt.value)}
                            >
                                <div className="flex flex-col items-center">
                                    {/* Color Swatch */}
                                    <div 
                                        className="w-10 h-10 rounded-full shadow-md border border-gray-100" // Increased size for visibility
                                        style={{ backgroundColor: opt.displayColor || 'gray' }}
                                    ></div>
                                    
                                    {/* Offered Price */}
                                    <span className="text-sm font-semibold text-gray-900 mt-1">
                                        {opt.price ? `₹${opt.price.toLocaleString('en-IN')}` : 'N/A'}
                                    </span>
                                    
                                    {/* Original Price (Strikethrough) - ASSUMED you pass basePrice for this */}
                                    {/* NOTE: If you need the original price here, you must calculate it or pass it down */}
                                    {opt.originalPrice && (
                                        <span className="text-xs text-gray-500 line-through">
                                            ₹{opt.originalPrice.toLocaleString('en-IN')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    // --- STANDARD BUTTON MARKUP (for Size) ---
                    return (
                        <button
                            key={index}
                            // ... standard button styling for size ...
                            onClick={isDisabled ? undefined : () => onSelect(opt.value)}
                            disabled={isDisabled}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border ${isSelected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-400'}`}
                        >
                            {opt.value}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};