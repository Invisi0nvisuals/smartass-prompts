'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Heart, Folder, Plus, Eye, Calendar } from 'lucide-react';
import PromptCard from './PromptCard';
import { cn } from '@/lib/utils';

interface ProfileTabsProps {
  userPrompts: any[];
  likedPrompts: any[];
  collections: any[];
  currentUserId: string;
}

const tabs = [
  { id: 'prompts', label: 'My Prompts', icon: FileText },
  { id: 'liked', label: 'Liked Prompts', icon: Heart },
  { id: 'collections', label: 'Collections', icon: Folder },
];

export default function ProfileTabs({
  userPrompts,
  likedPrompts,
  collections,
  currentUserId
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('prompts');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderPrompts = (prompts: any[], emptyMessage: string, showViewAll?: boolean) => {
    if (prompts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts yet</h3>
          <p className="text-gray-600 mb-4">{emptyMessage}</p>
          {activeTab === 'prompts' && (
            <Link
              href="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Your First Prompt
            </Link>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt.prompt_metadata || prompt}
              currentUserId={currentUserId}
              compact={false}
            />
          ))}
        </div>
        
        {showViewAll && prompts.length >= 6 && (
          <div className="text-center mt-8">
            <Link
              href={`/profile/${activeTab}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              View All {activeTab === 'prompts' ? 'Prompts' : 'Liked Prompts'}
            </Link>
          </div>
        )}
      </div>
    );
  };

  const renderCollections = () => {
    if (collections.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Folder className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
          <p className="text-gray-600 mb-4">
            Create collections to organize your favorite prompts
          </p>
          <Link
            href="/profile/collections/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Collection
          </Link>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/profile/collections/${collection.id}`}
              className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                    style={{ backgroundColor: collection.color + '20' }}
                  >
                    <Folder 
                      className="w-5 h-5" 
                      style={{ color: collection.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {collection.prompt_ids?.length || 0} prompts
                    </p>
                  </div>
                </div>
                
                {collection.is_public ? (
                  <div className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    <Eye className="w-3 h-3 mr-1" />
                    Public
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    Private
                  </div>
                )}
              </div>

              {collection.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {collection.description}
                </p>
              )}

              {collection.tags && collection.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {collection.tags.slice(0, 3).map((tag: string, index: number) => (
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

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(collection.created_at)}
                </div>
                <div className="flex items-center">
                  Updated {formatDate(collection.updated_at)}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {collections.length >= 6 && (
          <div className="text-center mt-8">
            <Link
              href="/profile/collections"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              View All Collections
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
                <span className={cn(
                  "ml-2 py-0.5 px-2 rounded-full text-xs",
                  isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                )}>
                  {tab.id === 'prompts' && userPrompts.length}
                  {tab.id === 'liked' && likedPrompts.length}
                  {tab.id === 'collections' && collections.length}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'prompts' && renderPrompts(
          userPrompts,
          "Upload your first prompt to get started and share your creativity with the community.",
          true
        )}
        
        {activeTab === 'liked' && renderPrompts(
          likedPrompts,
          "Like prompts you find interesting to see them here.",
          true
        )}
        
        {activeTab === 'collections' && renderCollections()}
      </div>
    </div>
  );
}

