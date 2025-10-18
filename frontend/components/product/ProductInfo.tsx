import React, { useState, useMemo, useEffect } from "react";
import { Star } from "lucide-react";
import { VariantSelector } from "./VariantSelector"; // Assumed import

// --- INTERFACES (As defined in previous steps) ---

interface VariantOption {
    value: string;
    priceModifier: number; // The difference from the base price
    stockQuantity: number;
    isAvailable: boolean;
}

interface Variant {
    name: string;
    options: VariantOption[];
}

interface ProductFeature {
    title: string;
    description: string;
}

interface ProductInfoProps {
    name: string;
    description: string;
    basePrice: number;
    baseOfferPrice: number; // The lowest or starting price
    ratings: { average: number; count: number };
    label?: { text: string; color: string; bgColor: string };
    variants?: Variant[];
    additionalInfo?: { estimatedDeliveryTime?: string; warrantyInfo?: string };
    features?: ProductFeature[];
}

// --- CustomButton Component (Kept for Actions) ---

const CustomButton: React.FC<{
    children: React.ReactNode;
    variant?: "primary" | "outline" | "selected";
    onClick?: () => void;
    disabled?: boolean;
}> = ({ children, variant = "primary", onClick, disabled }) => {
    const baseClasses = "px-5 py-2 rounded-md font-medium transition-all duration-200 text-sm";
    let variantClasses = "";
    
    if (variant === "primary") {
        variantClasses = "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed";
    } else if (variant === "outline") {
        variantClasses = "border border-gray-400 text-gray-700 hover:border-green-500 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed";
    } else if (variant === "selected") {
        variantClasses = "border-2 border-green-600 bg-green-50 text-green-700 hover:bg-green-100";
    }

    return (
        <button className={`${baseClasses} ${variantClasses}`} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    );
};

// --- ProductInfo Component ---

export const ProductInfo: React.FC<ProductInfoProps> = ({
    name,
    description,
    basePrice,
    baseOfferPrice,
    ratings,
    label,
    variants, // This is the array of variant groups (Color, Size)
    additionalInfo,
    features,
}) => {
    // State to hold the currently selected option for each variant group
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

    // 1. Initialize selectedOptions
    useEffect(() => {
        if (variants && variants.length > 0) {
            const initialOptions: Record<string, string> = {};
            
            variants.forEach(variant => {
                // 💡 FIX: Ensure variant.options is valid before accessing it
                if (!variant.options || variant.options.length === 0) {
                    return; 
                }
                
                // Select the first available option by default
                const defaultOption = variant.options.find(opt => opt.isAvailable) || variant.options[0];
                
                if (defaultOption) {
                    initialOptions[variant.name] = defaultOption.value;
                }
            });
            
            setSelectedOptions(initialOptions);
        }
    }, [variants]);

    // Handler to update the selected option for a variant group
    const handleOptionChange = (variantName: string, optionValue: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            [variantName]: optionValue,
        }));
    };

    // 2. Dynamic Price and Stock Calculation
    const { currentPrice, currentStock } = useMemo(() => {
        let cumulativePriceModifier = 0;
        let lowestStock = Infinity; // Track the minimum stock across selected variants
        
        // Guard against running before all options are initialized
        if (!variants || Object.keys(selectedOptions).length === 0) {
            return { currentPrice: baseOfferPrice, currentStock: 0 };
        }
        
        variants.forEach(variantGroup => {
            const selectedValue = selectedOptions[variantGroup.name];
            
            // 💡 Safety check: Ensure options array exists
            if (!variantGroup.options) {
                return; 
            }

            const selectedOption = variantGroup.options.find(opt => opt.value === selectedValue);
            
            if (selectedOption) {
                // Price Logic (Workaround): Sum all price modifiers.
                cumulativePriceModifier += selectedOption.priceModifier; 
                
                // Stock Logic (More Accurate Workaround): Use the lowest stock among selected options.
                if (selectedOption.stockQuantity < lowestStock) {
                    lowestStock = selectedOption.stockQuantity;
                }
            }
        });
        
        const finalOfferPrice = baseOfferPrice + cumulativePriceModifier;
        
        return { 
            currentPrice: finalOfferPrice, 
            currentStock: lowestStock === Infinity ? 0 : lowestStock 
        };
        
    }, [baseOfferPrice, variants, selectedOptions]);
    
    // Determine displayed stock message
    const displayStock = currentStock > 0 ? `${currentStock} in stock` : 'Out of Stock';

    return (
        <div className="space-y-5">
            {/* Label */}
            {label && (
                <span
                    className="inline-block px-3 py-1 text-sm font-medium rounded-full"
                    style={{ color: label.color, backgroundColor: label.bgColor }}
                >
                    {label.text}
                </span>
            )}

            {/* Title */}
            <h1 className="text-3xl font-semibold text-gray-900">{name}</h1>

            {/* Ratings */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={18}
                            fill={i < Math.round(ratings.average) ? "currentColor" : "none"}
                        />
                    ))}
                </div>
                <span>({ratings.count} Reviews)</span>
            </div>

            {/* Price - Dynamic */}
            <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-green-600">
                    ₹{currentPrice.toLocaleString()} 
                </span>
                {/* Show strikethrough price if basePrice is higher than the calculated current price */}
                {basePrice > currentPrice && (
                    <span className="text-gray-400 line-through text-lg">
                        ₹{basePrice.toLocaleString()}
                    </span>
                )}
            </div>

            {/* Stock Availability */}
            <p className="text-sm font-medium" style={{ color: currentStock > 0 ? 'green' : 'red' }}>
                {displayStock}
            </p>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed">{description}</p>
            
            {/* Variants - Using the new Selector */}
{variants?.map((variant, i) => (
                <VariantSelector
                    key={i}
                    variantName={variant.name}
                    // 💡 FIX: Use optional chaining (?.map) and a fallback empty array (|| [])
                    options={variant.options?.map(opt => ({
                        value: opt.value,
                        isAvailable: opt.isAvailable,
                        displayColor: variant.name.toLowerCase() === 'colour' || variant.name.toLowerCase() === 'color' ? opt.value.toLowerCase() : undefined,
                        price: baseOfferPrice + opt.priceModifier 
                    })) || []}
                    selectedValue={selectedOptions[variant.name]}
                    onSelect={(value) => handleOptionChange(variant.name, value)}
                    isColor={variant.name.toLowerCase() === 'colour' || variant.name.toLowerCase() === 'color'}
                />
            ))}

            {/* Features */}
            {features?.length ? (
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    {features.map((f, i) => (
                        <li key={i}>
                            <strong className="font-semibold text-gray-900">{f.title}:</strong> {f.description}
                        </li>
                    ))}
                </ul>
            ) : null}

            {/* Additional info */}
            {additionalInfo?.warrantyInfo && (
                <p className="text-sm text-gray-600">
                    Warranty: {additionalInfo.warrantyInfo}
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <CustomButton 
                    variant="primary" 
                    disabled={currentStock <= 0} // Disable if out of stock
                >
                    {currentStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </CustomButton>
                <CustomButton variant="outline">Buy Now</CustomButton>
            </div>
        </div>
    );
};