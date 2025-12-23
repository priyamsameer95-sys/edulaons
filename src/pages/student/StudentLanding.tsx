import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  GraduationCap, 
  ArrowRight, 
  Sparkles,
  Check,
  TrendingUp,
  Clock,
  Shield,
  Star,
  ChevronRight,
  Zap
} from "lucide-react";
import { formatIndianNumber } from "@/utils/currencyFormatter";

// Country data with flag emojis
const COUNTRIES = [
  { code: "USA", name: "USA", flag: "🇺🇸", maxLoan: 75, popular: true },
  { code: "UK", name: "UK", flag: "🇬🇧", maxLoan: 60, popular: true },
  { code: "Canada", name: "Canada", flag: "🇨🇦", maxLoan: 50, popular: true },
  { code: "Australia", name: "Australia", flag: "🇦🇺", maxLoan: 55, popular: false },
  { code: "Germany", name: "Germany", flag: "🇩🇪", maxLoan: 40, popular: false },
  { code: "Ireland", name: "Ireland", flag: "🇮🇪", maxLoan: 35, popular: false },
];

// Mock lender data - would come from DB in real app
const LENDERS = [
  { 
    id: "hdfc", 
    name: "HDFC Credila", 
    logo: "🏦",
    minRate: 9.5, 
    maxRate: 11.5,
    minAmount: 5,
    maxAmount: 100,
    processingDays: 3,
    badge: "Fastest Approval"
  },
  { 
    id: "avanse", 
    name: "Avanse", 
    logo: "🏛️",
    minRate: 10.0, 
    maxRate: 12.0,
    minAmount: 5,
    maxAmount: 75,
    processingDays: 5,
    badge: "Best for USA"
  },
  { 
    id: "axis", 
    name: "Axis Bank", 
    logo: "💳",
    minRate: 10.5, 
    maxRate: 12.5,
    minAmount: 10,
    maxAmount: 50,
    processingDays: 4,
    badge: null
  },
  { 
    id: "incred", 
    name: "InCred", 
    logo: "💎",
    minRate: 11.0, 
    maxRate: 13.0,
    minAmount: 3,
    maxAmount: 40,
    processingDays: 2,
    badge: "Quick Disbursal"
  },
];

// Calculate EMI
const calculateEMI = (principal: number, rate: number, years: number = 10): number => {
  const monthlyRate = rate / 12 / 100;
  const months = years * 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi);
};

const StudentLanding = () => {
  const navigate = useNavigate();
  const [loanAmount, setLoanAmount] = useState([35]); // In lakhs
  const [selectedCountry, setSelectedCountry] = useState<string | null>("USA");
  const [isHovering, setIsHovering] = useState<string | null>(null);

  // Get eligible lenders based on loan amount
  const eligibleLenders = useMemo(() => {
    const amount = loanAmount[0];
    return LENDERS
      .filter(l => amount >= l.minAmount && amount <= l.maxAmount)
      .sort((a, b) => a.minRate - b.minRate)
      .slice(0, 3);
  }, [loanAmount]);

  // Format amount for display
  const formatAmount = (value: number): string => {
    if (value >= 100) return "₹1 Cr+";
    return `₹${value} Lakhs`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Minimal Header */}
      <header className="relative z-10 px-4 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">EduLoanPro</span>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Main Hero Section - Single Screen Focus */}
      <main className="relative z-10 px-4 md:px-8 pb-24">
        <div className="max-w-4xl mx-auto pt-8 md:pt-16">
          
          {/* Headline */}
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              15,000+ students funded
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
              How much do you need
              <br />
              <span className="text-primary">for your studies?</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Drag the slider, pick your country, and see instant loan options from top lenders.
            </p>
          </div>

          {/* Interactive Calculator Card */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 md:p-10 shadow-2xl shadow-primary/5">
            
            {/* Loan Amount Slider */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Loan Amount</span>
                <div className="text-3xl md:text-4xl font-bold text-foreground">
                  {formatAmount(loanAmount[0])}
                </div>
              </div>
              
              <div className="relative py-4">
                <Slider
                  value={loanAmount}
                  onValueChange={setLoanAmount}
                  min={5}
                  max={100}
                  step={5}
                  className="cursor-pointer"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>₹5L</span>
                  <span>₹25L</span>
                  <span>₹50L</span>
                  <span>₹75L</span>
                  <span>₹1Cr+</span>
                </div>
              </div>
            </div>

            {/* Country Selection */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Study Destination</span>
                {selectedCountry && (
                  <span className="text-sm text-primary font-medium">
                    {COUNTRIES.find(c => c.code === selectedCountry)?.name} selected
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => setSelectedCountry(country.code)}
                    onMouseEnter={() => setIsHovering(country.code)}
                    onMouseLeave={() => setIsHovering(null)}
                    className={`
                      relative flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all duration-200
                      ${selectedCountry === country.code 
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' 
                        : 'border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5'
                      }
                    `}
                  >
                    <span className="text-2xl md:text-3xl mb-1">{country.flag}</span>
                    <span className={`text-xs md:text-sm font-medium ${selectedCountry === country.code ? 'text-primary' : 'text-foreground'}`}>
                      {country.name}
                    </span>
                    {selectedCountry === country.code && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    {country.popular && selectedCountry !== country.code && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full flex items-center justify-center">
                        <Star className="h-2.5 w-2.5 text-warning-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground">
                  {eligibleLenders.length > 0 ? `${eligibleLenders.length} lenders available` : 'Adjust amount to see options'}
                </span>
              </div>
            </div>

            {/* Live Lender Results */}
            <div className="space-y-3">
              {eligibleLenders.length > 0 ? (
                eligibleLenders.map((lender, index) => {
                  const emi = calculateEMI(loanAmount[0] * 100000, lender.minRate);
                  const isBestMatch = index === 0;
                  
                  return (
                    <div
                      key={lender.id}
                      className={`
                        group relative flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all duration-200
                        ${isBestMatch 
                          ? 'border-primary/50 bg-primary/5' 
                          : 'border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5'
                        }
                      `}
                      style={{ 
                        animationDelay: `${index * 100}ms`,
                        animation: 'fade-in 0.3s ease-out forwards'
                      }}
                    >
                      {/* Lender Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                          {lender.logo}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{lender.name}</span>
                            {isBestMatch && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                                Best Match
                              </span>
                            )}
                            {lender.badge && !isBestMatch && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {lender.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {lender.minRate}% - {lender.maxRate}%
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {lender.processingDays} days
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* EMI & CTA */}
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-0.5">Est. EMI</div>
                        <div className="text-lg md:text-xl font-bold text-foreground">
                          ₹{formatIndianNumber(emi)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </div>
                      </div>

                      {/* Hover arrow */}
                      <ChevronRight className="absolute right-2 opacity-0 group-hover:opacity-100 group-hover:right-4 transition-all text-primary" />
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No lenders available for this amount. Try adjusting the slider.</p>
                </div>
              )}
            </div>

            {/* Main CTA */}
            <div className="mt-8">
              <Button 
                size="lg" 
                className="w-full h-14 text-base font-semibold gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                onClick={() => navigate("/login")}
              >
                <Zap className="h-5 w-5" />
                Check Full Eligibility
                <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Takes 2 minutes • No impact on credit score
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Trust Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4 md:gap-8 text-xs md:text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="h-4 w-4 text-success" />
              <span>₹500Cr+ Disbursed</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-border"></div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="h-4 w-4 text-warning" />
              <span>4.8/5 Rating</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-border"></div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>RBI Registered Lenders</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLanding;
