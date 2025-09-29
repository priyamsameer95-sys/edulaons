import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Shield className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          You don't have permission to access this page.
        </p>
        <Button onClick={() => navigate('/login')}>
          Return to Login
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;