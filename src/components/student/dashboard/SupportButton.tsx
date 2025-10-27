import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const SupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        onClick={() => setIsOpen(true)}
        aria-label="Get support"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How can we help you?</DialogTitle>
            <DialogDescription>
              Our support team is here to assist you with your loan application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button className="w-full justify-start" variant="outline" asChild>
              <a href="mailto:support@eduloanpro.com">
                📧 Email Support
              </a>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <a href="tel:+911234567890">
                📞 Call Us: +91 123 456 7890
              </a>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              📚 Help Center & FAQs
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
