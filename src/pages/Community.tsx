import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, MessageSquare, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Post {
  id: string;
  title: string;
  content: string;
  subject: string;
  author_id: string;
  created_at: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
  };
}

const Community = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect unauthenticated users
  if (!loading && !user) {
    return <Navigate to="/" replace />;
  }

  // Fetch posts from Supabase
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from("posts")
          .select(`
            id,
            title,
            content,
            subject,
            author_id,
            created_at,
            profiles:author_id (
              display_name,
              full_name,
              name
            )
          `)
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Error fetching posts:", fetchError);
          setError("Failed to load community posts");
          return;
        }

        // Transform the data to match our interface
        const transformedPosts = data?.map(post => ({
          ...post,
          user_metadata: {
            display_name: post.profiles?.display_name,
            full_name: post.profiles?.full_name,
            name: post.profiles?.name,
          }
        })) || [];

        setPosts(transformedPosts);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoadingPosts(false);
      }
    };

    if (user) {
      fetchPosts();
    }
  }, [user]);

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return postDate.toLocaleDateString();
  };

  // Helper function to get author name
  const getAuthorName = (post: Post) => {
    return post.user_metadata?.display_name || 
           post.user_metadata?.full_name || 
           post.user_metadata?.name || 
           "Anonymous";
  };

  // Handle post click
  const handlePostClick = (postId: string) => {
    navigate(`/community/${postId}`);
  };

  // Handle ask question button
  const handleAskQuestion = () => {
    navigate("/community/new");
  };

  if (loading || loadingPosts) {
    return (
      <div className="min-h-screen bg-gradient-light">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2"
              >
                ← Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Loading State */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg text-muted-foreground">Fetching community posts...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              ← Back to Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleAskQuestion}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Ask a Question
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Community Discussions</h1>
          <p className="text-muted-foreground">
            Share questions, insights, and connect with fellow medical students preparing for NEET-PG.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loadingPosts && posts.length === 0 && !error && (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No discussions yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to start a conversation!</p>
            <Button
              onClick={handleAskQuestion}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Start a Discussion
            </Button>
          </div>
        )}

        {/* Posts Grid */}
        {posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 rounded-2xl"
                onClick={() => handlePostClick(post.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 hover:text-green-600 transition-colors">
                      {post.title}
                    </CardTitle>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {post.subject}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="font-medium">
                      {getAuthorName(post)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(post.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Community;
