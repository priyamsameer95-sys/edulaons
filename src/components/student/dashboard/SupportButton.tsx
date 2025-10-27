import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, BookOpen } from "lucide-react";

export const SupportButton = () => {
  return (
    <Card className="bg-card border border-border rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">How can we help you?</CardTitle>
        <p className="text-sm text-muted-foreground">
          Our support team is here to assist you with your loan application.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start" variant="outline" asChild>
          <a href="mailto:support@eduloanpro.com">
            <Mail className="h-4 w-4 mr-2" />
            Email Support
          </a>
        </Button>
        <Button className="w-full justify-start" variant="outline" asChild>
          <a href="tel:+911234567890">
            <Phone className="h-4 w-4 mr-2" />
            Call Us: +91 123 456 7890
          </a>
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <BookOpen className="h-4 w-4 mr-2" />
          Help Center & FAQs
        </Button>
      </CardContent>
    </Card>
  );
};
