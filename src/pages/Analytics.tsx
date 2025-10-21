import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Target, Calendar, Clock, BarChart3, Activity, Award, BookOpen } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

interface TestResult {
  id: string;
  subject: string;
  score_percent: number;
  correct_count: number;
  wrong_count: number;
  total_questions: number;
  created_at: string;
  time_per_question?: number[]; // Array of time spent per question
}

interface SubjectAverage {
  subject: string;
  averageScore: number;
  totalTests: number;
}

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTestResults();
    }
  }, [user]);

  const fetchTestResults = async () => {
    try {
      const { data, error } = await supabase
        .from('TestResults')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our TestResult interface
      const transformedResults: TestResult[] = (data || []).map((item: any) => ({
        id: item.id,
        subject: item.subject || "",
        score_percent: item.score_percent || 0,
        correct_count: item.correct_count || 0,
        wrong_count: item.wrong_count || 0,
        total_questions: item.total_questions || 0,
        created_at: item.created_at || "",
        time_per_question: item.time_per_question || []
      }));
      
      setResults(transformedResults);
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="mt-4 text-muted-foreground text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Loading your analytics...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Calculate subject-wise averages
  const subjectAverages: SubjectAverage[] = results.reduce((acc, result) => {
    const existing = acc.find(item => item.subject === result.subject);
    if (existing) {
      existing.averageScore = (existing.averageScore * existing.totalTests + result.score_percent) / (existing.totalTests + 1);
      existing.totalTests += 1;
    } else {
      acc.push({
        subject: result.subject,
        averageScore: result.score_percent,
        totalTests: 1
      });
    }
    return acc;
  }, [] as SubjectAverage[]);

  // Prepare data for performance trend chart
  const trendData = results
    .slice()
    .reverse()
    .map((result, index) => ({
      test: 'Test ' + (index + 1),
      score: result.score_percent,
      date: new Date(result.created_at).toLocaleDateString(),
      subject: result.subject
    }));

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 70) return "default";
    if (score >= 50) return "secondary";
    return "destructive";
  };

  // Helper function to format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Calculate time analytics
  const timeAnalytics = results.reduce((acc, result) => {
    if (result.time_per_question && result.time_per_question.length > 0) {
      const totalTime = result.time_per_question.reduce((sum, time) => sum + time, 0);
      const avgTime = totalTime / result.time_per_question.length;
      acc.totalTime += totalTime;
      acc.totalQuestions += result.time_per_question.length;
      acc.testCount += 1;
    }
    return acc;
  }, { totalTime: 0, totalQuestions: 0, testCount: 0 });

  const averageTimePerQuestion = timeAnalytics.totalQuestions > 0 
    ? Math.round(timeAnalytics.totalTime / timeAnalytics.totalQuestions) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-light p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Top App Bar */}
        <motion.div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card/90 backdrop-blur rounded-xl border shadow-lg px-3 sm:px-4 py-3 mb-4 sm:mb-6 gap-3 sm:gap-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <img 
              src="/hands-bandaid.png" 
              alt="medsPG Logo" 
              className="h-12 w-12 object-contain"
            />
            <span className="font-semibold text-lg">MedsPG Analytics</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </motion.div>

          <AnimatePresence mode="wait">
            {results.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      >
                        <Target className="h-16 w-16 text-muted-foreground mx-auto" />
                      </motion.div>
                      <motion.p 
                        className="text-xl font-medium"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        No test results yet
                      </motion.p>
                      <motion.p 
                        className="text-muted-foreground"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        Take some tests to see your analytics here
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button onClick={() => navigate("/dashboard")} size="lg">
                          Start Your First Test
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
            <>
              {/* Performance Overview Cards */}
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Total Tests</CardTitle>
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                      <motion.div 
                        className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      >
                        {results.length}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Average Score</CardTitle>
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <motion.div 
                        className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      >
                        {results.length > 0 
                          ? Math.round(results.reduce((sum, r) => sum + r.score_percent, 0) / results.length)
                          : 0}%
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Avg Time/Question</CardTitle>
                      <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                      <motion.div 
                        className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      >
                        {formatTime(averageTimePerQuestion)}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Subjects Covered</CardTitle>
                      <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                      <motion.div 
                        className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                      >
                        {subjectAverages.length}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Charts Section */}
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {/* Performance Trend Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                >
                  <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-lg font-semibold">Performance Trend</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px] sm:h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="50%" stopColor="#2563eb" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="test" 
                              fontSize={12} 
                              stroke="hsl(var(--muted-foreground))"
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              fontSize={12} 
                              stroke="hsl(var(--muted-foreground))"
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                              }}
                              formatter={(value) => [String(value) + "%", "Score"]}
                              labelFormatter={(label) => {
                                const d = trendData.find((x) => x.test === label);
                                const subject = d ? d.subject : "";
                                const date = d ? d.date : "";
                                return label + " - " + subject + " (" + date + ")";
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="score"
                              stroke="#3b82f6"
                              strokeWidth={3}
                              fill="url(#colorScore)"
                              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "#ffffff" }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Subject-wise Performance */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                >
                  <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-lg font-semibold">Subject-wise Average</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px] sm:h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subjectAverages}>
                            <defs>
                              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                                <stop offset="50%" stopColor="#059669" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#047857" stopOpacity={0.7}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="subject" 
                              fontSize={12} 
                              stroke="hsl(var(--muted-foreground))"
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              fontSize={12} 
                              stroke="hsl(var(--muted-foreground))"
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                              }}
                              formatter={(value, _name, props) => [
                                String(Math.round(Number(value))) + "%",
                                "Average Score (" + String(props?.payload?.totalTests ?? 0) + " tests)"
                              ]}
                            />
                            <Bar 
                              dataKey="averageScore" 
                              fill="url(#colorBar)"
                              radius={[8, 8, 0, 0]}
                              stroke="hsl(var(--primary))"
                              strokeWidth={1}
                              style={{
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Recent Test Results */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-950/10 dark:to-slate-950/10">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/30">
                        <BookOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <CardTitle className="text-lg font-semibold">Recent Test Results</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {results.slice(0, 10).map((result, index) => (
                        <motion.div 
                          key={result.id} 
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-2 rounded-xl hover:shadow-lg transition-all bg-card hover:border-primary/20 gap-3 sm:gap-0 hover:scale-[1.01]"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 1.0 + (index * 0.1) }}
                          whileHover={{ 
                            scale: 1.02, 
                            transition: { duration: 0.2 },
                            boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)"
                          }}
                        >
                          <div className="flex-1 w-full sm:w-auto">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-medium text-sm sm:text-base">{result.subject}</h3>
                              <Badge variant={getScoreBadgeVariant(result.score_percent)} className="text-xs">
                                {result.score_percent}%
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                              <span>📅 {new Date(result.created_at).toLocaleDateString()}</span>
                              <span>✅ {result.correct_count}/{result.total_questions} correct</span>
                              <span>❌ {result.wrong_count} wrong</span>
                              {result.time_per_question && result.time_per_question.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(Math.round(result.time_per_question.reduce((sum, time) => sum + time, 0) / result.time_per_question.length))} avg
                                </span>
                              )}
                            </div>
                          </div>
                          <motion.div 
                            className={`text-xl sm:text-2xl font-bold ${getScoreColor(result.score_percent)} self-end sm:self-auto`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.2 + (index * 0.1), type: "spring", stiffness: 200 }}
                          >
                            {result.score_percent}%
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
            )}
          </AnimatePresence>
        </div>
      </div>
  );
};

export default Analytics;