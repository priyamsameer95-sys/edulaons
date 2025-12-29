/**
 * Support Section
 * 
 * De-emphasized support contact options.
 * Call and WhatsApp options.
 */
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SupportSectionProps {
  phoneNumber?: string;
}

const SupportSection = ({ phoneNumber = '8238452277' }: SupportSectionProps) => {
  const whatsappUrl = `https://wa.me/91${phoneNumber}?text=Hi, I need help with my education loan application.`;

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-sm text-muted-foreground mb-3">
        Need help? Talk to a loan expert
      </p>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 h-9"
          asChild
        >
          <a href={`tel:${phoneNumber}`}>
            <Phone className="w-4 h-4 mr-2" />
            Call Us
          </a>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 h-9 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
          asChild
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
};

export default SupportSection;
