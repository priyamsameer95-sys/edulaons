import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppSupportProps {
  step: number;
  className?: string;
}

const stepContextMessages: Record<number, string> = {
  0: "Hi! I need help with my personal details on the loan application form.",
  1: "Hi! I have questions about filling in my academic background for the loan application.",
  2: "Hi! I need help selecting my study destination and university for my loan application.",
  3: "Hi! I have questions about the co-applicant requirements for my education loan.",
  4: "Hi! I'm ready to review my application and have some questions before submitting.",
};

export const WhatsAppSupport = ({ step, className }: WhatsAppSupportProps) => {
  const phoneNumber = "919876543210"; // Replace with actual WhatsApp number
  const message = encodeURIComponent(stepContextMessages[step] || "Hi! I need help with my education loan application.");
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-2 border-trust text-trust hover:bg-trust-light",
        className
      )}
      onClick={() => window.open(whatsappUrl, '_blank')}
    >
      <MessageCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Need Help?</span>
    </Button>
  );
};
