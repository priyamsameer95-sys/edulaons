import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  IndianRupee,
  Clock,
  FileText,
  Shield,
  Sparkles,
  Building2,
  Users,
  Zap,
  Star,
  ChevronRight
} from "lucide-react";

const COUNTRIES = [
  { code: "USA", name: "United States", flag: "🇺🇸", universities: "500+" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧", universities: "150+" },
  { code: "Canada", name: "Canada", flag: "🇨🇦", universities: "100+" },
  { code: "Australia", name: "Australia", flag: "🇦🇺", universities: "50+" },
  { code: "Germany", name: "Germany", flag: "🇩🇪", universities: "80+" },
  { code: "Ireland", name: "Ireland", flag: "🇮🇪", universities: "30+" },
];

const LOAN_INFO = {
  minAmount: "₹5 Lakhs",
  maxAmount: "₹1 Crore+",
  interestRate: "9.5% - 12.5%",
  processingTime: "48-72 Hours",
  processingFee: "0.5% - 1%",
};

const DOCUMENTS_REQUIRED = [
  { name: "Passport & Visa", description: "Valid passport copy" },
  { name: "Admission Letter", description: "From university" },
  { name: "Academic Records", description: "10th, 12th, Degree" },
  { name: "Co-applicant KYC", description: "Aadhaar, PAN" },
  { name: "Income Proof", description: "ITR, Salary slips" },
  { name: "Bank Statements", description: "Last 6 months" },
];

const TIMELINE = [
  { step: 1, title: "Apply", duration: "5 mins", description: "Fill basic details" },
  { step: 2, title: "Documents", duration: "1-2 days", description: "Upload required docs" },
  { step: 3, title: "Review", duration: "24-48 hrs", description: "Lender evaluation" },
  { step: 4, title: "Approval", duration: "2-3 days", description: "Get sanctioned" },
  { step: 5, title: "Disbursement", duration: "1-2 days", description: "Funds transferred" },
];

const StudentLanding = () => {
  const navigate = useNavigate();
  const [eligibilityForm, setEligibilityForm] = useState({
    loanAmount: "",
    destination: "",
    hasAdmission: "",
  });
  const [showResult, setShowResult] = useState(false);

  const handleCheckEligibility = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResult(true);
  };

  const isEligible = eligibilityForm.loanAmount && eligibilityForm.destination;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">EduLoanPro</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Apply Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero + Eligibility Check */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-blue-500/5 py-16 lg:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-6">
              <Badge variant="secondary" className="gap-2 px-4 py-2">
                <Sparkles className="h-3.5 w-3.5" />
                Trusted by 10,000+ Students
              </Badge>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Fund Your <span className="text-primary">Dream Education</span> Abroad
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Get education loans from ₹5 Lakhs to ₹1 Crore+ with competitive rates. 
                Fast approval, minimal documentation, zero stress.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">48 Hours</div>
                    <div className="text-xs text-muted-foreground">Avg. Approval</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">9.5%</div>
                    <div className="text-xs text-muted-foreground">Starting Rate</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">15+</div>
                    <div className="text-xs text-muted-foreground">Partner Lenders</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Eligibility Check Card */}
            <Card className="shadow-2xl border-0 bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Quick Eligibility Check
                </CardTitle>
                <p className="text-sm text-muted-foreground">Takes less than 30 seconds</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCheckEligibility} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Loan Amount Required</Label>
                    <Select 
                      value={eligibilityForm.loanAmount}
                      onValueChange={(v) => setEligibilityForm(p => ({ ...p, loanAmount: v }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select amount range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5-10">₹5 - 10 Lakhs</SelectItem>
                        <SelectItem value="10-25">₹10 - 25 Lakhs</SelectItem>
                        <SelectItem value="25-50">₹25 - 50 Lakhs</SelectItem>
                        <SelectItem value="50-75">₹50 - 75 Lakhs</SelectItem>
                        <SelectItem value="75+">₹75 Lakhs+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Study Destination</Label>
                    <Select 
                      value={eligibilityForm.destination}
                      onValueChange={(v) => setEligibilityForm(p => ({ ...p, destination: v }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Where are you going?" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Do you have admission?</Label>
                    <Select 
                      value={eligibilityForm.hasAdmission}
                      onValueChange={(v) => setEligibilityForm(p => ({ ...p, hasAdmission: v }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes, I have admission</SelectItem>
                        <SelectItem value="applied">Applied, waiting for offer</SelectItem>
                        <SelectItem value="no">Not yet, still deciding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-semibold gap-2">
                    Check My Eligibility
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                {showResult && isEligible && (
                  <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                          Great news! You're likely eligible
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                          Based on your inputs, you qualify for loans with multiple lenders.
                        </p>
                        <Button 
                          className="mt-3 gap-2" 
                          onClick={() => navigate("/login")}
                        >
                          Start Full Application
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Loan Info Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Loan Details at a Glance
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transparent terms, competitive rates, and flexible repayment options
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-card border-border text-center p-6">
              <IndianRupee className="h-8 w-8 mx-auto text-primary mb-3" />
              <div className="text-2xl font-bold text-foreground">{LOAN_INFO.minAmount}</div>
              <div className="text-sm text-muted-foreground">Minimum Loan</div>
            </Card>
            <Card className="bg-card border-border text-center p-6">
              <IndianRupee className="h-8 w-8 mx-auto text-primary mb-3" />
              <div className="text-2xl font-bold text-foreground">{LOAN_INFO.maxAmount}</div>
              <div className="text-sm text-muted-foreground">Maximum Loan</div>
            </Card>
            <Card className="bg-card border-border text-center p-6">
              <Star className="h-8 w-8 mx-auto text-amber-500 mb-3" />
              <div className="text-2xl font-bold text-foreground">{LOAN_INFO.interestRate}</div>
              <div className="text-sm text-muted-foreground">Interest Rate p.a.</div>
            </Card>
            <Card className="bg-card border-border text-center p-6">
              <Zap className="h-8 w-8 mx-auto text-emerald-500 mb-3" />
              <div className="text-2xl font-bold text-foreground">{LOAN_INFO.processingTime}</div>
              <div className="text-sm text-muted-foreground">Approval Time</div>
            </Card>
            <Card className="bg-card border-border text-center p-6">
              <FileText className="h-8 w-8 mx-auto text-blue-500 mb-3" />
              <div className="text-2xl font-bold text-foreground">{LOAN_INFO.processingFee}</div>
              <div className="text-sm text-muted-foreground">Processing Fee</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Eligible Countries */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              <Globe className="inline h-8 w-8 mr-2 text-primary" />
              Supported Destinations
            </h2>
            <p className="text-muted-foreground">We cover top universities across these countries</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {COUNTRIES.map((country) => (
              <Card key={country.code} className="bg-card border-border p-5 text-center hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="text-4xl mb-3">{country.flag}</div>
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {country.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {country.universities} Universities
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Documents Required */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              <FileText className="inline h-8 w-8 mr-2 text-primary" />
              Documents You'll Need
            </h2>
            <p className="text-muted-foreground">Keep these ready to speed up your application</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOCUMENTS_REQUIRED.map((doc, i) => (
              <Card key={i} className="bg-card border-border p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{doc.name}</div>
                  <div className="text-sm text-muted-foreground">{doc.description}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              <Clock className="inline h-8 w-8 mr-2 text-primary" />
              Your Journey to Approval
            </h2>
            <p className="text-muted-foreground">Simple 5-step process from application to disbursement</p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {TIMELINE.map((step, i) => (
              <div key={step.step} className="flex-1 flex md:flex-col items-center gap-4 md:text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {step.step}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{step.title}</div>
                  <div className="text-sm text-primary font-medium">{step.duration}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {i < TIMELINE.length - 1 && (
                  <ChevronRight className="hidden md:block h-6 w-6 text-muted-foreground/50 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Application?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of students who've funded their dreams through EduLoanPro. 
            Apply now and get a decision within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="h-14 px-8 text-lg font-semibold gap-2"
              onClick={() => navigate("/login")}
            >
              Start Application
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Shield className="h-4 w-4" />
              Secure & Encrypted
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-muted/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 EduLoanPro. All rights reserved.</p>
          <p className="mt-2">
            Helping students achieve their international education dreams.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StudentLanding;
