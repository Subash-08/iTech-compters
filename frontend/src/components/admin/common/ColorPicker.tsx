// src/components/common/ColorPicker.tsx
import React, { useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  className = ''
}) => {
  const [showPalette, setShowPalette] = useState(false);

  const presetColors = [
    '#ffffff', '#000000', '#f3f4f6', '#6b7280', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 cursor-pointer rounded border border-gray-300"
          />
          <div
            className="absolute inset-0 border border-gray-300 rounded pointer-events-none"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
          ></div>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setShowPalette(!showPalette)}
          className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Palette
        </button>
      </div>
      
      {showPalette && (
        <div className="mt-2 p-3 border border-gray-200 rounded-md bg-white">
          <div className="grid grid-cols-6 gap-2">
            {presetColors.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setShowPalette(false);
                }}
                className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;