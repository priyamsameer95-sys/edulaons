import { useQuery } from "@tanstack/react-query";
import { leadService } from "../services/leadService";

export const useUniversities = (search: string = '') => {
    return useQuery({
        queryKey: ['universities', search],
        queryFn: () => leadService.getUniversities(search),
        staleTime: 1000 * 60 * 60, // 1 hour cache
        enabled: true
    });
};

export const useBestMatchLenders = (leadId: string) => {
    return useQuery({
        queryKey: ['lenders', 'best-match', leadId],
        queryFn: () => leadService.getBestMatchLenders(leadId),
        enabled: !!leadId,
        staleTime: 1000 * 60 * 5 // 5 minutes cache for recommendations
    });
};
