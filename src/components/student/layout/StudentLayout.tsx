import { ReactNode } from 'react';
import { StudentNavBar } from './StudentNavBar';
import { StudentFooter } from './StudentFooter';

interface StudentLayoutProps {
  children: ReactNode;
}

export const StudentLayout = ({ children }: StudentLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StudentNavBar />
      
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      
      <StudentFooter />
    </div>
  );
};
