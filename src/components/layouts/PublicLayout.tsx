import { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  );
};

export default PublicLayout;