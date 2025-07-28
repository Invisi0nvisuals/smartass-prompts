'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Eye, Download, Share2, Star, User, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptCardProps {
  prompt: {
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
  };
  currentUserId?: string;
  onLike?: (promptId: string, isLiked: boolean) => void;
  onShare?: (promptId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const categoryColors = {
  creative: 'bg-purple-100 text-purple-800 border-purple-200',
  technical: 'bg-blue-100 text-blue-800 border-blue-200',
  business: 'bg-green-100 text-green-800 border-green-200',
  educational: 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBackground = (score: number) => {
  if (score >= 8) return 'bg-green-100';
  if (score >= 6) return 'bg-yellow-100';
  return 'bg-red-100';
};

export default function PromptCard({
  prompt,
  currentUserId,
  onLike,
  onShare,
  showActions = true,
  compact = false
}: PromptCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(prompt.like_count);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId || isLiking) return;
    
    setIsLiking(true);
    const newIsLiked = !isLiked;
    
    // Optimistic update
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    
    try {
      await onLike?.(prompt.id, newIsLiked);
    } catch (error) {
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
      console.error('Error liking prompt:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const url = `${window.location.origin}/prompts/${prompt.id}`;
      await navigator.clipboard.writeText(url);
      onShare?.(prompt.id);
      
      // Show temporary feedback (you might want to use a toast library)
      const button = e.currentTarget as HTMLButtonElement;
      const originalText = button.innerHTML;
      button.innerHTML = '✓ Copied!';
      setTimeout(() => {
        button.innerHTML = originalText;
      }, 2000);
    } catch (error) {
      console.error('Error sharing prompt:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Link href={`/prompts/${prompt.id}`}>
      <div className={cn(
        "group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden",
        compact ? "p-4" : "p-6"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-gray-900 group-hover:text-blue-600 transition-colors",
              compact ? "text-lg" : "text-xl"
            )}>
              {truncateText(prompt.title, compact ? 50 : 80)}
            </h3>
            
            {/* Category Badge */}
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                categoryColors[prompt.category]
              )}>
                {prompt.category}
              </span>
              
              {/* Overall Score */}
              <div className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                getScoreBackground(prompt.overall_score),
                getScoreColor(prompt.overall_score)
              )}>
                <Star className="w-3 h-3 mr-1" />
                {prompt.overall_score}/10
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className={cn(
          "text-gray-600 mb-4",
          compact ? "text-sm" : "text-base"
        )}>
          {truncateText(prompt.description, compact ? 100 : 150)}
        </p>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {prompt.tags.slice(0, compact ? 3 : 5).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {prompt.tags.length > (compact ? 3 : 5) && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                +{prompt.tags.length - (compact ? 3 : 5)} more
              </span>
            )}
          </div>
        )}

        {/* Detailed Scores (non-compact only) */}
        {!compact && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center">
              <div className={cn(
                "text-sm font-medium",
                getScoreColor(prompt.clarity_score)
              )}>
                {prompt.clarity_score}/10
              </div>
              <div className="text-xs text-gray-500">Clarity</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-sm font-medium",
                getScoreColor(prompt.structure_score)
              )}>
                {prompt.structure_score}/10
              </div>
              <div className="text-xs text-gray-500">Structure</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-sm font-medium",
                getScoreColor(prompt.usefulness_score)
              )}>
                {prompt.usefulness_score}/10
              </div>
              <div className="text-xs text-gray-500">Usefulness</div>
            </div>
          </div>
        )}

        {/* Author and Date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {prompt.user_profiles?.avatar_url ? (
              <img
                src={prompt.user_profiles.avatar_url}
                alt={prompt.user_profiles.full_name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-3 h-3 text-gray-500" />
              </div>
            )}
            <span className="text-sm text-gray-600">
              {prompt.user_profiles?.full_name || 'Anonymous'}
            </span>
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(prompt.created_at)}
          </div>
        </div>

        {/* Stats and Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {prompt.view_count.toLocaleString()}
              </div>
              <div className="flex items-center">
                <Download className="w-4 h-4 mr-1" />
                {prompt.download_count.toLocaleString()}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Like Button */}
              <button
                onClick={handleLike}
                disabled={!currentUserId || isLiking}
                className={cn(
                  "flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors",
                  isLiked
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  !currentUserId && "opacity-50 cursor-not-allowed"
                )}
              >
                <Heart className={cn(
                  "w-4 h-4",
                  isLiked && "fill-current"
                )} />
                <span>{likeCount}</span>
              </button>
              
              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

