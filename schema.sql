-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE prompt_category AS ENUM ('creative', 'technical', 'business', 'educational', 'other');
CREATE TYPE complexity_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE prompt_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
CREATE TYPE interaction_type AS ENUM ('view', 'download', 'like', 'unlike', 'share');

-- Create prompt_metadata table
CREATE TABLE prompt_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic metadata
    title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 100),
    description TEXT NOT NULL CHECK (length(description) >= 10 AND length(description) <= 500),
    category prompt_category NOT NULL DEFAULT 'other',
    tags TEXT[] DEFAULT '{}' CHECK (array_length(tags, 1) <= 5),
    
    -- File information
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 5242880), -- 5MB limit
    file_type TEXT NOT NULL,
    content_preview TEXT,
    
    -- AI Evaluation scores (1-10 scale)
    clarity_score INTEGER DEFAULT 5 CHECK (clarity_score >= 1 AND clarity_score <= 10),
    structure_score INTEGER DEFAULT 5 CHECK (structure_score >= 1 AND structure_score <= 10),
    usefulness_score INTEGER DEFAULT 5 CHECK (usefulness_score >= 1 AND usefulness_score <= 10),
    overall_score INTEGER DEFAULT 5 CHECK (overall_score >= 1 AND overall_score <= 10),
    
    -- AI Evaluation reasoning
    clarity_reasoning TEXT,
    structure_reasoning TEXT,
    usefulness_reasoning TEXT,
    overall_reasoning TEXT,
    
    -- Auto-generated metadata
    suggested_tags TEXT[] DEFAULT '{}',
    ai_category prompt_category DEFAULT 'other',
    complexity_level complexity_level DEFAULT 'intermediate',
    estimated_tokens INTEGER,
    
    -- Usage statistics
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    
    -- Status and moderation
    status prompt_status DEFAULT 'pending',
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Version control
    version INTEGER DEFAULT 1 CHECK (version >= 1),
    parent_id UUID REFERENCES prompt_metadata(id) ON DELETE SET NULL
);

-- Create user_prompt_interactions table
CREATE TABLE user_prompt_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt_id UUID REFERENCES prompt_metadata(id) ON DELETE CASCADE NOT NULL,
    interaction_type interaction_type NOT NULL,
    metadata JSONB,
    
    -- Prevent duplicate interactions of same type within short time
    UNIQUE(user_id, prompt_id, interaction_type, created_at)
);

-- Create prompt_collections table
CREATE TABLE prompt_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL CHECK (length(name) >= 3 AND length(name) <= 100),
    description TEXT CHECK (length(description) <= 500),
    is_public BOOLEAN DEFAULT false,
    prompt_ids UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_prompt_metadata_owner_id ON prompt_metadata(owner_id);
CREATE INDEX idx_prompt_metadata_category ON prompt_metadata(category);
CREATE INDEX idx_prompt_metadata_status ON prompt_metadata(status);
CREATE INDEX idx_prompt_metadata_is_public ON prompt_metadata(is_public);
CREATE INDEX idx_prompt_metadata_overall_score ON prompt_metadata(overall_score DESC);
CREATE INDEX idx_prompt_metadata_created_at ON prompt_metadata(created_at DESC);
CREATE INDEX idx_prompt_metadata_tags ON prompt_metadata USING GIN(tags);
CREATE INDEX idx_prompt_metadata_suggested_tags ON prompt_metadata USING GIN(suggested_tags);
CREATE INDEX idx_prompt_metadata_title_search ON prompt_metadata USING GIN(to_tsvector('english', title));
CREATE INDEX idx_prompt_metadata_description_search ON prompt_metadata USING GIN(to_tsvector('english', description));

CREATE INDEX idx_user_interactions_user_id ON user_prompt_interactions(user_id);
CREATE INDEX idx_user_interactions_prompt_id ON user_prompt_interactions(prompt_id);
CREATE INDEX idx_user_interactions_type ON user_prompt_interactions(interaction_type);
CREATE INDEX idx_user_interactions_created_at ON user_prompt_interactions(created_at DESC);

CREATE INDEX idx_collections_owner_id ON prompt_collections(owner_id);
CREATE INDEX idx_collections_is_public ON prompt_collections(is_public);
CREATE INDEX idx_collections_prompt_ids ON prompt_collections USING GIN(prompt_ids);

-- Enable Row Level Security
ALTER TABLE prompt_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompt_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_metadata
-- Users can view public prompts or their own prompts
CREATE POLICY "Users can view public prompts or own prompts" ON prompt_metadata
    FOR SELECT USING (
        is_public = true 
        OR owner_id = auth.uid()
        OR status = 'approved'
    );

-- Users can only insert their own prompts
CREATE POLICY "Users can insert own prompts" ON prompt_metadata
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can only update their own prompts
CREATE POLICY "Users can update own prompts" ON prompt_metadata
    FOR UPDATE USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Users can only delete their own prompts
CREATE POLICY "Users can delete own prompts" ON prompt_metadata
    FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for user_prompt_interactions
-- Users can view their own interactions
CREATE POLICY "Users can view own interactions" ON user_prompt_interactions
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own interactions
CREATE POLICY "Users can insert own interactions" ON user_prompt_interactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own interactions
CREATE POLICY "Users can update own interactions" ON user_prompt_interactions
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- RLS Policies for prompt_collections
-- Users can view public collections or their own collections
CREATE POLICY "Users can view public collections or own collections" ON prompt_collections
    FOR SELECT USING (
        is_public = true 
        OR owner_id = auth.uid()
    );

-- Users can only insert their own collections
CREATE POLICY "Users can insert own collections" ON prompt_collections
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can only update their own collections
CREATE POLICY "Users can update own collections" ON prompt_collections
    FOR UPDATE USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Users can only delete their own collections
CREATE POLICY "Users can delete own collections" ON prompt_collections
    FOR DELETE USING (owner_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_prompt_metadata_updated_at 
    BEFORE UPDATE ON prompt_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_collections_updated_at 
    BEFORE UPDATE ON prompt_collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment prompt statistics
CREATE OR REPLACE FUNCTION increment_prompt_stat(
    prompt_id UUID,
    stat_type TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    CASE stat_type
        WHEN 'view_count' THEN
            UPDATE prompt_metadata 
            SET view_count = view_count + increment_by 
            WHERE id = prompt_id;
        WHEN 'download_count' THEN
            UPDATE prompt_metadata 
            SET download_count = download_count + increment_by 
            WHERE id = prompt_id;
        WHEN 'like_count' THEN
            UPDATE prompt_metadata 
            SET like_count = like_count + increment_by 
            WHERE id = prompt_id;
        ELSE
            RAISE EXCEPTION 'Invalid stat_type: %', stat_type;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for full-text search
CREATE OR REPLACE FUNCTION search_prompts(
    search_query TEXT,
    category_filter prompt_category DEFAULT NULL,
    tags_filter TEXT[] DEFAULT NULL,
    min_score INTEGER DEFAULT 1,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category prompt_category,
    tags TEXT[],
    overall_score INTEGER,
    created_at TIMESTAMPTZ,
    owner_id UUID,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.title,
        pm.description,
        pm.category,
        pm.tags,
        pm.overall_score,
        pm.created_at,
        pm.owner_id,
        ts_rank(
            to_tsvector('english', pm.title || ' ' || pm.description),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM prompt_metadata pm
    WHERE 
        pm.is_public = true
        AND pm.status = 'approved'
        AND pm.overall_score >= min_score
        AND (
            category_filter IS NULL 
            OR pm.category = category_filter
        )
        AND (
            tags_filter IS NULL 
            OR pm.tags && tags_filter
        )
        AND (
            search_query = '' 
            OR to_tsvector('english', pm.title || ' ' || pm.description) @@ plainto_tsquery('english', search_query)
        )
    ORDER BY 
        rank DESC,
        pm.overall_score DESC,
        pm.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT CHECK (length(bio) <= 500),
    website_url TEXT,
    location TEXT,
    
    -- Stats
    prompts_uploaded INTEGER DEFAULT 0 CHECK (prompts_uploaded >= 0),
    prompts_liked INTEGER DEFAULT 0 CHECK (prompts_liked >= 0),
    total_views INTEGER DEFAULT 0 CHECK (total_views >= 0),
    
    -- Preferences
    email_notifications BOOLEAN DEFAULT true,
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_badge TEXT
);

-- Create likes table for prompt likes
CREATE TABLE prompt_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt_id UUID REFERENCES prompt_metadata(id) ON DELETE CASCADE NOT NULL,
    
    -- Prevent duplicate likes
    UNIQUE(user_id, prompt_id)
);

-- Create comments table for prompt comments
CREATE TABLE prompt_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt_id UUID REFERENCES prompt_metadata(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
    
    -- For threaded comments (optional)
    parent_id UUID REFERENCES prompt_comments(id) ON DELETE CASCADE,
    
    -- Moderation
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    reported_count INTEGER DEFAULT 0 CHECK (reported_count >= 0)
);

-- Create user_collections table (enhanced from prompt_collections)
CREATE TABLE user_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL CHECK (length(name) >= 3 AND length(name) <= 100),
    description TEXT CHECK (length(description) <= 500),
    is_public BOOLEAN DEFAULT false,
    prompt_ids UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Collection metadata
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'folder',
    sort_order INTEGER DEFAULT 0
);

-- Create user_follows table for following other users
CREATE TABLE user_follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Prevent self-follows and duplicates
    CHECK (follower_id != following_id),
    UNIQUE(follower_id, following_id)
);

-- Create prompt_views table for tracking views
CREATE TABLE prompt_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Allow anonymous views
    prompt_id UUID REFERENCES prompt_metadata(id) ON DELETE CASCADE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    
    -- Prevent duplicate views from same user within 24 hours
    UNIQUE(user_id, prompt_id, DATE(created_at))
);

-- Add indexes for better performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_full_name ON user_profiles(full_name);
CREATE INDEX idx_user_profiles_is_verified ON user_profiles(is_verified);

CREATE INDEX idx_prompt_likes_user_id ON prompt_likes(user_id);
CREATE INDEX idx_prompt_likes_prompt_id ON prompt_likes(prompt_id);
CREATE INDEX idx_prompt_likes_created_at ON prompt_likes(created_at DESC);

CREATE INDEX idx_prompt_comments_user_id ON prompt_comments(user_id);
CREATE INDEX idx_prompt_comments_prompt_id ON prompt_comments(prompt_id);
CREATE INDEX idx_prompt_comments_parent_id ON prompt_comments(parent_id);
CREATE INDEX idx_prompt_comments_created_at ON prompt_comments(created_at DESC);

CREATE INDEX idx_user_collections_owner_id ON user_collections(owner_id);
CREATE INDEX idx_user_collections_is_public ON user_collections(is_public);
CREATE INDEX idx_user_collections_prompt_ids ON user_collections USING GIN(prompt_ids);

CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);

CREATE INDEX idx_prompt_views_user_id ON prompt_views(user_id);
CREATE INDEX idx_prompt_views_prompt_id ON prompt_views(prompt_id);
CREATE INDEX idx_prompt_views_created_at ON prompt_views(created_at DESC);

-- Enable Row Level Security for new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
    FOR SELECT USING (profile_visibility = 'public' OR auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for prompt_likes
CREATE POLICY "Users can view all likes" ON prompt_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON prompt_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON prompt_likes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for prompt_comments
CREATE POLICY "Users can view all comments" ON prompt_comments
    FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Users can insert own comments" ON prompt_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON prompt_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON prompt_comments
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_collections
CREATE POLICY "Users can view public collections or own collections" ON user_collections
    FOR SELECT USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Users can insert own collections" ON user_collections
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own collections" ON user_collections
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own collections" ON user_collections
    FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for user_follows
CREATE POLICY "Users can view all follows" ON user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own follows" ON user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for prompt_views
CREATE POLICY "Users can view own views" ON prompt_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own views" ON prompt_views
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_comments_updated_at 
    BEFORE UPDATE ON prompt_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_collections_updated_at 
    BEFORE UPDATE ON user_collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update prompts_uploaded count
    IF TG_TABLE_NAME = 'prompt_metadata' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE user_profiles 
            SET prompts_uploaded = prompts_uploaded + 1 
            WHERE id = NEW.owner_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE user_profiles 
            SET prompts_uploaded = prompts_uploaded - 1 
            WHERE id = OLD.owner_id;
        END IF;
    END IF;
    
    -- Update prompts_liked count
    IF TG_TABLE_NAME = 'prompt_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE user_profiles 
            SET prompts_liked = prompts_liked + 1 
            WHERE id = NEW.user_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE user_profiles 
            SET prompts_liked = prompts_liked - 1 
            WHERE id = OLD.user_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for user stats
CREATE TRIGGER update_user_prompts_stats 
    AFTER INSERT OR DELETE ON prompt_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_user_likes_stats 
    AFTER INSERT OR DELETE ON prompt_likes 
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Create function to get user recommendations
CREATE OR REPLACE FUNCTION get_user_recommendations(
    target_user_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    prompt_id UUID,
    title TEXT,
    description TEXT,
    category prompt_category,
    tags TEXT[],
    overall_score INTEGER,
    like_count INTEGER,
    view_count INTEGER,
    created_at TIMESTAMPTZ,
    owner_id UUID,
    recommendation_score REAL
) AS $$
BEGIN
    RETURN QUERY
    WITH user_interactions AS (
        -- Get user's liked prompts and their categories/tags
        SELECT DISTINCT pm.category, unnest(pm.tags) as tag
        FROM prompt_likes pl
        JOIN prompt_metadata pm ON pl.prompt_id = pm.id
        WHERE pl.user_id = target_user_id
    ),
    category_scores AS (
        -- Score prompts based on user's preferred categories
        SELECT pm.id, 
               CASE WHEN pm.category IN (SELECT category FROM user_interactions) 
                    THEN 2.0 ELSE 0.0 END as category_score
        FROM prompt_metadata pm
    ),
    tag_scores AS (
        -- Score prompts based on user's preferred tags
        SELECT pm.id,
               (SELECT COUNT(*) FROM user_interactions ui 
                WHERE ui.tag = ANY(pm.tags)) * 0.5 as tag_score
        FROM prompt_metadata pm
    )
    SELECT 
        pm.id as prompt_id,
        pm.title,
        pm.description,
        pm.category,
        pm.tags,
        pm.overall_score,
        pm.like_count,
        pm.view_count,
        pm.created_at,
        pm.owner_id,
        (cs.category_score + ts.tag_score + (pm.overall_score * 0.1) + (pm.like_count * 0.05)) as recommendation_score
    FROM prompt_metadata pm
    JOIN category_scores cs ON pm.id = cs.id
    JOIN tag_scores ts ON pm.id = ts.id
    LEFT JOIN prompt_likes pl ON pm.id = pl.prompt_id AND pl.user_id = target_user_id
    WHERE 
        pm.is_public = true
        AND pm.status = 'approved'
        AND pm.owner_id != target_user_id
        AND pl.id IS NULL  -- Exclude already liked prompts
    ORDER BY recommendation_score DESC, pm.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

