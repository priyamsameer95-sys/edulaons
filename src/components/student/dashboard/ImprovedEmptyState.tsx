import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle, FileText, Users, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ImprovedEmptyStateProps {
  onStartApplication: () => void;
}

export const ImprovedEmptyState = ({ onStartApplication }: ImprovedEmptyStateProps) => {
  const steps = [
    { number: 1, text: "Fill out your application (5 minutes)" },
    { number: 2, text: "Upload required documents" },
    { number: 3, text: "Get matched with best lenders" },
    { number: 4, text: "Receive approval in 48-72 hours" },
  ];

  const requirements = [
    "Valid passport or government ID",
    "Academic transcripts and certificates",
    "University admission letter (if available)",
    "Co-applicant details (for secured loans)",
  ];

  return (
    <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/10">
      <CardContent className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Start Your Education Loan Journey
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            You haven't started any applications yet. Let's get you started on securing funding for your dream university.
          </p>

          <Separator className="my-8" />

          {/* How It Works */}
          <div className="text-left mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {steps.map((step) => (
                <div key={step.number} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                    {step.number}
                  </div>
                  <p className="text-foreground pt-1">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-8" />

          {/* What You'll Need */}
          <div className="text-left mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              What You'll Need
            </h3>
            <ul className="space-y-3">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator className="my-8" />

          {/* Testimonial */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <Users className="h-6 w-6 text-primary mx-auto mb-3" />
            <p className="text-foreground italic mb-3">
              "I got approved in just 2 days! The process was so smooth and transparent. 
              EduLoanPro made my dream of studying abroad a reality."
            </p>
            <p className="text-sm text-muted-foreground font-semibold">
              - Priya S., Columbia University
            </p>
          </div>

          {/* CTA */}
          <Button size="lg" onClick={onStartApplication} className="h-12 px-8 text-base">
            <GraduationCap className="mr-2 h-5 w-5" />
            Start New Application
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
