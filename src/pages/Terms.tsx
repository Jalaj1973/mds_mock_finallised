import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const Terms = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-light p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-card/90 backdrop-blur rounded-xl border shadow-sm px-4 py-3">
          <h1 className="text-lg font-semibold">Terms & Conditions</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate("/")}>Back to Home</Button>
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>1. Introduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Welcome to our MedsPG platform (the "Service"). By accessing or using the
              Service, you agree to these Terms & Conditions. If you do not agree, please do not use the
              Service.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>2. Content Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Questions and explanations provided in the Service are generic, educational, and
              designed for practice purposes only. We strive to ensure that no content infringes on any
              third-party copyrights or proprietary material.
            </p>
            <p>
              If you believe that any content violates your rights, please contact us at
              <a href="mailto:jalajbalodi264@gmail.com" className="ml-1 underline">jalajbalodi264@gmail.com</a>
              and we will review and, if appropriate, remove the material.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>3. License to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              We grant you a limited, non-exclusive, non-transferable license to access and use the
              Service for personal, non-commercial study and preparation. You may not resell, distribute,
              or publicly share the content without prior permission.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>4. Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              The Service and its content are provided "as is" for educational purposes. We do not
              guarantee accuracy, completeness, or outcomes. Exam patterns and syllabi may change; users
              should verify information from official sources.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>5. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>6. Changes to These Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              We may update these Terms from time to time. Continued use of the Service constitutes
              acceptance of the updated Terms.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>7. Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              For questions or concerns regarding these Terms, contact: {" "}
              <a href="mailto:jalajbalodi264@gmail.com" className="underline">jalajbalodi264@gmail.com</a>
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">Return to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;


