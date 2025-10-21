import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, ThumbsUp, ThumbsDown, Clock, User } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  title: string;
  content: string;
  subject: string;
  author_name: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  reply_count: number;
  user_vote?: 'up' | 'down';
}

const CommunityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [voteLoading, setVoteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const subjects = [
    "Anatomy", "Physiology", "Pathology", "Pharmacology", 
    "Microbiology", "Medicine", "General"
  ];

  useEffect(() => {
    loadPosts();
  }, [sortBy]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // Build the query with sorting
      let query = supabase
        .from("posts")
        .select(`
          id,
          title,
          content,
          subject,
          author_name,
          created_at,
          votes(vote_type, user_id),
          replies(id)
        `);

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "most_voted":
          // This will be handled in the processing step
          query = query.order("created_at", { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading posts:", error);
        return;
      }

      // Process the data to calculate votes and reply counts
      const processedPosts = data.map(post => {
        const upvotes = post.votes?.filter(v => v.vote_type === 'up').length || 0;
        const downvotes = post.votes?.filter(v => v.vote_type === 'down').length || 0;
        const replyCount = post.replies?.length || 0;
        
        // Get user's vote if they're logged in
        let userVote: 'up' | 'down' | undefined;
        if (user && post.votes) {
          const userVoteData = post.votes.find((v: any) => v.user_id === user.id);
          if (userVoteData) {
            userVote = userVoteData.vote_type as 'up' | 'down';
          }
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          subject: post.subject,
          author_name: post.author_name,
          created_at: post.created_at,
          upvotes,
          downvotes,
          reply_count: replyCount,
          user_vote: userVote
        };
      });

      // Sort by most voted if needed
      if (sortBy === "most_voted") {
        processedPosts.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      }

      // Apply filters
      let filteredPosts = processedPosts;

      if (searchQuery) {
        filteredPosts = filteredPosts.filter(post =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (subjectFilter !== "all") {
        filteredPosts = filteredPosts.filter(post => post.subject === subjectFilter);
      }

      setPosts(filteredPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: number, voteType: 'up' | 'down') => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (voteLoading) return; // Prevent multiple clicks

    try {
      setVoteLoading(true);
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id, vote_type")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single();

      if (existingVote) {
        // Update existing vote
        if (existingVote.vote_type === voteType) {
          // Same vote - remove it
          await supabase
            .from("votes")
            .delete()
            .eq("id", existingVote.id);
        } else {
          // Different vote - update it
          await supabase
            .from("votes")
            .update({ vote_type: voteType })
            .eq("id", existingVote.id);
        }
      } else {
        // Create new vote
        await supabase
          .from("votes")
          .insert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType
          });
      }

      // Reload posts to update vote counts
      loadPosts();
    } catch (error: any) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVoteLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading community posts...</p>
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
            <img 
              src="/hands-bandaid.png" 
              alt="medsPG Logo" 
              className="h-12 w-12 object-contain"
            />
            <span className="font-semibold text-lg tracking-tight">MedsPG Community</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
              size="sm"
            >
              Back to Dashboard
            </Button>
            {user && (
              <Button 
                onClick={() => navigate("/community/new")}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Community Discussions</h1>
          <p className="text-muted-foreground">
            Connect with fellow medical students, share insights, and get help with your studies.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex gap-4">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="most_voted">Most Voted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || subjectFilter !== "all" 
                    ? "Try adjusting your search or filters."
                    : "Be the first to start a discussion!"}
                </p>
                {user && (
                  <Button onClick={() => navigate("/community/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/community/post/${post.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 line-clamp-2">
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {post.author_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(post.created_at)}
                          </div>
                          <Badge variant="secondary">{post.subject}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="flex flex-col items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(post.id, 'up');
                            }}
                            disabled={voteLoading}
                            className={`p-1 ${post.user_vote === 'up' ? 'text-green-600 bg-green-50 dark:bg-green-950' : 'hover:text-green-600'}`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <span className="text-lg font-bold text-center min-w-[2rem]">
                            {post.upvotes - post.downvotes}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(post.id, 'down');
                            }}
                            disabled={voteLoading}
                            className={`p-1 ${post.user_vote === 'down' ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'hover:text-red-600'}`}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="text-green-600">+{post.upvotes}</span>
                            <span className="text-red-600">-{post.downvotes}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          {post.reply_count}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3">
                      {post.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
