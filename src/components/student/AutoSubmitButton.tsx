import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';

interface AutoSubmitButtonProps {
  onClick: () => void;
  isSubmitting: boolean;
}

export const AutoSubmitButton = ({ onClick, isSubmitting }: AutoSubmitButtonProps) => {
  return (
    <Button 
      onClick={onClick}
      disabled={isSubmitting}
      className="relative overflow-hidden group"
      size="lg"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Submitting...
        </>
      ) : (
        <>
          <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
          Submit Application
        </>
      )}
    </Button>
  );
};
