import { Component, ReactNode } from 'react';
import { EnhancedEmptyState } from '@/components/ui/enhanced-empty-state';
import { AlertCircle, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen p-4">
          <EnhancedEmptyState
            variant="error"
            icon={AlertCircle}
            title="Something went wrong"
            description={this.state.error?.message || "An unexpected error occurred"}
            supportingText="Please try refreshing the page or contact support if the problem persists."
            primaryAction={{
              label: "Refresh Page",
              onClick: () => window.location.reload(),
            }}
            secondaryAction={{
              label: "Go Home",
              onClick: () => window.location.href = '/',
              variant: 'outline'
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export const RouteErrorBoundary = ({ children }: { children: ReactNode }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-screen p-4">
          <EnhancedEmptyState
            variant="error"
            icon={AlertCircle}
            title="Page Error"
            description="This page encountered an error"
            supportingText="We apologize for the inconvenience. Please try again."
            primaryAction={{
              label: "Go Home",
              onClick: () => window.location.href = '/',
              icon: Home
            }}
          />
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export const DataErrorBoundary = ({ children, onError }: { children: ReactNode; onError?: (error: Error) => void }) => (
  <ErrorBoundary
    fallback={
      <EnhancedEmptyState
        variant="error"
        icon={AlertCircle}
        title="Data Error"
        description="Failed to load data"
        primaryAction={{
          label: "Retry",
          onClick: () => window.location.reload(),
        }}
      />
    }
    onError={onError}
  >
    {children}
  </ErrorBoundary>
);

export const FormErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    fallback={
      <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
        <p className="text-sm text-destructive">Form error occurred. Please refresh and try again.</p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);
