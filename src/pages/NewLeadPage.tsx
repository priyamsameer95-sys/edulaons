import { useParams } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { useLeadForm } from "@/features/leads/hooks/useLeadForm";
import { LeadSteps } from "@/features/leads/components/LeadSteps";
import { StudentStep } from "@/features/leads/components/StudentStep";
import { StudyStep } from "@/features/leads/components/StudyStep";
import { CoApplicantStep } from "@/features/leads/components/CoApplicantStep";
import { DocumentStep } from "@/features/leads/components/DocumentStep";

const NewLeadPage = () => {
  const { partnerCode } = useParams();

  const {
    formData,
    errors,
    currentStep,
    createdLead,
    loading,
    amountInWords,
    salaryInWords,
    currentStepIndex,
    handleInputChange,
    handleUniversitiesChange,
    handleNext,
    handleBack,
    handleComplete,
    setFields
  } = useLeadForm(partnerCode);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'student':
        return (
          <StudentStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            onNext={handleNext}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'study':
        return (
          <StudyStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleUniversitiesChange={handleUniversitiesChange}
            setFields={setFields}
            amountInWords={amountInWords}
            onNext={handleNext}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'co_applicant':
        return (
          <CoApplicantStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            salaryInWords={salaryInWords}
            onNext={handleNext}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'documents':
        return (
          <DocumentStep
            createdLead={createdLead}
            formData={formData}
            onComplete={handleComplete}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 transition-colors duration-200">

        {/* Top Navigation / Progress Bar */}
        {currentStep !== 'documents' && (
          <LeadSteps
            currentStep={currentStep}
            currentStepIndex={currentStepIndex}
            createdLead={createdLead}
          />
        )}

        <main className="flex-grow flex flex-col items-center py-8 px-4 sm:px-6">
          {/* Step Content */}
          <div className="w-full">
            {renderStepContent()}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default NewLeadPage;
