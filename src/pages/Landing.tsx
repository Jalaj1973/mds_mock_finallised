import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import CustomAuth from "./Auth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const primaryBlue = "#2563EB";
const accentGreen = "#10B981";

function useFadeIn(delay: number = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2";
}

const handleLogin = () => {
  // Placeholder: open Supabase auth modal later
  console.log("Login clicked");
};

const handleSignUp = () => {
  // Placeholder: open Supabase auth modal later
  console.log("Sign Up clicked");
};

// Auth Modal Content Component
const AuthModalContent = ({ onClose }: { onClose: () => void }) => {
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Full Name Required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(email, password, fullName.trim());
    
    if (error) {
      toast({
        title: "Signup Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
      onClose();
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Login Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onClose();
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: "Google Sign-in Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        {/* Google Sign-in Button */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Google"}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
        </div>
        
        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-foreground dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-foreground dark:text-white"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-fullname">Full Name</Label>
              <Input
                id="signup-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter your full name"
                className="text-foreground dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-foreground dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-foreground dark:text-white"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign Up
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Landing = () => {
  const heroFade = useFadeIn(100);
  const analyticsFade = useFadeIn(300);
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setAuthOpen(false);
          navigate("/dashboard", { replace: true });
        }
        // On SIGNED_OUT, let page guards or explicit navigation handle redirects
      });
      return () => {
        data.subscription.unsubscribe();
      };
    } catch (error) {
      // Fail-safe: do nothing so landing still renders
      // eslint-disable-next-line no-console
      console.error("Supabase auth subscription failed", error);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-light relative overflow-hidden">
      <BackgroundRippleEffect />
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Sign in or create an account</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <AuthModalContent onClose={() => setAuthOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/hands-bandaid.png" 
              alt="medsPG Logo" 
              className="h-12 w-12 object-contain"
            />
            <span className="font-semibold text-lg tracking-tight">MedsPG</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#subjects" className="hover:text-foreground transition-colors">Subjects</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={() => { handleLogin(); setAuthOpen(true); }}
              className="hover:shadow-md hover:shadow-blue-200 transition-shadow"
            >
              Login
            </Button>
            <Button
              onClick={() => { handleSignUp(); setAuthOpen(true); }}
              className="bg-green-600 hover:bg-green-700 text-white rounded hover:shadow-lg hover:shadow-emerald-200 transition-all"
              style={{ backgroundColor: undefined }}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16 md:pt-16 md:pb-24 relative z-10">
        <div className={`grid md:grid-cols-2 gap-10 items-center transition-all duration-700 ${heroFade}`}>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Crack NEET-PG with Smarter Practice.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Full-length mock tests and subject-wise practice with powerful analytics.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                onClick={() => { handleSignUp(); setAuthOpen(true); }}
                className="bg-green-600 hover:bg-green-700 text-white rounded hover:shadow-[0_10px_25px_rgba(16,185,129,0.35)] transition-all"
                style={{ backgroundColor: undefined }}
                size="lg"
              >
                Start Free Test
              </Button>
              <Button
                variant="outline"
                onClick={() => { handleSignUp(); setAuthOpen(true); }}
                className="border-gray-300 hover:shadow-md hover:shadow-blue-100 transition-shadow"
                size="lg"
              >
                Sign Up Free
              </Button>
            </div>
          </div>
          <div className="relative h-[260px] md:h-[360px] flex items-center justify-center">
            <img 
              src="/medicine.gif" 
              alt="Medical Education Animation"
              className="w-4/5 md:w-3/4 lg:w-2/3 h-auto object-cover hover:scale-105 transition-transform duration-300 mix-blend-multiply rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gradient-card py-14 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Exam-like Mocks", emoji: "📝" },
              { title: "Subject-wise Practice", emoji: "📚" },
              { title: "Smart Analytics", emoji: "📈" },
              { title: "Secure Login", emoji: "🔒" },
            ].map((f) => (
              <Card key={f.title} className="hover:shadow-lg transition-shadow rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <span className="text-2xl" aria-hidden>{f.emoji}</span>
                    {f.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">High quality experience designed to mirror the real exam.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Preview */}
      <section id="subjects" className="py-14 bg-gradient-to-b from-muted/50 to-background relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
            <h2 className="text-2xl font-bold">Popular Subjects</h2>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => { handleSignUp(); setAuthOpen(true); }} className="hover:shadow-md">Explore all subjects → Sign Up Free</Button>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Medicine", desc: "Clinical scenarios and core concepts" },
              { title: "Pathology", desc: "Patterns, slides, and mechanisms" },
              { title: "Microbiology", desc: "Bugs, drugs, and immunity" },
            ].map((s) => (
              <Card key={s.title} className="rounded-2xl hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-14 bg-gradient-card relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">Simple Pricing</h2>
          <div className={`transition-all duration-700 ${analyticsFade}`}>
            <div className="relative overflow-hidden rounded-2xl border bg-card p-10 text-center shadow-xl">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-muted/50 to-transparent" style={{ animation: 'shine 4s linear infinite' }} />
              </div>

              <div className="inline-flex items-center justify-center gap-3 mb-3">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm font-medium text-amber-700">Under Construction</span>
              </div>

              <div className="text-3xl font-extrabold tracking-tight text-foreground">Pricing Coming Soon</div>
              <p className="mt-3 text-muted-foreground">We're crafting plans to fit every learner. Stay tuned!</p>

              <div className="mt-6 flex items-center justify-center gap-1 text-muted-foreground">
                <span className="animate-bounce [animation-delay:0ms]">•</span>
                <span className="animate-bounce [animation-delay:150ms]">•</span>
                <span className="animate-bounce [animation-delay:300ms]">•</span>
              </div>

              <div className="mt-8">
                <Button onClick={() => { handleSignUp(); setAuthOpen(true); }} className="rounded px-6">Notify Me</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t bg-gradient-to-r from-muted/40 to-muted/60 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Made by <span className="font-medium">Jalaj Balodi</span> ·
            <a href="mailto:jalajbalodi264@gmail.com" className="ml-2 hover:underline">jalajbalodi264@gmail.com</a>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/about" className="hover:underline text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="hover:underline text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            <Link to="/terms" className="hover:underline text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;