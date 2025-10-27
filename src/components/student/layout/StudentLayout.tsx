import { ReactNode } from 'react';
import { StudentNavBar } from './StudentNavBar';
import { StudentFooter } from './StudentFooter';

interface StudentLayoutProps {
  children: ReactNode;
}

export const StudentLayout = ({ children }: StudentLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <StudentNavBar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
      
      <StudentFooter />
    </div>
  );
};
