'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Folder, Eye, Lock, MoreVertical, Edit, Trash2, Share2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description?: string;
    is_public: boolean;
    prompt_ids: string[];
    tags: string[];
    color: string;
    icon: string;
    created_at: string;
    updated_at: string;
  };
  isOwner: boolean;
  onEdit?: (collectionId: string) => void;
  onDelete?: (collectionId: string) => void;
  onShare?: (collectionId: string) => void;
}

export default function CollectionCard({
  collection,
  isOwner,
  onEdit,
  onDelete,
  onShare
}: CollectionCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(collection.id);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this collection?')) {
      onDelete?.(collection.id);
    }
    setShowMenu(false);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const url = `${window.location.origin}/collections/${collection.id}`;
      await navigator.clipboard.writeText(url);
      onShare?.(collection.id);
      
      // Show temporary feedback
      const button = e.currentTarget as HTMLButtonElement;
      const originalText = button.innerHTML;
      button.innerHTML = '✓ Copied!';
      setTimeout(() => {
        button.innerHTML = originalText;
      }, 2000);
    } catch (error) {
      console.error('Error sharing collection:', error);
    }
    
    setShowMenu(false);
  };

  return (
    <Link href={`/profile/collections/${collection.id}`}>
      <div className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center flex-1 min-w-0">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0"
              style={{ backgroundColor: collection.color + '20' }}
            >
              <Folder 
                className="w-6 h-6" 
                style={{ color: collection.color }}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {collection.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">
                  {collection.prompt_ids?.length || 0} prompts
                </span>
                <span className="text-gray-300">•</span>
                <div className="flex items-center text-sm">
                  {collection.is_public ? (
                    <div className="flex items-center text-green-600">
                      <Eye className="w-3 h-3 mr-1" />
                      Public
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Button */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={handleEdit}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Collection
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Collection
                  </button>
                  
                  <hr className="my-1" />
                  
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Collection
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {collection.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {collection.description}
          </p>
        )}

        {/* Tags */}
        {collection.tags && collection.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {collection.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {collection.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                +{collection.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            Created {formatDate(collection.created_at)}
          </div>
          
          {collection.updated_at !== collection.created_at && (
            <div className="flex items-center">
              Updated {formatDate(collection.updated_at)}
            </div>
          )}
        </div>

        {/* Click overlay to close menu when clicking outside */}
        {showMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
        )}
      </div>
    </Link>
  );
}

