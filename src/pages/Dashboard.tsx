import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate, useNavigate } from "react-router-dom";
import { 
  Brain, 
  Heart, 
  Microscope, 
  Pill, 
  Bug, 
  Stethoscope, 
  BookOpen, 
  LogOut,
  BarChart3,
  MessageSquare,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Helper function to get user's display name
  const getDisplayName = () => {
    return user?.user_metadata?.display_name || 
           user?.user_metadata?.full_name || 
           user?.user_metadata?.name || 
           user?.email?.split('@')[0] || 
           'User';
  };

  const fallbackSubjects = [
    { name: "Anatomy" },
    { name: "Physiology" },
    { name: "Pathology" },
    { name: "Pharmacology" },
    { name: "Microbiology" },
    { name: "Medicine" },
    { name: "General" },
  ];

  const [subjects, setSubjects] = useState<{ id?: string; name: string }[]>(fallbackSubjects);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAll, setShowAll] = useState<boolean>(false);
  const [testsCompleted, setTestsCompleted] = useState<number>(0);
  const [totalTests, setTotalTests] = useState<number>(50);
  const [averageAccuracy, setAverageAccuracy] = useState<number>(0);
  const [subjectPerformance, setSubjectPerformance] = useState<{ name: string; value: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ subject: string; date: string }[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoadingSubjects(true);
      try {
        // Get unique subjects from Questions table instead of non-existent subjects table
        const { data, error } = await supabase
          .from("Questions")
          .select("subject")
          .order("subject", { ascending: true });
        
        if (!error && data && isMounted && data.length > 0) {
          // Extract unique subjects and convert to the expected format
          const uniqueSubjects = Array.from(new Set(data.map(q => q.subject)))
            .filter(subject => subject) // Remove null/empty subjects
            .map(subject => ({ name: subject }));
          
          if (uniqueSubjects.length > 0) {
            setSubjects(uniqueSubjects);
          }
        }
      } catch (e) {
        // silently fall back
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Load user progress numbers (from TestResults with required columns)
  useEffect(() => {
    let isMounted = true;
    const loadProgress = async () => {
      if (!user?.id) return;
      try {
        // Fetch user results from TestResults
        const { data: results, error } = await supabase
          .from("TestResults")
          .select("id, user_id, subject, score_percent, correct_count, wrong_count, total_questions")
          .eq("user_id", user.id)
          .order("id", { ascending: false })
          .limit(500);

        if (error) throw error;

        if (!isMounted) return;

        const completed = results?.length || 0;
        setTestsCompleted(completed);
        // Use user's completed tests as total for now (single-table source of truth)
        setTotalTests(completed || 0);

        if (results && results.length > 0) {
          // Average accuracy uses score_percent values
          const avg = Math.round(
            results.reduce((acc: number, r: any) => acc + Number(r.score_percent || 0), 0) /
            results.length
          );
          setAverageAccuracy(Number.isFinite(avg) ? Math.max(0, Math.min(100, avg)) : 0);

          // Subject performance as average score_percent per subject
          const bySubject: Record<string, { sum: number; count: number }> = {};
          results.forEach((r: any) => {
            const key = r.subject || "General";
            if (!bySubject[key]) bySubject[key] = { sum: 0, count: 0 };
            bySubject[key].sum += Number(r.score_percent || 0);
            bySubject[key].count += 1;
          });
          const perf = Object.entries(bySubject)
            .map(([name, v]) => ({ name, value: v.count > 0 ? Math.round(v.sum / v.count) : 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
          setSubjectPerformance(perf);

          // Recent activity (last 2) — show subject and score percent
          setRecentActivity(
            results.slice(0, 2).map((r: any) => ({
              subject: r.subject || "General",
              date: `${Math.round(Number(r.score_percent || 0))}%`,
            }))
          );
        } else {
          setAverageAccuracy(0);
          setSubjectPerformance([]);
          setRecentActivity([]);
        }
      } catch (_e) {
        // Keep safe fallbacks
      }
    };

    loadProgress();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Load user points
  useEffect(() => {
    if (!user?.id) return;

    const loadPoints = async () => {
      try {
        const { data, error } = await supabase
          .from("user_points")
          .select("points")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("Error loading points:", error);
          return;
        }

        setUserPoints(data?.points || 0);
      } catch (error) {
        console.error("Error loading points:", error);
      }
    };

    loadPoints();
  }, [user?.id]);

  const iconPool = [Brain, Heart, Microscope, Pill, Bug, Stethoscope, BookOpen];
  const colorPool = [
    "from-blue-100 to-blue-200",
    "from-red-100 to-red-200",
    "from-green-100 to-green-200",
    "from-purple-100 to-purple-200",
    "from-yellow-100 to-yellow-200",
    "from-indigo-100 to-indigo-200",
    "from-pink-100 to-pink-200",
  ];

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(s => s.name.toLowerCase().includes(q));
  }, [subjects, searchQuery]);

  const visibleSubjects = useMemo(() => {
    const list = filteredSubjects;
    return showAll ? list : list.slice(0, 10);
  }, [filteredSubjects, showAll]);

  const handleSubjectSelect = (subject: string) => {
    navigate(`/test/${subject.toLowerCase()}`);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.replace('/');
  };

  return (
    <div className="min-h-screen bg-gradient-light p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Top App Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card/90 backdrop-blur rounded-xl border shadow-lg px-3 sm:px-4 py-3 mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <img 
              src="/hands-bandaid.png" 
              alt="medsPG Logo" 
              className="h-12 w-12 object-contain"
            />
            <span className="font-semibold text-lg">MedsPG</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={() => navigate('/community')}
              className="flex items-center gap-2 text-xs sm:text-sm"
              size="sm"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Community</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 text-xs sm:text-sm"
              size="sm"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard/profile')}
              className="flex items-center gap-2 text-xs sm:text-sm"
              size="sm"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
            <Button variant="outline" onClick={handleLogout} size="sm" className="text-xs sm:text-sm">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Welcome Card */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl sm:text-2xl">Welcome, {getDisplayName()}!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm sm:text-base">Continue your preparation and track your progress.</p>
              </CardContent>
            </Card>

            {/* Search */}
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search subjects or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
              {visibleSubjects.map((subject, index) => {
                const IconComponent = (subject as any).icon;
                const ResolvedIcon = (IconComponent as any) || iconPool[index % iconPool.length];
                return (
                  <motion.div
                    key={subject.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card className="rounded-2xl hover:shadow-lg transition-all border-2 hover:border-primary/20">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-2 sm:p-3 rounded-full bg-primary/10">
                            <ResolvedIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <CardTitle className="text-base sm:text-lg">{subject.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Practice {subject.name.toLowerCase()} questions</p>
                        <Button onClick={() => handleSubjectSelect(subject.name)} className="w-full text-sm sm:text-base" size="sm">
                          Start Test
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Show more */}
            <div className="flex justify-center">
              {filteredSubjects.length > 10 && (
                <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                  {showAll ? "Show less" : "Show more subjects"}
                </Button>
              )}
            </div>
          </div>

          {/* Right Progress Panel */}
          <div className="space-y-4 sm:space-y-6">
            {/* Forum Points Card */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Forum Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{userPoints}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Earn points by participating in community discussions
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={() => navigate('/community')}
                  >
                    Join Community
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-muted-foreground font-semibold">Tests Completed</div>
                    <div className="text-xl sm:text-2xl font-semibold">{testsCompleted}/{totalTests}</div>
                  </div>
                  <div className="col-span-2 grid grid-cols-1 gap-4 sm:gap-6">
                    <div className="text-center text-xs sm:text-sm text-muted-foreground font-semibold">Average Accuracy</div>
                    {/* Average Accuracy circular chart */}
                    <div className="flex items-center justify-center">
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                        <svg viewBox="0 0 36 36" className="h-full w-full">
                          <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray={`${Math.max(0, Math.min(100, averageAccuracy))}, 100`} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-medium">{averageAccuracy}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6">
                  <div className="text-xs sm:text-sm font-medium mb-2">Performance by Subject</div>
                  <div className="grid grid-cols-5 gap-2 sm:gap-3 items-end h-20 sm:h-28">
                    {(subjectPerformance.length ? subjectPerformance : [{ name: "-", value: 0 }, { name: "-", value: 0 }, { name: "-", value: 0 }, { name: "-", value: 0 }, { name: "-", value: 0 }]).map((s, i) => (
                      <div key={i} className="bg-primary/80 rounded-t-md" style={{ height: `${s.value}%` }} />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    {(subjectPerformance.length ? subjectPerformance : new Array(5).fill({ name: "-" })).map((s, i) => (
                      <span key={i} className="text-xs">{s.name.length > 4 ? `${s.name.slice(0, 4)}…` : s.name}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 sm:mt-6">
                  <div className="text-xs sm:text-sm font-medium mb-2">Recent Activity</div>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    {(recentActivity.length ? recentActivity : [{ subject: "-", date: "-" }]).map((r, i) => (
                      <li key={i}>• Test: {r.subject} – {r.date}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 bg-gradient-card border rounded-xl shadow-lg px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-muted-foreground gap-3 sm:gap-0">
          <div className="flex flex-wrap gap-3 sm:gap-6 justify-center sm:justify-start">
            <button className="hover:underline">Support</button>
            <button className="hover:underline">FAQ</button>
            <button className="hover:underline">About</button>
            <button className="hover:underline" onClick={handleLogout}>Logout</button>
          </div>
          <div className="text-center sm:text-right">© {new Date().getFullYear()} MedsPG. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;