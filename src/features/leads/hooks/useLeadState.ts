import { useState } from 'react';
import { LeadFormData, Step } from '../types/leadTypes';

const initialFormData: LeadFormData = {
    student_name: '',
    student_phone: '',
    student_email: '',
    student_dob: '',
    student_gender: '',
    student_pin_code: '',
    qualification: '',
    country: '',
    universities: [''],
    course_type: '',
    intake_month: '',
    loan_type: 'unsecured',
    amount_requested: '',
    co_applicant_name: '',
    co_applicant_email: '',
    co_applicant_phone: '',
    co_applicant_salary: '',
    co_applicant_employment_type: '',
    co_applicant_relationship: '',
    co_applicant_pin_code: ''
};

export const useLeadState = () => {
    const [formData, setFormData] = useState<LeadFormData>(initialFormData);
    const [currentStep, setCurrentStep] = useState<Step>('student');
    const [createdLead, setCreatedLead] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateField = (field: keyof LeadFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const setFields = (fields: Partial<LeadFormData>) => {
        setFormData(prev => ({ ...prev, ...fields }));
    };

    return {
        formData,
        setFormData,
        currentStep,
        setCurrentStep,
        createdLead,
        setCreatedLead,
        loading,
        setLoading,
        errors,
        setErrors,
        updateField,
        setFields
    };
};
