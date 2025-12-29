/**
 * Referral Section Component
 * 
 * Shows referral program UI for students
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Gift, 
  Copy, 
  Share2, 
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ReferralSectionProps {
  studentId?: string;
  studentPhone?: string;
}

const ReferralSection = ({ studentId, studentPhone }: ReferralSectionProps) => {
  const [copied, setCopied] = useState(false);
  
  // Generate referral code from phone (last 6 digits)
  const referralCode = studentPhone 
    ? `EDU${studentPhone.slice(-6)}` 
    : 'EDULOANS';
  
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };
  
  const handleShare = async () => {
    const shareData = {
      title: 'Eduloans by Cashkaro',
      text: `Get the best education loan rates! Use my referral code: ${referralCode}`,
      url: referralLink
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Refer & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benefits */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Sparkles className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            Earn rewards when your friends apply for education loans!
          </p>
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Your Referral Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-lg bg-muted font-mono font-semibold text-foreground">
              {referralCode}
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              <Copy className={`w-4 h-4 ${copied ? 'text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Share Button */}
        <Button 
          onClick={handleShare}
          className="w-full"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share with Friends
        </Button>

        {/* Stats (Placeholder for future) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Friends Referred</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">₹0</p>
            <p className="text-xs text-muted-foreground">Rewards Earned</p>
          </div>
        </div>

        {/* How it works */}
        <div className="pt-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">How it works:</p>
          <ol className="space-y-1.5">
            <li className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center shrink-0 font-semibold">1</span>
              Share your referral link with friends
            </li>
            <li className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center shrink-0 font-semibold">2</span>
              They apply using your code
            </li>
            <li className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center shrink-0 font-semibold">3</span>
              Earn rewards when they get approved
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralSection;
