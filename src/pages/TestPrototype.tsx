import { useState } from "react";
import { StudentStep } from "@/features/leads/components/StudentStepV2";
import { LeadFormData } from "@/features/leads/types/leadTypes";
import { LeadProgressBar } from "@/features/leads/components/LeadProgressBar";

const TestPrototype = () => {
    const [formData, setFormData] = useState<LeadFormData>({
        student_name: "John Doe",
        student_phone: "+919876543210",
        student_email: "john@example.com",
        student_dob: "2000-01-01",
        student_gender: "male",
        student_pin_code: "123456",
        qualification: "Undergraduate",
        country: "USA",
        universities: ["Harvard"],
        course_type: "Masters STEM",
        intake_month: "Jan 2026",
        loan_type: "unsecured",
        amount_requested: "₹25 - 50L",
        co_applicant_name: "",
        co_applicant_email: "",
        co_applicant_phone: "",
        co_applicant_salary: "",
        co_applicant_employment_type: "",
        co_applicant_relationship: "",
        co_applicant_pin_code: ""
    });

    const handleInputChange = (field: keyof LeadFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-8">Isolated UI Test Mode</h1>

            <div className="w-full max-w-3xl mb-8">
                <LeadProgressBar currentStep={1} totalSteps={3} />
            </div>

            <div className="w-full max-w-3xl">
                <StudentStep
                    formData={formData}
                    errors={{}}
                    handleInputChange={handleInputChange}
                    loading={false}
                    onNext={() => alert("Next clicked!")}
                    onBack={() => alert("Back clicked!")}
                />
            </div>
        </div>
    );
};

export default TestPrototype;
