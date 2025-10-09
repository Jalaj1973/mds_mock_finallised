import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const NewPost = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  // Redirect unauthenticated users
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Subject options for the dropdown
  const subjectOptions = [
    "Anatomy",
    "Physiology", 
    "Pathology",
    "Pharmacology",
    "Microbiology",
    "Medicine",
    "Surgery",
    "Obstetrics & Gynecology",
    "Pediatrics",
    "Psychiatry",
    "Radiology",
    "Emergency Medicine",
    "General",
    "Study Tips",
    "Exam Strategy",
    "Other"
  ];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your post.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content Required", 
        description: "Please enter content for your post.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            title: title.trim(),
            subject: subject || "General",
            content: content.trim(),
            author_id: user?.id,
          }
        ])
        .select();

      if (error) {
        console.error("Error creating post:", error);
        // Check if it's a table doesn't exist error
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          toast({
            title: "Database Not Set Up",
            description: "Community posts table not set up yet. Please run the database setup script first.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to Create Post",
            description: error.message || "An error occurred while creating your post.",
            variant: "destructive",
          });
        }
        return;
      }

      // Success
      toast({
        title: "Post Created Successfully",
        description: "Your discussion has been published to the community.",
      });

      // Redirect to community page
      navigate("/community");
      
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/community");
  };

  return (
    <div className="min-h-screen bg-gradient-light">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Ask a Question</h1>
          <p className="text-muted-foreground">
            Start a discussion and connect with fellow medical students preparing for NEET-PG.
          </p>
        </div>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Create New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your question or discussion topic?"
                  className="text-foreground dark:text-white text-base"
                  maxLength={200}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-base font-medium">
                  Subject
                </Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="text-foreground dark:text-white">
                    <SelectValue placeholder="Select a subject (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose the most relevant subject for your post
                </p>
              </div>

              {/* Content Field */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-base font-medium">
                  Content *
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your question or share your thoughts in detail..."
                  className="text-foreground dark:text-white text-base min-h-[200px] resize-y"
                  maxLength={2000}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {content.length}/2000 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 sm:flex-none sm:w-auto"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 sm:flex-none sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publish Post
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium text-foreground mb-2">Tips for a great post:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Be clear and specific in your title</li>
            <li>• Provide context and background information</li>
            <li>• Ask specific questions when seeking help</li>
            <li>• Be respectful and supportive to fellow students</li>
            <li>• Use proper formatting for better readability</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default NewPost;
