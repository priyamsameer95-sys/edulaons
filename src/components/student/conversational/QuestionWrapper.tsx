import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestionWrapperProps {
  children: ReactNode;
  questionNumber: number;
  totalQuestions: number;
  question: string;
  subtitle?: string;
  isActive: boolean;
  direction?: 'forward' | 'backward';
}

const QuestionWrapper = ({
  children,
  questionNumber,
  totalQuestions,
  question,
  subtitle,
  isActive,
  direction = 'forward',
}: QuestionWrapperProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isActive) {
      setMounted(true);
    }
  }, [isActive]);

  if (!isActive && !mounted) return null;

  const variants = {
    enter: (direction: string) => ({
      y: direction === 'forward' ? 40 : -40,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      y: direction === 'forward' ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      {isActive && (
        <motion.div
          key={questionNumber}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-2xl mx-auto px-4"
        >
          {/* Question number */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium text-primary">
              {questionNumber}
            </span>
            <span className="text-sm text-muted-foreground">
              of {totalQuestions}
            </span>
          </div>

          {/* Question text */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground leading-tight mb-3">
            {question}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-base sm:text-lg text-muted-foreground mb-8">
              {subtitle}
            </p>
          )}

          {/* Input area */}
          <div className="mt-8">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuestionWrapper;
