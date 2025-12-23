import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle, FileText, Users, Clock, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

interface ImprovedEmptyStateProps {
  onStartApplication: () => void;
}

export const ImprovedEmptyState = ({ onStartApplication }: ImprovedEmptyStateProps) => {
  const steps = [
    { number: 1, text: "Fill out your application", time: "5 min", icon: <FileText className="h-4 w-4" /> },
    { number: 2, text: "Upload required documents", time: "10 min", icon: <Shield className="h-4 w-4" /> },
    { number: 3, text: "Get matched with best lenders", time: "Instant", icon: <Sparkles className="h-4 w-4" /> },
    { number: 4, text: "Receive approval", time: "48-72 hrs", icon: <CheckCircle className="h-4 w-4" /> },
  ];

  const features = [
    { icon: <Zap className="h-5 w-5" />, title: "Fast Processing", desc: "Get approved in 48-72 hours" },
    { icon: <Shield className="h-5 w-5" />, title: "Secure & Private", desc: "Bank-level data encryption" },
    { icon: <Users className="h-5 w-5" />, title: "Expert Support", desc: "Dedicated loan advisors" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-primary/10 via-background to-blue-500/10">
        <CardContent className="p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center">
            {/* Animated Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-scale-in">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Start Your Education Loan Journey
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Get funded for your dream university in just a few steps. We've helped 10,000+ students secure education loans.
            </p>

            <Button 
              size="lg" 
              onClick={onStartApplication} 
              className="h-14 px-8 text-base font-semibold gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              Start New Application
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works - Horizontal Steps */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mb-3">
                    {step.number}
                  </div>
                  <p className="font-medium text-foreground mb-1">{step.text}</p>
                  <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-1 rounded-full">
                    {step.time}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="border border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Social Proof */}
      <Card className="border border-border bg-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-semibold text-primary">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="text-center md:text-left">
              <p className="text-foreground font-medium">
                "I got approved in just 2 days! The process was so smooth."
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                — Priya S., Columbia University
              </p>
            </div>
            <div className="ml-auto hidden md:block">
              <div className="text-3xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">Students Funded</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
