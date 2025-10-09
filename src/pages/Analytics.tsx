import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Target, Calendar, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ThemeToggle } from "@/components/ThemeToggle";

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card/90 backdrop-blur rounded-xl border shadow-lg px-3 sm:px-4 py-3 mb-4 sm:mb-6 gap-3 sm:gap-0">
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
        </div>

          {results.length === 0 ? (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-lg font-medium">No test results yet</p>
                  <p className="text-muted-foreground">Take some tests to see your analytics here</p>
                  <Button onClick={() => navigate("/dashboard")}>
                    Start Your First Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Performance Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total Tests</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{results.length}</div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Average Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">
                      {results.length > 0 
                        ? Math.round(results.reduce((sum, r) => sum + r.score_percent, 0) / results.length)
                        : 0}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Avg Time/Question</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">
                      {formatTime(averageTimePerQuestion)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Subjects Covered</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{subjectAverages.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Performance Trend Chart */}
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Performance Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="test" fontSize={12} />
                          <YAxis domain={[0, 100]} fontSize={12} />
                          <Tooltip
                            formatter={(value) => [String(value) + "%", "Score"]}
                            labelFormatter={(label) => {
                              const d = trendData.find((x) => x.test === label);
                              const subject = d ? d.subject : "";
                              const date = d ? d.date : "";
                              return label + " - " + subject + " (" + date + ")";
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject-wise Performance */}
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Subject-wise Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectAverages}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" fontSize={12} />
                          <YAxis domain={[0, 100]} fontSize={12} />
                          <Tooltip
                            formatter={(value, _name, props) => [
                              String(Math.round(Number(value))) + "%",
                              "Average Score (" + String(props?.payload?.totalTests ?? 0) + " tests)"
                            ]}
                          />
                          <Bar 
                            dataKey="averageScore" 
                            fill="hsl(var(--primary))" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Test Results */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Recent Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {results.slice(0, 10).map((result) => (
                      <div 
                        key={result.id} 
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-2 rounded-xl hover:shadow-lg transition-all bg-card hover:border-primary/20 gap-3 sm:gap-0"
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
                        <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(result.score_percent)} self-end sm:self-auto`}>
                          {result.score_percent}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    
  );
};

export default Analytics;