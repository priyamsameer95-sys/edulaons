import { AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface StudentErrorStateProps {
  error: string | null;
  onRetry: () => void;
}

export const StudentErrorState = ({ error, onRetry }: StudentErrorStateProps) => (
  <EmptyState
    icon={AlertCircle}
    title="Something went wrong"
    description={error || "We couldn't load your applications. Please try again."}
    action={{
      label: "Try Again",
      onClick: onRetry,
    }}
  />
);
