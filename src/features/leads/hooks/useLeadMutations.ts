import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leadService } from "../services/leadService";

export const useCreateLeaderPartial = () => {
    return useMutation({
        mutationFn: leadService.createPartialLead,
    });
};

export const useCreateOrUpdateLead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ formData, isUpdate }: { formData: any, isUpdate: boolean }) =>
            leadService.createLead(formData, isUpdate),
        onSuccess: (data) => {
            // Invalidate relevant queries if needed
            // queryClient.invalidateQueries({ queryKey: ['leads'] });
        }
    });
};
