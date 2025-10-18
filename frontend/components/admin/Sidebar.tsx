import React, { useState } from 'react';
import { SidebarItem } from './types/admin';
import { Icons } from './Icon';

interface SidebarProps {
  items: SidebarItem[];
  activePath: string;
  onItemClick: (path: string) => void;
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  items, 
  activePath, 
  onItemClick, 
  isCollapsed 
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = activePath === item.path;

    return (
      <div key={item.id} className="space-y-1">
        <button
          className={`
            w-full flex items-center transition-all duration-200 rounded-lg group
            ${isActive 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
            }
            ${level > 0 ? 'py-2 px-4' : 'py-3 px-4'}
            ${isCollapsed ? 'justify-center' : ''}
          `}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.id);
            } else {
              onItemClick(item.path);
            }
          }}
        >
          <span className={`
            transition-colors duration-200
            ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}
          `}>
            {item.icon}
          </span>
          
          {!isCollapsed && (
            <>
              <span className="ml-3 text-sm font-medium flex-1 text-left">
                {item.label}
              </span>
              {hasChildren && (
                <Icons.ChevronDown 
                  className={`
                    w-4 h-4 transition-transform duration-200
                    ${isExpanded ? 'rotate-180' : ''}
                  `} 
                />
              )}
            </>
          )}
        </button>

        {hasChildren && isExpanded && !isCollapsed && (
          <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-screen bg-white shadow-xl border-r border-gray-200 
      transition-all duration-300 z-50 flex flex-col
      ${isCollapsed ? 'w-20' : 'w-64'}
    `}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className={`
          flex items-center transition-all duration-300
          ${isCollapsed ? 'justify-center' : ''}
        `}>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-4 space-y-2">
          {items.map(item => renderSidebarItem(item))}
        </nav>
      </div>

      {/* User Profile (Bottom) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;