import { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  // Public routes don't require authentication
  return <>{children}</>;
};

export default PublicRoute;