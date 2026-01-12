import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentApplicationData } from '@/types/student-application';
import PersonalDetailsPage from '../form-pages/PersonalDetailsPage';
import StudyLoanPage from '../form-pages/StudyLoanPage';
import CoApplicantReviewPage from '../form-pages/CoApplicantReviewPage';
import { useAutosave } from '@/hooks/useAutosave';
import { AutosaveIndicator } from '@/components/shared/AutosaveIndicator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConversationalFormProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

const TOTAL_STEPS = 3;

const ConversationalForm = ({ data, onUpdate, onSubmit, isSubmitting }: ConversationalFormProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // KB: Autosave for student forms
  const { isSaving, lastSaved, error: saveError, loadSavedData } = useAutosave(data, {
    storageKey: 'student-application-draft',
    debounceMs: 1500,
    enabled: true,
  });

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadSavedData();
    if (savedData && Object.keys(savedData).length > 0) {
      onUpdate(savedData);
    }
  }, []);

  const totalSteps = TOTAL_STEPS;
  const progress = (currentStep / totalSteps) * 100;

  const goNext = () => {
    if (currentStep < totalSteps) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goPrev = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackClick = () => {
    if (currentStep === 1) {
      setShowExitDialog(true);
    } else {
      goPrev();
    }
  };

  const handleExitConfirm = () => {
    setShowExitDialog(false);
    navigate('/dashboard/student');
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setDirection(-1);
      setCurrentStep(step);
    }
  };

  const renderPage = () => {
    switch (currentStep) {
      case 1:
        return <PersonalDetailsPage data={data} onUpdate={onUpdate} onNext={goNext} />;
      case 2:
        return <StudyLoanPage data={data} onUpdate={onUpdate} onNext={goNext} onPrev={goPrev} />;
      case 3:
        return <CoApplicantReviewPage data={data} onUpdate={onUpdate} onSubmit={onSubmit} isSubmitting={isSubmitting} onPrev={goPrev} />;
      default:
        return null;
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Frosted Glass Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50"
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handleBackClick}
              className="flex items-center gap-2 text-sm font-medium transition-all px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {currentStep === 1 ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Exit</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
              {/* KB: Autosave indicator */}
              <AutosaveIndicator
                isSaving={isSaving}
                lastSaved={lastSaved}
                error={saveError}
                size="sm"
              />
              <div className="hidden sm:flex items-center gap-1.5 text-green-600">
                <Shield className="w-4 h-4" />
                <span>Secure</span>
              </div>
            </div>
          </div>

          {/* Simple Step Indicator */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <div className="flex-1 mx-4 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10 pb-24">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>


      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress is auto-saved. You can continue from where you left off anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleExitConfirm}>
              Exit to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConversationalForm;
