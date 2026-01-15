import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { LeadFormData, Step, STEPS } from "../types/leadTypes";
import { useNavigate } from "react-router-dom";
import { convertNumberToWords } from "@/lib/utils";
import { useLeadState } from "./useLeadState";
import { useLeadValidation } from "./useLeadValidation";
import { useCreateLeaderPartial, useCreateOrUpdateLead } from "./useLeadMutations";
import { useDebounce } from "@/hooks/use-debounce";

export const useLeadForm = (partnerCode?: string) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { handleError } = useErrorHandler();

    // 1. Core State & Validation
    const {
        formData,
        errors,
        currentStep,
        createdLead,
        setCreatedLead,
        loading,
        setLoading,
        updateField,
        setFields,
        setErrors,
        setCurrentStep
    } = useLeadState();

    const { validateStep } = useLeadValidation();

    // 2. Mutations (React Query)
    const { mutate: savePartial, isPending: isSavingPartial } = useCreateLeaderPartial();
    const { mutate: saveFull, isPending: isSavingFull } = useCreateOrUpdateLead();

    // 3. Derived State
    const [amountInWords, setAmountInWords] = useState<string>('');
    const [salaryInWords, setSalaryInWords] = useState<string>('');
    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    // 4. Auto-Save Logic (Debounced)
    // We debounce the ENTIRE formData to trigger saves on idle, IF we have a lead ID.
    // However, the requirement is mainly to optimize the "Next" flow.
    // For now, let's keep it simple: "Next" = Optimistic Save. 
    // Field-level debounce is good for search, generally strictly auto-saving fields is complex due to validation.

    // Initialize Words Logic
    useEffect(() => {
        if (formData.co_applicant_salary) {
            const num = parseFloat(formData.co_applicant_salary);
            setSalaryInWords(!isNaN(num) && num > 0 ? convertNumberToWords(num) : '');
        }
    }, [formData.co_applicant_salary]);

    const handleInputChange = (field: keyof LeadFormData, value: string) => {
        updateField(field, value);
    };

    const handleUniversitiesChange = useCallback((universities: string[]) => {
        setFields({ universities });
    }, [setFields]);


    const handleNext = () => {
        // 1. Validate Current Step
        const { isValid, errors: stepErrors } = validateStep(currentStep, formData);

        if (!isValid) {
            setErrors(stepErrors);
            toast({
                title: "Complete required fields",
                description: "Please fill in all required fields before proceeding",
                variant: "destructive",
            });
            return;
        }

        // 2. Optimistic Navigation logic
        const nextIndex = currentStepIndex + 1;

        if (nextIndex < STEPS.length) {
            const nextStepId = STEPS[nextIndex].id;

            if (nextStepId === 'documents') {
                // Final Step: This triggers a "Blocking" save because we need the result (e.g., Lead ID) to show lenders.
                // Or we can go to Documents screen and show "Loading..." while it saves.
                // Let's do the "Hybrid": Navigate to Documents, show Loader there if lead not ready.

                // For now, Standard Submit pattern for final step is safer to ensure data integrity before results.
                handleSubmit(!!createdLead);
                return;
            }

            // Standard Step -> Step Transition
            // A. Move UI Immediately
            setCurrentStep(nextStepId);

            // B. Fire & Forget Save (Background)
            if (currentStep === 'student' && !createdLead) {
                // First time creation
                savePartial(formData, {
                    onSuccess: (newLead) => {
                        setCreatedLead(newLead);
                        // console.log("Partial Lead Created Silently", newLead.id);
                    },
                    onError: (err) => {
                        // Silent fail or toast? 
                        // Toast is better so they know their progress isn't saved.
                        console.error("Background save failed", err);
                        toast({
                            title: "Auto-save failed",
                            description: "Your progress wasn't saved. Please check your connection.",
                            variant: "destructive"
                        });
                    }
                });
            } else if (createdLead) {
                // Update existing lead in background
                saveFull({ formData, isUpdate: true }, {
                    onError: () => {
                        toast({
                            title: "Auto-save failed",
                            variant: "destructive"
                        });
                    }
                });
            }
        }
    };

    const handleSubmit = (isUpdate: boolean) => {
        setLoading(true);
        saveFull({ formData, isUpdate }, {
            onSuccess: (lead) => {
                setCreatedLead(lead);
                setCurrentStep('documents');
                toast({
                    title: isUpdate ? "Application Updated!" : "Lead Created!",
                    description: `Case ${lead.case_id} ready.`,
                });
                setLoading(false);
            },
            onError: (error: any) => {
                handleError(error, { title: 'Failed to Submit Application' });
                setLoading(false);
            }
        });
    };

    const handleBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(STEPS[prevIndex].id);
        } else {
            navigate(-1);
        }
    };

    const handleComplete = () => {
        navigate(partnerCode ? `/partner/${partnerCode}` : '/');
    };

    return {
        formData,
        errors,
        currentStep,
        createdLead,
        loading: loading || isSavingFull || isSavingPartial, // Show loading if critical
        amountInWords,
        salaryInWords,
        currentStepIndex,
        handleInputChange,
        handleUniversitiesChange,
        handleNext, // Now Optimistic
        handleBack,
        handleComplete,
        setFields,
        STEPS
    };
};
