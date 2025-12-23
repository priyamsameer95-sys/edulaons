import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Mail, Phone, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const FloatingSupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 mb-2 animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-lg p-4 w-64 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground">Need Help?</h4>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <a href="https://wa.me/911234567890" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                WhatsApp Chat
              </a>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <a href="mailto:support@eduloanpro.com">
                <Mail className="h-4 w-4 text-blue-500" />
                Email Support
              </a>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <a href="tel:+911234567890">
                <Phone className="h-4 w-4 text-primary" />
                Call Us
              </a>
            </Button>

            <div className="pt-2 border-t border-border">
              <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground text-sm">
                <HelpCircle className="h-4 w-4" />
                Help Center & FAQs
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className={cn(
          "rounded-full h-12 w-12 md:h-14 md:w-14 shadow-lg transition-transform duration-200",
          "hover:scale-105 active:scale-95",
          isOpen && "bg-muted text-muted-foreground hover:bg-muted"
        )}
      >
        {isOpen ? (
          <X className="h-5 w-5 md:h-6 md:w-6" />
        ) : (
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
        )}
      </Button>
    </div>
  );
};
