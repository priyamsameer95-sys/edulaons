import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowUp, Loader2 } from 'lucide-react';
import type { StudentApplicationData } from '@/types/student-application';
import QuestionWrapper from './QuestionWrapper';
import TextQuestion from './questions/TextQuestion';
import SelectQuestion from './questions/SelectQuestion';
import DateQuestion from './questions/DateQuestion';
import LocationQuestion from './questions/LocationQuestion';
import AcademicScoresQuestion from './questions/AcademicScoresQuestion';
import UniversityQuestion from './questions/UniversityQuestion';
import AmountQuestion from './questions/AmountQuestion';
import IntakeQuestion from './questions/IntakeQuestion';
import CoApplicantQuestion from './questions/CoApplicantQuestion';

interface ConversationalFormProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

const QUESTIONS = [
  { id: 'name', question: "What's your full name?", subtitle: 'As it appears on your official documents', type: 'text' },
  { id: 'phone', question: "What's your phone number?", subtitle: "We'll send updates here", type: 'phone' },
  { id: 'email', question: 'Your email address?', subtitle: 'Optional but helps us reach you faster', type: 'email' },
  { id: 'dob', question: 'When were you born?', subtitle: 'We need this for eligibility checks', type: 'date' },
  { id: 'gender', question: 'How do you identify?', type: 'select' },
  { id: 'location', question: 'Where in India are you from?', type: 'location' },
  { id: 'qualification', question: "What's your highest qualification?", type: 'select' },
  { id: 'scores', question: 'Tell us about your academic scores', subtitle: 'This helps lenders assess your profile', type: 'academic' },
  { id: 'destination', question: 'Where do you dream of studying?', subtitle: 'Choose your destination country', type: 'select' },
  { id: 'universities', question: 'Which universities are you considering?', subtitle: 'Select up to 3 universities', type: 'university' },
  { id: 'loanType', question: 'What type of loan do you need?', type: 'select' },
  { id: 'amount', question: 'How much funding do you need?', subtitle: 'Approximate loan amount in INR', type: 'amount' },
  { id: 'intake', question: 'When do you plan to start?', subtitle: 'Your intended intake month and year', type: 'intake' },
  { id: 'coApplicant', question: 'Tell us about your co-applicant', subtitle: 'A co-applicant strengthens your application', type: 'coApplicant' },
  { id: 'review', question: "You're all set!", subtitle: 'Review and submit your application', type: 'review' },
];

const ConversationalForm = ({ data, onUpdate, onSubmit, isSubmitting }: ConversationalFormProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const totalQuestions = QUESTIONS.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setDirection('forward');
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, totalQuestions]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('backward');
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && e.shiftKey) {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev]);

  const renderQuestion = () => {
    const q = QUESTIONS[currentIndex];
    
    switch (q.type) {
      case 'text':
      case 'phone':
      case 'email':
        return (
          <TextQuestion
            value={(data[q.id as keyof StudentApplicationData] as string) || ''}
            onChange={(val) => onUpdate({ [q.id]: val })}
            onSubmit={goNext}
            type={q.type === 'phone' ? 'tel' : q.type === 'email' ? 'email' : 'text'}
            prefix={q.type === 'phone' ? '+91' : undefined}
            placeholder={q.type === 'phone' ? '10-digit number' : q.type === 'email' ? 'email@example.com' : 'Type here...'}
            validation={q.type === 'phone' ? (v) => v.length !== 10 ? '10 digits required' : null : undefined}
          />
        );
      case 'date':
        return (
          <DateQuestion
            value={data.dateOfBirth || ''}
            onChange={(val) => onUpdate({ dateOfBirth: val })}
            onSubmit={goNext}
          />
        );
      case 'location':
        return (
          <LocationQuestion
            city={data.city || ''}
            state={data.state || ''}
            postalCode={data.postalCode || ''}
            onChange={(field, val) => onUpdate({ [field]: val })}
            onSubmit={goNext}
          />
        );
      case 'academic':
        return (
          <AcademicScoresQuestion
            qualification={data.highestQualification || 'bachelors'}
            tenthPercentage={data.tenthPercentage}
            twelfthPercentage={data.twelfthPercentage}
            bachelorsPercentage={data.bachelorsPercentage}
            bachelorsCgpa={data.bachelorsCgpa}
            onChange={(field, val) => onUpdate({ [field]: val })}
            onSubmit={goNext}
          />
        );
      case 'university':
        return (
          <UniversityQuestion
            selectedIds={data.universities || []}
            onChange={(ids) => onUpdate({ universities: ids })}
            onSubmit={goNext}
            studyDestination={data.studyDestination}
          />
        );
      case 'amount':
        return (
          <AmountQuestion
            value={data.loanAmount || 3000000}
            onChange={(val) => onUpdate({ loanAmount: val })}
            onSubmit={goNext}
          />
        );
      case 'intake':
        return (
          <IntakeQuestion
            month={data.intakeMonth}
            year={data.intakeYear}
            onChange={(field, val) => onUpdate({ [field === 'month' ? 'intakeMonth' : 'intakeYear']: val })}
            onSubmit={goNext}
          />
        );
      case 'coApplicant':
        return (
          <CoApplicantQuestion
            name={data.coApplicantName || ''}
            relationship={data.coApplicantRelationship || 'parent'}
            phone={data.coApplicantPhone || ''}
            email={data.coApplicantEmail || ''}
            monthlySalary={data.coApplicantMonthlySalary || 0}
            employmentType={data.coApplicantEmploymentType || 'salaried'}
            pinCode={data.coApplicantPinCode || ''}
            onChange={(field, val) => onUpdate({ [field]: val })}
            onSubmit={goNext}
          />
        );
      case 'select':
        const options = getSelectOptions(q.id);
        return (
          <SelectQuestion
            value={(data[q.id as keyof StudentApplicationData] as string) || ''}
            onChange={(val) => onUpdate({ [q.id]: val })}
            onSubmit={goNext}
            options={options}
            columns={options.length > 4 ? 3 : 2}
          />
        );
      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{data.name}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">+91 {data.phone}</span></div>
                <div><span className="text-muted-foreground">Destination:</span> <span className="font-medium">{data.studyDestination}</span></div>
                <div><span className="text-muted-foreground">Loan:</span> <span className="font-medium">₹{(data.loanAmount || 0).toLocaleString('en-IN')}</span></div>
              </div>
            </div>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className={cn(
                "w-full py-4 rounded-xl font-semibold text-lg transition-all",
                "bg-primary text-primary-foreground hover:opacity-90",
                "disabled:opacity-50 flex items-center justify-center gap-2"
              )}
            >
              {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</> : 'Submit Application'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Navigation */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className={cn(
            "p-2 rounded-lg bg-card border border-border transition-opacity",
            currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-muted"
          )}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center py-20">
        <QuestionWrapper
          questionNumber={currentIndex + 1}
          totalQuestions={totalQuestions}
          question={QUESTIONS[currentIndex].question}
          subtitle={QUESTIONS[currentIndex].subtitle}
          isActive={true}
          direction={direction}
        >
          {renderQuestion()}
        </QuestionWrapper>
      </div>

      {/* Keyboard hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
        <kbd className="px-2 py-1 bg-muted rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-muted rounded">↑</kbd> to go back
      </div>
    </div>
  );
};

function getSelectOptions(id: string) {
  switch (id) {
    case 'gender':
      return [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
      ];
    case 'qualification':
      return [
        { value: '12th', label: '12th / High School' },
        { value: 'diploma', label: 'Diploma' },
        { value: 'bachelors', label: "Bachelor's Degree" },
        { value: 'masters', label: "Master's Degree" },
        { value: 'phd', label: 'PhD' },
      ];
    case 'destination':
      return [
        { value: 'USA', label: 'USA', emoji: '🇺🇸' },
        { value: 'UK', label: 'UK', emoji: '🇬🇧' },
        { value: 'Canada', label: 'Canada', emoji: '🇨🇦' },
        { value: 'Australia', label: 'Australia', emoji: '🇦🇺' },
        { value: 'Germany', label: 'Germany', emoji: '🇩🇪' },
        { value: 'Ireland', label: 'Ireland', emoji: '🇮🇪' },
      ];
    case 'loanType':
      return [
        { value: 'secured', label: 'Secured Loan', description: 'Lower interest with collateral' },
        { value: 'unsecured', label: 'Unsecured Loan', description: 'No collateral needed' },
      ];
    default:
      return [];
  }
}

export default ConversationalForm;
