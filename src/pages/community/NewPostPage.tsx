import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const NewPostPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    content: ""
  });

  const subjects = [
    "Anatomy", "Physiology", "Pathology", "Pharmacology", 
    "Microbiology", "Medicine", "General"
  ];

  // Redirect if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.subject || !formData.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get user's display name
      const displayName = user?.user_metadata?.display_name || 
                         user?.user_metadata?.full_name || 
                         user?.user_metadata?.name || 
                         user?.email?.split('@')[0] || 
                         'Anonymous';

      const { data, error } = await supabase
        .from("posts")
        .insert({
          title: formData.title.trim(),
          subject: formData.subject,
          content: formData.content.trim(),
          user_id: user.id,
          author_name: displayName
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Post Created",
        description: "Your post has been published successfully!",
      });

      // Navigate to the new post
      navigate(`/community/post/${data.id}`);
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-light">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/hands-bandaid.png" 
              alt="medsPG Logo" 
              className="h-8 w-8 sm:h-12 sm:w-12 object-contain"
            />
            <span className="font-semibold text-base sm:text-lg tracking-tight">
              <span className="hidden sm:inline">Create New Post</span>
              <span className="sm:hidden">New Post</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={() => navigate("/community")}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Community</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Create a New Discussion</CardTitle>
            <p className="text-sm sm:text-base text-muted-foreground">
              Share your thoughts, ask questions, or start a discussion with fellow medical students.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm sm:text-base">Post Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter a descriptive title for your post..."
                  className="text-base sm:text-lg"
                  maxLength={200}
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {formData.title.length}/200 characters
                </p>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm sm:text-base">Subject *</Label>
                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => handleInputChange("subject", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject category" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm sm:text-base">Post Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="Write your post content here. Be clear, helpful, and respectful..."
                  className="min-h-[150px] sm:min-h-[200px] resize-none text-sm sm:text-base"
                  maxLength={5000}
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {formData.content.length}/5000 characters
                </p>
              </div>

              {/* Guidelines */}
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Community Guidelines</h4>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <li>• Be respectful and professional in your discussions</li>
                  <li>• Stay on topic and relevant to medical education</li>
                  <li>• Provide helpful and accurate information</li>
                  <li>• Use clear and descriptive titles</li>
                  <li>• Search existing posts before creating new ones</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/community")}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.subject || !formData.content.trim()}
                  className="min-w-[100px] sm:min-w-[120px] w-full sm:w-auto"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Creating...</span>
                      <span className="sm:hidden">Create...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">Create Post</span>
                      <span className="sm:hidden">Create</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewPostPage;
