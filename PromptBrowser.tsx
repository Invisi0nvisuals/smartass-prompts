'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, SlidersHorizontal, Grid, List, ChevronDown } from 'lucide-react';
import PromptCard from './PromptCard';
import { createClientSupabaseClient } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface Prompt {
  id: string;
  title: string;
  description: string;
  category: 'creative' | 'technical' | 'business' | 'educational' | 'other';
  tags: string[];
  overall_score: number;
  clarity_score: number;
  structure_score: number;
  usefulness_score: number;
  view_count: number;
  like_count: number;
  download_count: number;
  created_at: string;
  owner_id: string;
  is_public: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  user_profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface PromptBrowserProps {
  initialPrompts: Prompt[];
  currentUserId?: string;
  searchParams: {
    search?: string;
    category?: string;
    tags?: string;
    sort?: string;
    page?: string;
  };
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'creative', label: 'Creative' },
  { value: 'technical', label: 'Technical' },
  { value: 'business', label: 'Business' },
  { value: 'educational', label: 'Educational' },
  { value: 'other', label: 'Other' },
];

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'score', label: 'Highest Rated' },
];

export default function PromptBrowser({
  initialPrompts,
  currentUserId,
  searchParams
}: PromptBrowserProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.category || 'all');
  const [selectedSort, setSelectedSort] = useState(searchParams.sort || 'recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [tagFilter, setTagFilter] = useState(searchParams.tags || '');

  const supabase = createClientSupabaseClient();

  // Debounced search function
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  const updateURL = useCallback((params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(urlSearchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });

    const newURL = `/prompts${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
    router.push(newURL);
  }, [router, urlSearchParams]);

  const fetchPrompts = useCallback(async (params: {
    search?: string;
    category?: string;
    tags?: string;
    sort?: string;
  }) => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('prompt_metadata')
        .select(`
          id,
          title,
          description,
          category,
          tags,
          overall_score,
          clarity_score,
          structure_score,
          usefulness_score,
          view_count,
          like_count,
          download_count,
          created_at,
          owner_id,
          is_public,
          status,
          user_profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .eq('status', 'approved');

      // Apply filters
      if (params.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      if (params.category && params.category !== 'all') {
        query = query.eq('category', params.category);
      }

      if (params.tags) {
        const tags = params.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        if (tags.length > 0) {
          query = query.overlaps('tags', tags);
        }
      }

      // Apply sorting
      switch (params.sort) {
        case 'popular':
          query = query.order('like_count', { ascending: false });
          break;
        case 'views':
          query = query.order('view_count', { ascending: false });
          break;
        case 'score':
          query = query.order('overall_score', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      query = query.limit(24);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching prompts:', error);
        return;
      }

      setPrompts(data || []);
    } catch (error) {
      console.error('Error in fetchPrompts:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const debouncedFetch = useCallback(
    debounce((params: any) => {
      fetchPrompts(params);
      updateURL(params);
    }, 500),
    [fetchPrompts, updateURL]
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedFetch({
      search: value,
      category: selectedCategory,
      tags: tagFilter,
      sort: selectedSort,
    });
  };

  // Handle filter changes
  const handleFilterChange = (type: string, value: string) => {
    const params = {
      search: searchQuery,
      category: type === 'category' ? value : selectedCategory,
      tags: type === 'tags' ? value : tagFilter,
      sort: type === 'sort' ? value : selectedSort,
    };

    if (type === 'category') setSelectedCategory(value);
    if (type === 'tags') setTagFilter(value);
    if (type === 'sort') setSelectedSort(value);

    fetchPrompts(params);
    updateURL(params);
  };

  // Handle like action
  const handleLike = async (promptId: string, isLiked: boolean) => {
    if (!currentUserId) return;

    try {
      if (isLiked) {
        await supabase
          .from('prompt_likes')
          .insert({ user_id: currentUserId, prompt_id: promptId });
      } else {
        await supabase
          .from('prompt_likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('prompt_id', promptId);
      }

      // Update local state
      setPrompts(prev => prev.map(prompt => 
        prompt.id === promptId 
          ? { ...prompt, like_count: prompt.like_count + (isLiked ? 1 : -1) }
          : prompt
      ));
    } catch (error) {
      console.error('Error liking prompt:', error);
      throw error;
    }
  };

  // Handle share action
  const handleShare = (promptId: string) => {
    // Could track sharing analytics here
    console.log('Shared prompt:', promptId);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort Filter */}
          <div className="relative">
            <select
              value={selectedSort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-l-md",
                viewMode === 'grid' ? "bg-blue-500 text-white" : "bg-white text-gray-500 hover:text-gray-700"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-r-md",
                viewMode === 'list' ? "bg-blue-500 text-white" : "bg-white text-gray-500 hover:text-gray-700"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:text-gray-900 hover:border-gray-400"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. writing, marketing, code"
                  value={tagFilter}
                  onChange={(e) => handleFilterChange('tags', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-600">
                {prompts.length} prompts found
              </p>
            </div>

            {/* Prompts Grid/List */}
            {prompts.length > 0 ? (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              )}>
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    currentUserId={currentUserId}
                    onLike={handleLike}
                    onShare={handleShare}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts found</h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or browse all prompts.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

