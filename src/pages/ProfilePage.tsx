import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Calendar, Save, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  display_name: string;
  college: string | null;
  year: string | null;
  status: string | null;
  last_name_change: string | null;
  created_at: string;
  updated_at: string;
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  
  // Check if name change is restricted
  const canChangeName = () => {
    if (!profile?.last_name_change) return true;
    
    const lastChange = new Date(profile.last_name_change);
    const now = new Date();
    const daysDiff = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysDiff >= 60;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // First try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        setProfile(existingProfile);
        setDisplayName(existingProfile.display_name || "");
        setCollege(existingProfile.college || "");
        setYear(existingProfile.year || "");
        setStatus(existingProfile.status || "");
      } else {
        // Create new profile if doesn't exist
        const displayName = user!.user_metadata?.display_name || 
                           user!.user_metadata?.full_name || 
                           user!.user_metadata?.name || 
                           user!.email?.split('@')[0] || 
                           'User';

        const newProfile = {
          id: user!.id,
          display_name: displayName,
          college: null,
          year: null,
          status: null,
          last_name_change: null
        };

        // Try to create profile with upsert to handle RLS issues
        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .upsert(newProfile, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          // If profile creation fails, try to fetch it again in case it was created by trigger
          const { data: retryProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user!.id)
            .single();
          
          if (retryProfile) {
            setProfile(retryProfile);
            setDisplayName(retryProfile.display_name || "");
            setCollege(retryProfile.college || "");
            setYear(retryProfile.year || "");
            setStatus(retryProfile.status || "");
            return;
          }
          
          throw createError;
        }

        setProfile(createdProfile);
        setDisplayName(displayName);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      setSaving(true);
      
      const updateData: any = {
        college: college || null,
        year: year || null,
        status: status || null,
      };

      // Only update display_name if it changed and is allowed
      if (displayName !== profile.display_name) {
        if (!canChangeName()) {
          toast({
            title: "Name Change Restricted",
            description: "You can change your name again after 60 days.",
            variant: "destructive",
          });
          return;
        }
        
        updateData.display_name = displayName;
        updateData.last_name_change = new Date().toISOString();

        // Update the user's metadata in Supabase Auth
        const { error: authError } = await supabase.auth.updateUser({
          data: { display_name: displayName }
        });

        if (authError) {
          console.error("Error updating auth metadata:", authError);
          toast({
            title: "Warning",
            description: "Profile updated but display name may not reflect in dashboard. Please refresh the page.",
            variant: "destructive",
          });
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      // Reload profile to get updated data
      await loadProfile();

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setDeleting(true);

      // Delete user data from all tables
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.from("user_points").delete().eq("user_id", user.id);
      await supabase.from("posts").delete().eq("user_id", user.id);
      await supabase.from("replies").delete().eq("user_id", user.id);
      await supabase.from("votes").delete().eq("user_id", user.id);

      // Sign out the user
      await signOut();
      
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });

      // Redirect to landing page
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
          <Button onClick={() => navigate("/auth")} className="mt-4">
            Go to Login
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
            <span className="font-semibold text-lg tracking-tight">Profile Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column - User Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="h-fit">
                <CardHeader className="text-center pb-6">
                  <div className="flex flex-col items-center gap-6">
                    <Avatar className="h-32 w-32 border-4 border-primary/20">
                      <AvatarFallback className="text-4xl font-bold bg-primary/10">
                        {getInitials(profile.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <h1 className="text-3xl font-bold mb-2">{profile.display_name}</h1>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {formatDate(profile.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">0</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">0</div>
                      <div className="text-sm text-muted-foreground">Replies</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >

              {/* Profile Form */}
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl">Profile Information</CardTitle>
                  <p className="text-muted-foreground">Update your personal information and preferences</p>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Display Name */}
                    <div className="md:col-span-2 space-y-3">
                      <Label htmlFor="displayName" className="text-base font-medium">Full Name</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={!canChangeName()}
                                className={`text-base h-12 ${!canChangeName() ? "bg-muted" : ""}`}
                                placeholder="Enter your full name"
                              />
                            </div>
                          </TooltipTrigger>
                          {!canChangeName() && (
                            <TooltipContent>
                              <p>You can change your name again after 60 days.</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      {!canChangeName() && (
                        <p className="text-sm text-muted-foreground">
                          You can change your name again after 60 days.
                        </p>
                      )}
                    </div>

                    {/* College */}
                    <div className="space-y-3">
                      <Label htmlFor="college" className="text-base font-medium">College</Label>
                      <Input
                        id="college"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="Enter your college name"
                        className="text-base h-12"
                      />
                    </div>

                    {/* Year */}
                    <div className="space-y-3">
                      <Label htmlFor="year" className="text-base font-medium">Academic Year</Label>
                      <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select your year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="Intern">Intern</SelectItem>
                          <SelectItem value="PG">PG</SelectItem>
                          <SelectItem value="Doctor">Doctor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div className="space-y-3">
                      <Label htmlFor="status" className="text-base font-medium">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select your status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UG">Undergraduate</SelectItem>
                          <SelectItem value="PG">Postgraduate</SelectItem>
                          <SelectItem value="Doctor">Doctor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      size="lg"
                      className="w-full h-12 text-base"
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Saving Changes...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-5 w-5" />
                          Save Changes
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <div className="max-w-4xl mx-auto">
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2 text-xl">
                  <AlertTriangle className="h-6 w-6" />
                  Danger Zone
                </CardTitle>
                <p className="text-muted-foreground">Irreversible and destructive actions</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={deleting} size="lg" className="h-12">
                        <Trash2 className="h-5 w-5 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers. This includes:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Your profile information</li>
                            <li>All your community posts and replies</li>
                            <li>Your voting history and points</li>
                            <li>Your test results and progress</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleting}
                        >
                          {deleting ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Deleting...
                            </div>
                          ) : (
                            "Yes, delete my account"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
