/**
 * PDF Layout Utilities
 * 
 * Provides layout helpers for consistent PDF generation.
 * Uses only ASCII-safe characters to avoid font rendering issues.
 */

import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { PDFField, PDFColors } from './types';

// Default colors - using standard values that render reliably
export const PDF_COLORS: PDFColors = {
  primaryBlue: [37, 99, 235],
  lightBlue: [239, 246, 255],
  darkGray: [55, 65, 81],
  black: [17, 24, 39],
  gray: [107, 114, 128],
  lightGray: [243, 244, 246],
  green: [22, 163, 74],
  amber: [217, 119, 6],
  red: [220, 38, 38],
  white: [255, 255, 255],
};

export interface LayoutState {
  doc: jsPDF;
  y: number;
  margin: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
}

export function createLayoutState(doc: jsPDF): LayoutState {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  return {
    doc,
    y: 0,
    margin,
    pageWidth,
    pageHeight,
    contentWidth: pageWidth - (margin * 2),
  };
}

export function checkPageBreak(state: LayoutState, requiredSpace: number = 50): void {
  if (state.y > state.pageHeight - requiredSpace) {
    state.doc.addPage();
    state.y = 20;
  }
}

export function drawRoundedRect(
  doc: jsPDF, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  r: number, 
  fill?: readonly [number, number, number], 
  stroke?: readonly [number, number, number]
): void {
  if (fill) {
    doc.setFillColor(fill[0], fill[1], fill[2]);
  }
  if (stroke) {
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.setLineWidth(0.3);
  }
  doc.roundedRect(x, y, w, h, r, r, fill && stroke ? 'FD' : fill ? 'F' : 'S');
}

export function drawSectionHeader(
  state: LayoutState, 
  title: string, 
  boxHeight: number
): number {
  const { doc, margin, contentWidth } = state;
  const boxY = state.y;
  
  // Box background
  drawRoundedRect(doc, margin, boxY, contentWidth, boxHeight, 4, PDF_COLORS.lightGray);
  
  // Header bar
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.roundedRect(margin, boxY, contentWidth, 16, 4, 4, 'F');
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.rect(margin, boxY + 8, contentWidth, 8, 'F');
  
  // Section title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin + 10, boxY + 11);
  
  return boxY;
}

export function drawFieldsGrid(
  state: LayoutState, 
  fields: PDFField[], 
  startY: number
): void {
  const { doc, margin, contentWidth } = state;
  const colWidth = (contentWidth - 20) / 2;
  let fieldY = startY + 26;
  
  doc.setFontSize(9);
  
  for (let i = 0; i < fields.length; i += 2) {
    // Left column
    const leftField = fields[i];
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
    doc.text(leftField.label, margin + 10, fieldY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.black[0], PDF_COLORS.black[1], PDF_COLORS.black[2]);
    
    // Truncate long values to prevent overflow
    const leftValue = leftField.value || 'N/A';
    const maxWidth = colWidth - 5;
    const truncatedLeft = doc.splitTextToSize(leftValue, maxWidth)[0] || 'N/A';
    doc.text(truncatedLeft, margin + 10, fieldY + 6);
    
    // Right column
    if (fields[i + 1]) {
      const rightField = fields[i + 1];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
      doc.text(rightField.label, margin + 10 + colWidth, fieldY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.black[0], PDF_COLORS.black[1], PDF_COLORS.black[2]);
      
      const rightValue = rightField.value || 'N/A';
      const truncatedRight = doc.splitTextToSize(rightValue, maxWidth)[0] || 'N/A';
      doc.text(truncatedRight, margin + 10 + colWidth, fieldY + 6);
    }
    
    fieldY += 14;
  }
}

export function drawSectionBox(
  state: LayoutState, 
  title: string, 
  fields: PDFField[]
): void {
  const fieldRows = Math.ceil(fields.length / 2);
  const boxHeight = 22 + (fieldRows * 14);
  
  checkPageBreak(state, boxHeight + 10);
  
  const boxY = drawSectionHeader(state, title, boxHeight);
  drawFieldsGrid(state, fields, boxY);
  
  state.y = boxY + boxHeight + 10;
}

/**
 * Format currency with INR prefix (ASCII-safe, no rupee symbol)
 */
export function formatCurrency(amount: number): string {
  return `INR ${amount.toLocaleString('en-IN')}`;
}

/**
 * Format date safely
 */
export function formatDateSafe(dateStr: string | undefined | null, formatStr: string = 'dd MMM yyyy'): string {
  if (!dateStr) return 'N/A';
  try {
    return format(new Date(dateStr), formatStr);
  } catch {
    return 'N/A';
  }
}

/**
 * Get verification status as text (ASCII-safe, no icons)
 */
export function getStatusText(status?: string): { text: string; color: readonly [number, number, number] } {
  switch (status?.toLowerCase()) {
    case 'verified':
      return { text: 'Verified', color: PDF_COLORS.green };
    case 'rejected':
      return { text: 'Rejected', color: PDF_COLORS.red };
    case 'pending':
    default:
      return { text: 'Pending', color: PDF_COLORS.amber };
  }
}

/**
 * Draw a small colored status indicator square (no unicode icons)
 */
export function drawStatusIndicator(
  doc: jsPDF, 
  x: number, 
  y: number, 
  status: 'verified' | 'pending' | 'rejected'
): void {
  const color = status === 'verified' ? PDF_COLORS.green : 
                status === 'rejected' ? PDF_COLORS.red : PDF_COLORS.amber;
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y - 3, 4, 4, 'F');
}

export function addPageNumbers(doc: jsPDF, margin: number): void {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
    doc.text('EduLoan by CashKaro | Contact: priyam.sameer@cashkaro.com', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }
}
