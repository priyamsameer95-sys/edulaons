/**
 * Bulk Document Download Hook
 * 
 * Downloads all documents for a case as a ZIP file.
 * Uses Supabase Storage signed URLs and JSZip.
 */

import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentInfo {
    id: string;
    file_name: string;
    file_path: string;
    document_type: string;
    created_at: string;
}

interface UseBulkDocumentDownloadReturn {
    isDownloading: boolean;
    progress: number;
    downloadAllDocuments: (caseId: string, leadId: string) => Promise<void>;
}

export function useBulkDocumentDownload(): UseBulkDocumentDownloadReturn {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);

    const downloadAllDocuments = useCallback(async (caseId: string, leadId: string) => {
        setIsDownloading(true);
        setProgress(0);

        try {
            // 1. Fetch all documents for this lead
            const { data: documents, error: docsError } = await supabase
                .from('lead-documents')
                .select('id, file_name, file_path, document_type, created_at')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: true });

            if (docsError) {
                throw new Error('Failed to fetch documents: ' + docsError.message);
            }

            if (!documents || documents.length === 0) {
                toast({
                    title: 'No documents found',
                    description: 'This case has no uploaded documents yet.',
                    variant: 'destructive'
                });
                setIsDownloading(false);
                return;
            }

            console.log(`📦 Preparing ZIP for ${documents.length} documents (Case: ${caseId})`);

            // 2. Create ZIP file
            const zip = new JSZip();
            const folder = zip.folder(caseId) || zip;

            // 3. Download each document and add to ZIP
            for (let i = 0; i < documents.length; i++) {
                const doc = documents[i] as DocumentInfo;
                setProgress(Math.round(((i + 0.5) / documents.length) * 100));

                try {
                    // Get signed URL for the document
                    const { data: signedUrlData, error: urlError } = await supabase
                        .storage
                        .from('lead-documents')
                        .createSignedUrl(doc.file_path, 60); // 60 second expiry

                    if (urlError || !signedUrlData?.signedUrl) {
                        console.warn(`⚠️ Could not get URL for ${doc.file_name}:`, urlError?.message);
                        continue;
                    }

                    // Fetch the file content
                    const response = await fetch(signedUrlData.signedUrl);
                    if (!response.ok) {
                        console.warn(`⚠️ Failed to download ${doc.file_name}: ${response.status}`);
                        continue;
                    }

                    const blob = await response.blob();

                    // Create organized filename: [DocType]_[OriginalName]
                    const sanitizedType = doc.document_type.replace(/[^a-zA-Z0-9]/g, '_');
                    const filename = `${sanitizedType}_${doc.file_name}`;

                    folder.file(filename, blob);
                    console.log(`✅ Added ${filename} to ZIP`);

                } catch (fileError) {
                    console.error(`❌ Error processing ${doc.file_name}:`, fileError);
                }

                setProgress(Math.round(((i + 1) / documents.length) * 100));
            }

            // 4. Generate and download ZIP
            toast({ title: 'Generating ZIP file...' });

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            // 5. Trigger download
            saveAs(zipBlob, `${caseId}_documents.zip`);

            toast({
                title: 'Download complete!',
                description: `${documents.length} documents saved as ${caseId}_documents.zip`
            });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('❌ Bulk download failed:', error);
            toast({
                title: 'Download failed',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setIsDownloading(false);
            setProgress(0);
        }
    }, [toast]);

    return {
        isDownloading,
        progress,
        downloadAllDocuments,
    };
}
