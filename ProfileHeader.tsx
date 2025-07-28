'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, MapPin, Globe, Calendar, Edit, Check, Verified } from 'lucide-react';

interface ProfileHeaderProps {
  profile: {
    id: string;
    email: string;
    full_name: string;
    bio?: string;
    avatar_url?: string | null;
    website_url?: string;
    location?: string;
    prompts_uploaded: number;
    prompts_liked: number;
    total_views: number;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
  };
  stats: {
    totalPrompts: number;
    totalLikes: number;
    totalCollections: number;
  };
  isOwnProfile: boolean;
}

export default function ProfileHeader({ profile, stats, isOwnProfile }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Implement follow functionality
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
            <User className="w-12 h-12 text-gray-500" />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {profile.full_name || 'Anonymous User'}
              </h1>
              {profile.is_verified && (
                <Verified className="w-6 h-6 text-blue-500 fill-current" />
              )}
            </div>
            <p className="text-gray-600">{profile.email}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 sm:mt-0">
            {isOwnProfile ? (
              <Link
                href="/profile/edit"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={handleFollow}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isFollowing
                    ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-700 mb-4 max-w-2xl">
            {profile.bio}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
          {profile.location && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {profile.location}
            </div>
          )}
          
          {profile.website_url && (
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-1" />
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                {profile.website_url.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Joined {formatDate(profile.created_at)}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalPrompts}</div>
            <div className="text-sm text-gray-500">Prompts</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{profile.total_views.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Views</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalLikes}</div>
            <div className="text-sm text-gray-500">Likes Given</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalCollections}</div>
            <div className="text-sm text-gray-500">Collections</div>
          </div>
        </div>
      </div>
    </div>
  );
}

