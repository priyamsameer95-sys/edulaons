import { useState } from 'react';
import { LeadFormData, Step } from '../types/leadTypes';

const initialFormData: LeadFormData = {
    student_name: 'Aditya kumar',
    student_phone: '+919876543210',
    student_email: 'Aditya.kumar@example.com',
    student_dob: '2000-01-01',
    student_gender: 'male',
    student_pin_code: '110001',
    qualification: '',
    country: '',
    universities: [''],
    course_type: 'Masters STEM',
    intake_month: 'Jan 2026',
    loan_type: 'unsecured',
    amount_requested: '₹10 - 25L',
    co_applicant_name: '',
    co_applicant_email: '',
    co_applicant_phone: '',
    co_applicant_salary: '500000',
    co_applicant_employment_type: 'salaried',
    co_applicant_relationship: 'Father',
    co_applicant_pin_code: '000000'
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
