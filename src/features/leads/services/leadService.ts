import { supabase } from "@/integrations/supabase/client";
import { LeadFormData } from "../types/leadTypes";

export const leadService = {
    async checkSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            throw new Error('Session expired. Please refresh and log in again.');
        }
        return session;
    },

    async processUniversities(universities: string[], country: string) {
        return Promise.all(
            universities
                .filter(u => u && u.trim())
                .map(async (uni) => {
                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uni);
                    if (isUUID) return uni;

                    const { data: newUni, error: uniError } = await supabase
                        .from('universities')
                        .insert({ name: uni.trim(), country: country, city: 'Unknown' })
                        .select('id')
                        .single();

                    if (uniError) throw new Error(`Failed to add university: ${uni}`);
                    return newUni.id;
                })
        );
    },

    async getUniversities(search: string = '') {
        let query = supabase
            .from('universities')
            .select('*')
            .order('name');

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getBestMatchLenders(leadId: string) {
        if (!leadId) return [];

        const { data: lenders, error } = await supabase
            .from('lenders')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        // In real app, this comes from `ai_lender_recommendations` logic
        return lenders.map((lender, index) => ({
            ...lender,
            isBestMatch: index === 0,
            matchScore: index === 0 ? 98 : (90 - index * 5),
            badge: index === 0 ? "BEST MATCH FOR YOU" : "Strong Alternative"
        }));
    },

    async createLead(formData: LeadFormData, isUpdate: boolean = false) {
        await leadService.checkSession();
        const processedUniversities = await leadService.processUniversities(formData.universities, formData.country);

        const { data, error } = await supabase.functions.invoke('create-lead', {
            body: {
                is_update: isUpdate,
                student_name: formData.student_name,
                student_phone: formData.student_phone,
                student_email: formData.student_email,
                student_pin_code: formData.student_pin_code,
                country: formData.country,
                universities: processedUniversities,
                intake_month: (formData.intake_month && formData.intake_month !== 'Not sure yet') ? (new Date(Date.parse(`01 ${formData.intake_month}`)).getMonth() + 1) : null,
                intake_year: (formData.intake_month && formData.intake_month !== 'Not sure yet') ? parseInt(formData.intake_month.split(' ')[1]) : null,
                loan_type: formData.loan_type,
                amount_requested: formData.amount_requested,
                co_applicant_name: formData.co_applicant_name,
                co_applicant_email: formData.co_applicant_email,
                co_applicant_phone: formData.co_applicant_phone,
                co_applicant_salary: formData.co_applicant_salary ? parseInt(formData.co_applicant_salary) : null,
                co_applicant_relationship: formData.co_applicant_relationship,
                co_applicant_pin_code: formData.co_applicant_pin_code
            }
        });

        if (error || !data.success) {
            throw new Error(data?.error || error?.message || 'Failed to create lead');
        }
        return data.lead;
    },

    async createPartialLead(formData: Partial<LeadFormData>) {
        await leadService.checkSession();
        const { data, error } = await supabase.functions.invoke('create-lead', {
            body: {
                is_partial: true,
                student_name: formData.student_name,
                student_phone: formData.student_phone,
                student_email: formData.student_email,
                student_dob: formData.student_dob,
                student_gender: formData.student_gender,
                status: 'new'
            }
        });

        if (error || !data.success) {
            throw new Error(data?.error || error?.message || 'Failed to update draft lead');
        }
        return data.lead;
    }
};
