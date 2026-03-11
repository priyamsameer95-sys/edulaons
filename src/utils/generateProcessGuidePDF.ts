import jsPDF from 'jspdf';
import { format } from 'date-fns';

export interface GuideData {
    studentName: string;
    loanAmount: number;
    studyDestination: string;
    targetLenderName: string;
}

export const generateProcessGuidePDF = (data: GuideData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Branding Header
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Eduloans by cashakro', 20, 25);

    // Title
    doc.setTextColor(31, 41, 55); // Gray-800
    doc.setFontSize(20);
    doc.text('Your Loan Process Guide', 20, 60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy')}`, 20, 70);

    // Applicant Details
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.roundedRect(20, 80, pageWidth - 40, 45, 3, 3, 'FD');

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Application Summary', 25, 90);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Student Name: ${data.studentName}`, 25, 100);
    doc.text(`Target Lender: ${data.targetLenderName}`, 25, 110);

    doc.text(`Loan Amount: ${formatCurrency(data.loanAmount)}`, pageWidth / 2 + 10, 100);
    doc.text(`Destination: ${data.studyDestination}`, pageWidth / 2 + 10, 110);

    // Process Steps
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Next Steps in Your Journey', 20, 145);

    const steps = [
        {
            title: '1. Document Verification',
            desc: 'Upload all requested documents. Our team and the lender will review them for authenticity and completeness.',
        },
        {
            title: '2. Application Processing',
            desc: `${data.targetLenderName} will process your application based on your financial and academic profile to determine eligibility.`,
        },
        {
            title: '3. Loan Sanction',
            desc: 'Once approved, you will receive a formal sanction letter detailing the terms and conditions of your loan.',
        },
        {
            title: '4. Visa Processing',
            desc: 'Use your loan sanction letter as valid proof of funds for your upcoming student visa application.',
        },
        {
            title: '5. Disbursement',
            desc: 'After your visa is officially approved, the loan amount will be disbursed directly to your university or account.',
        }
    ];

    let yPos = 160;
    steps.forEach((step) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 30;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text(step.title, 20, yPos);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);

        const splitDesc = doc.splitTextToSize(step.desc, pageWidth - 40);
        doc.text(splitDesc, 20, yPos + 6);

        yPos += 16 + (splitDesc.length * 5); // spacing
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('If you have any questions, please contact your Eduloans counselor.', pageWidth / 2, 285, { align: 'center' });

    // Download Action
    doc.save(`Process_Guide_${data.studentName.replace(/\s+/g, '_')}.pdf`);
};
