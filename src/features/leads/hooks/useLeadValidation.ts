import { LeadFormData, Step } from '../types/leadTypes';

export const useLeadValidation = () => {
    const validateStep = (step: Step, formData: LeadFormData): { isValid: boolean; errors: Record<string, string> } => {
        const errors: Record<string, string> = {};

        if (step === 'student') {
            if (!formData.student_name?.trim() || formData.student_name.length < 2) {
                errors.student_name = 'Valid name is required';
            }
            if (!formData.student_phone?.match(/^(\+[\d]{1,3}[\d\s\-()]{7,14}|[\d]{10})$/)) {
                errors.student_phone = 'Valid phone number is required';
            }
            if (!formData.student_email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                errors.student_email = 'Valid email is required';
            }
            if (!formData.student_dob) errors.student_dob = 'Date of birth is required';
            if (!formData.student_gender) errors.student_gender = 'Gender is required';
        }

        if (step === 'study') {
            if (!formData.qualification) errors.qualification = 'Qualification is required';
            if (!formData.country) errors.country = 'Country is required';
            if (!formData.universities?.length || !formData.universities[0]) {
                errors.universities = 'At least one university is required';
            }
            if (!formData.course_type) errors.course_type = 'Course type is required';
            if (!formData.intake_month) errors.intake_month = 'Intake is required';
            if (!formData.amount_requested) errors.amount_requested = 'Loan amount is required';
        }

        if (step === 'co_applicant') {
            if (!formData.co_applicant_name?.trim()) errors.co_applicant_name = 'Co-applicant name is required';
            if (!formData.co_applicant_phone?.match(/^(\+[\d]{1,3}[\d\s\-()]{7,14}|[\d]{10})$/)) {
                errors.co_applicant_phone = 'Valid phone is required';
            }
            if (!formData.co_applicant_email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                errors.co_applicant_email = 'Valid email is required';
            }
            if (!formData.co_applicant_salary) errors.co_applicant_salary = 'Salary is required';
            if (!formData.co_applicant_employment_type) errors.co_applicant_employment_type = 'Employment type is required';
            if (!formData.co_applicant_relationship) errors.co_applicant_relationship = 'Relationship is required';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    return { validateStep };
};
