import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  subject: string;
  explanation: string;
}

interface ResultItem {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  isSkipped?: boolean;
  timeSpent?: number; // Time spent on this question in seconds
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { results, score, total, timePerQuestion, skippedCount, wrongCount } = location.state || {};
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Add time spent to each result item
  const resultsWithTime = results?.map((result: ResultItem, index: number) => ({
    ...result,
    timeSpent: timePerQuestion?.[index] || 0
  })) || [];

  useEffect(() => {
    const saveResults = async () => {
      if (!user || !results || score === undefined || total === undefined) return;

      // Get subject from first question (all questions in a test are from same subject)
      const subject = results[0]?.question?.subject || '';
      
      const resultData: any = {
        user_id: user.id,
        subject: subject,
        score_percent: Math.round((score / total) * 100),
        correct_count: score,
        wrong_count: typeof wrongCount === 'number' ? wrongCount : (results?.length || 0) - score - (skippedCount || 0),
        skipped_count: typeof skippedCount === 'number' ? skippedCount : (results?.filter((r: ResultItem) => r.isSkipped).length || 0),
        total_questions: total
      };
      if (Array.isArray(timePerQuestion)) {
        resultData.time_per_question = timePerQuestion;
      }

      try {
        const { error } = await supabase
          .from('TestResults')
          .insert([resultData]);

        if (error) {
          console.error('Error saving test results:', error);
        } else {
          console.log('Test results saved successfully:', resultData);
        }
      } catch (error) {
        console.error('Error saving test results:', error);
      }
    };

    saveResults();
  }, [user, results, score, total]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!results || score === undefined || total === undefined) {
    return <Navigate to="/dashboard" replace />;
  }

  const percentage = Math.round((score / total) * 100);
  const getScoreColor = () => {
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const currentResult = resultsWithTime?.[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === (resultsWithTime?.length || 0) - 1;

  // Helper function to format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-light p-2 sm:p-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Main Content Area */}
        <div className="flex-1 space-y-4 sm:space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card/90 backdrop-blur rounded-xl border shadow-lg px-3 sm:px-4 py-3 gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Subjects</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="flex items-center gap-2">
                <img 
                  src="/hands-bandaid.png" 
                  alt="medsPG Logo" 
                  className="h-10 w-10 object-contain"
                />
                <h1 className="text-base sm:text-lg font-semibold">Test Results</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <ThemeToggle />
              <div className={`text-base sm:text-lg font-bold ${getScoreColor()}`}>{percentage}%</div>
            </div>
          </div>

          {/* Overall Score Card */}
          <Card className="rounded-2xl shadow-lg border-2">
            <CardHeader>
              <CardTitle className="text-center text-base sm:text-lg">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3 sm:space-y-4">
                <div className={`text-4xl sm:text-6xl font-bold ${getScoreColor()}`}>
                  {percentage}%
                </div>
                <div className="text-lg sm:text-xl text-muted-foreground">
                  {score} out of {total} questions correct
                </div>
                <div className="flex justify-center gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{score}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-red-600">{wrongCount || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Incorrect</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600">{skippedCount || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Skipped</div>
                  </div>
                </div>
                
                {/* Time Summary */}
                {timePerQuestion && timePerQuestion.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Total Time: {formatTime(timePerQuestion.reduce((sum, time) => sum + time, 0))}</span>
                      <span>•</span>
                      <span>Avg: {formatTime(Math.round(timePerQuestion.reduce((sum, time) => sum + time, 0) / timePerQuestion.length))}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Question Review */}
          {currentResult && (
            <Card className="rounded-2xl shadow-lg border-2">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <span className="text-xs sm:text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                      Q{currentQuestionIndex + 1} of {results.length}
                    </span>
                    <span className="text-sm sm:text-base">{currentResult.question.subject}</span>
                  </CardTitle>
                  {currentResult.isSkipped ? (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                      Skipped
                    </Badge>
                  ) : currentResult.isCorrect ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Correct
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Incorrect
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <p className="font-medium text-base sm:text-lg">{currentResult.question.question_text}</p>
                  {currentResult.timeSpent !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-lg">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{formatTime(currentResult.timeSpent)}</span>
                    </div>
                  )}
                </div>
                
                <div className="grid gap-2">
                  {currentResult.question.options?.map((option, optIndex) => {
                    const isCorrect = option === currentResult.question.correct_answer;
                    const isUserAnswer = option === currentResult.userAnswer;
                    
                    let className = "p-2 sm:p-3 border rounded-xl";
                    if (isCorrect) {
                      className += " bg-green-50 border-green-200 text-green-800";
                    } else if (isUserAnswer && !isCorrect) {
                      className += " bg-red-50 border-red-200 text-red-800";
                    }
                    
                    return (
                      <div key={optIndex} className={className}>
                        <div className="flex items-center gap-2">
                          {isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {isUserAnswer && !isCorrect && <XCircle className="h-4 w-4 text-red-600" />}
                          <span className="text-sm sm:text-base">{option}</span>
                          {isUserAnswer && (
                            <Badge variant="outline" className="ml-auto text-xs">
                              Your Answer
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {currentResult.isSkipped && (
                  <div className="text-xs sm:text-sm text-muted-foreground">No option selected for this question.</div>
                )}

                {currentResult.question.explanation && (
                  <div className="bg-muted p-3 sm:p-4 rounded-xl">
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Explanation:</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {currentResult.question.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={isFirstQuestion}
              className="text-sm sm:text-base"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {!isLastQuestion ? (
                <Button onClick={handleNext} className="text-sm sm:text-base" size="sm">
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate(`/test/${results?.[0]?.question?.subject?.toLowerCase() || 'general'}`)}
                  className="flex items-center gap-2 text-sm sm:text-base"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Test
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Question Navigation */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="sticky top-4">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Question Review</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Click any number to review that question
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {resultsWithTime?.map((result: ResultItem, index: number) => {
                    const isCurrent = index === currentQuestionIndex;
                    const isCorrect = result.isCorrect;
                    const isSkipped = result.isSkipped;
                    
                    return (
                      <Button
                        key={index}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`
                          h-8 w-8 sm:h-10 sm:w-10 p-0 text-xs sm:text-sm font-medium
                          ${isCorrect 
                            ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                            : isSkipped
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                            : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                          }
                          ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                        `}
                        title={`Q${index + 1}: ${result.timeSpent ? formatTime(result.timeSpent) : '0s'} - ${isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}`}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
                    <span className="text-muted-foreground">Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
                    <span className="text-muted-foreground">Skipped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
                    <span className="text-muted-foreground">Incorrect</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Hover for time spent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;