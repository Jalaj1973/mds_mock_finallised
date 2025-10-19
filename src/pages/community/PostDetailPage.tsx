import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  User, 
  Clock, 
  Send,
  Edit,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Post {
  id: number;
  title: string;
  content: string;
  subject: string;
  author_name: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down';
}

interface Reply {
  id: number;
  content: string;
  author_name: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [voteLoading, setVoteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadPost();
      loadReplies();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          votes!inner(vote_type)
        `)
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      // Calculate votes
      const upvotes = data.votes?.filter((v: any) => v.vote_type === 'up').length || 0;
      const downvotes = data.votes?.filter((v: any) => v.vote_type === 'down').length || 0;
      
      // Get user's vote if they're logged in
      let userVote: 'up' | 'down' | undefined;
      if (user) {
        const userVoteData = data.votes?.find((v: any) => v.vote_type && user.id);
        if (userVoteData) {
          userVote = userVoteData.vote_type as 'up' | 'down';
        }
      }

      setPost({
        ...data,
        upvotes,
        downvotes,
        user_vote: userVote
      });
    } catch (error: any) {
      console.error("Error loading post:", error);
      toast({
        title: "Error",
        description: "Failed to load post. It may not exist.",
        variant: "destructive",
      });
      navigate("/community");
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async () => {
    try {
      const { data, error } = await supabase
        .from("replies")
        .select("*")
        .eq("post_id", id)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      setReplies(data || []);
    } catch (error) {
      console.error("Error loading replies:", error);
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on posts.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!post) return;

    try {
      setVoteLoading(true);

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id, vote_type")
        .eq("post_id", post.id)
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
            post_id: post.id,
            user_id: user.id,
            vote_type: voteType
          });
      }

      // Reload post to update vote counts
      loadPost();
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVoteLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to reply to posts.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!newReply.trim()) {
      toast({
        title: "Empty Reply",
        description: "Please write something before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setReplyLoading(true);

      // Get user's display name
      const displayName = user?.user_metadata?.display_name || 
                         user?.user_metadata?.full_name || 
                         user?.user_metadata?.name || 
                         user?.email?.split('@')[0] || 
                         'Anonymous';

      const { error } = await supabase
        .from("replies")
        .insert({
          post_id: parseInt(id!),
          content: newReply.trim(),
          author_id: user.id,
          author_name: displayName
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Reply Posted",
        description: "Your reply has been added successfully!",
      });

      setNewReply("");
      loadReplies();
    } catch (error: any) {
      console.error("Error posting reply:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user || !post || user.id !== post.author_id) return;

    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Post Deleted",
        description: "Your post has been deleted successfully.",
      });

      navigate("/community");
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
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
          <p className="mt-4 text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The post you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate("/community")}>
            Back to Community
          </Button>
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
            <span className="font-semibold text-lg tracking-tight">Community Post</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={() => navigate("/community")}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Community
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.subject}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  <CardTitle className="text-2xl mb-3">{post.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote('up')}
                      disabled={voteLoading}
                      className={`p-2 ${post.user_vote === 'up' ? 'text-green-600' : ''}`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-medium min-w-[3rem] text-center">
                      {post.upvotes - post.downvotes}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote('down')}
                      disabled={voteLoading}
                      className={`p-2 ${post.user_vote === 'down' ? 'text-red-600' : ''}`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                  {user && user.id === post.author_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeletePost}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Replies Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-xl font-semibold">
              Replies ({replies.length})
            </h2>
          </div>

          {/* Reply Form */}
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add a Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReply} className="space-y-4">
                  <Textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write your reply here..."
                    className="min-h-[100px] resize-none"
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {newReply.length}/2000 characters
                    </p>
                    <Button
                      type="submit"
                      disabled={replyLoading || !newReply.trim()}
                      className="min-w-[100px]"
                    >
                      {replyLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Posting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Reply
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Please log in to reply to this post.
                </p>
                <Button onClick={() => navigate("/auth")}>
                  Log In to Reply
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Replies List */}
          <div className="space-y-4">
            {replies.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No replies yet. Be the first to respond!
                  </p>
                </CardContent>
              </Card>
            ) : (
              replies.map((reply, index) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {reply.author_name}
                          <span>•</span>
                          <Clock className="h-4 w-4" />
                          {formatDate(reply.created_at)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{reply.content}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
