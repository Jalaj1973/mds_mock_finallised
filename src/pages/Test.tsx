import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronLeft, ChevronRight, FileCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  subject: string;
  explanation: string;
}

const Test = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subject } = useParams<{ subject: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0); // seconds
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);

  useEffect(() => {
    if (user) {
      fetchQuestions();
    }
  }, [user]);

  // Countdown effect
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!loading && questions.length > 0) {
        handleSubmit();
      }
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft, loading, questions.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key >= '1' && e.key <= '9') {
          const questionNum = parseInt(e.key) - 1;
          if (questionNum < questions.length) {
            setCurrentQuestionIndex(questionNum);
          }
        } else if (e.key === '0' && questions.length >= 10) {
          setCurrentQuestionIndex(9);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [questions.length]);

  const fetchQuestions = async () => {
    try {
      const subjectName = subject?.charAt(0).toUpperCase() + subject?.slice(1) || 'General';
      
      const { data, error } = await supabase
        .from("Questions")
        .select("*")
        .ilike("subject", subjectName);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Questions Found",
          description: `No questions available for ${subjectName}. Please try another subject.`,
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Transform the data to match our Question interface
      const transformedQuestions: Question[] = (data || []).map((item: any) => ({
        id: item.id,
        question_text: item.question_text || "",
        options: Array.isArray(item.options) ? item.options : [],
        correct_answer: item.correct_answer || "",
        subject: item.subject || "",
        explanation: item.explanation || "",
      }));

      // Randomize questions using JavaScript
      const shuffledQuestions = transformedQuestions.sort(() => Math.random() - 0.5);
      
      // Take up to 20 questions (or all if fewer than 20)
      const selectedQuestions = shuffledQuestions.slice(0, 20);
      
      setQuestions(selectedQuestions);
      // Global timer: ~1.05 minutes per question (≈63s). For 20 Qs → ~20 min
      const totalSeconds = Math.round(selectedQuestions.length * 63);
      setTimeLeft(totalSeconds);
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
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
          <p className="mt-2 text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No questions available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const now = Date.now();
      const elapsed = Math.max(0, Math.round((now - questionStartTime) / 1000));
      setTimePerQuestion(prev => {
        const copy = [...prev];
        copy[currentQuestionIndex] = (copy[currentQuestionIndex] || 0) + elapsed;
        return copy;
      });
      setQuestionStartTime(now);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    // capture final question time
    const now = Date.now();
    const elapsed = Math.max(0, Math.round((now - questionStartTime) / 1000));
    const finalTimes = (() => {
      const copy = [...timePerQuestion];
      copy[currentQuestionIndex] = (copy[currentQuestionIndex] || 0) + elapsed;
      return copy;
    })();
    const results = questions.map(question => {
      const userAnswer = answers[question.id] || "";
      const isSkipped = userAnswer === "";
      const isCorrect = !isSkipped && userAnswer === question.correct_answer;
      return {
        question,
        userAnswer,
        isCorrect,
        isSkipped,
      };
    });

    const score = results.filter(r => r.isCorrect).length;
    const skippedCount = results.filter(r => (r as any).isSkipped).length;
    const wrongCount = results.length - score - skippedCount;
    
    navigate("/results", { 
      state: { 
        results,
        score,
        total: questions.length,
        timePerQuestion: finalTimes,
        skippedCount,
        wrongCount
      } 
    });
  };

  const answeredQuestions = Object.keys(answers).length;

  const subjectName = subject?.charAt(0).toUpperCase() + subject?.slice(1) || 'General';

  return (
    <div className="min-h-screen bg-gradient-light p-2 sm:p-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Main Content Area */}
        <div className="flex-1 space-y-4 sm:space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card/90 backdrop-blur rounded-xl border shadow-lg px-3 sm:px-4 py-3 gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
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
                <h1 className="text-base sm:text-lg font-semibold">{subjectName} Test</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
              <ThemeToggle />
              <div className={`font-semibold text-sm sm:text-base ${timeLeft <= 300 ? 'text-red-600' : 'text-foreground'}`}>
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                {(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Q{currentQuestionIndex + 1}/{questions.length}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-2">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <CardTitle className="text-base sm:text-lg">
                  {currentQuestion.subject}
                </CardTitle>
                <span className="text-xs sm:text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                  {answeredQuestions}/{questions.length} answered
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <p className="text-base sm:text-lg leading-relaxed">
                {currentQuestion.question_text}
              </p>

              <RadioGroup 
                value={answers[currentQuestion.id] || ""} 
                onValueChange={handleAnswerChange}
                className="space-y-2 sm:space-y-3"
              >
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-3">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer p-2 sm:p-3 border-2 border-border rounded-xl hover:bg-primary/10 hover:border-primary/30 transition-all text-sm sm:text-base"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

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
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base" size="sm">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Submit Test
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
                <CardTitle className="text-base sm:text-lg">Question Navigation</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Click any number to jump • Ctrl+1-9 for quick access
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const isAnswered = answers[questions[index].id];
                    const isCurrent = index === currentQuestionIndex;
                    const isVisited = timePerQuestion[index] > 0;
                    
                    return (
                      <Button
                        key={index}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`
                          h-8 w-8 sm:h-10 sm:w-10 p-0 text-xs sm:text-sm font-medium
                          ${isAnswered 
                            ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                            : isVisited 
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                            : ''
                          }
                          ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                        `}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
                    <span className="text-muted-foreground">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
                    <span className="text-muted-foreground">Visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted border border-border"></div>
                    <span className="text-muted-foreground">Not visited</span>
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

export default Test;