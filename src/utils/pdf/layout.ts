/**
 * PDF Layout Utilities
 * 
 * Provides layout helpers for consistent PDF generation.
 * Uses only ASCII-safe characters to avoid font rendering issues.
 * Redesigned for a beautiful, professional student pitch document.
 */

import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { PDFField, PDFColors } from './types';

// Modern color palette for a professional fintech look
export const PDF_COLORS: PDFColors = {
  primaryBlue: [30, 64, 175],      // Deep blue - headers
  lightBlue: [239, 246, 255],      // Very light blue - backgrounds
  darkGray: [31, 41, 55],          // Near black - primary text
  black: [17, 24, 39],             // True black
  gray: [107, 114, 128],           // Medium gray - labels
  lightGray: [249, 250, 251],      // Very light - card backgrounds
  green: [22, 163, 74],            // Success green
  amber: [217, 119, 6],            // Warning amber
  red: [220, 38, 38],              // Error red
  white: [255, 255, 255],          // White
};

// Extended colors for the new design
export const EXTENDED_COLORS = {
  purple: [124, 58, 237] as const,           // Accent purple
  gradientEnd: [59, 130, 246] as const,      // Gradient blue
  cardBorder: [229, 231, 235] as const,      // Subtle border
  accent: [99, 102, 241] as const,           // Indigo accent
  successLight: [220, 252, 231] as const,    // Light green bg
  warningLight: [254, 243, 199] as const,    // Light amber bg
  errorLight: [254, 226, 226] as const,      // Light red bg
  blueLight: [219, 234, 254] as const,       // Light blue bg
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
  const margin = 12;
  
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
    state.y = 15;
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

/**
 * Draw a gradient-style header (simulated with two rectangles)
 */
export function drawGradientHeader(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  // Main blue area
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.rect(x, y, w, h, 'F');
  
  // Subtle gradient effect with secondary color overlay on right side
  doc.setFillColor(EXTENDED_COLORS.purple[0], EXTENDED_COLORS.purple[1], EXTENDED_COLORS.purple[2]);
  // Create a lighter accent stripe on the right side
  doc.rect(x + w * 0.85, y, w * 0.15, h, 'F');
}

/**
 * Draw a modern card with optional colored left accent
 */
export function drawModernCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  accentColor?: readonly [number, number, number]
): void {
  // Card background
  drawRoundedRect(doc, x, y, w, h, 3, PDF_COLORS.white, EXTENDED_COLORS.cardBorder);
  
  // Left accent bar
  if (accentColor) {
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(x, y, 3, h, 1.5, 1.5, 'F');
    doc.rect(x + 1.5, y, 1.5, h, 'F');
  }
}

/**
 * Draw a status pill/badge
 */
export function drawStatusPill(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  bgColor: readonly [number, number, number],
  textColor: readonly [number, number, number] = PDF_COLORS.white
): { width: number } {
  doc.setFontSize(7);
  const textWidth = doc.getTextWidth(text);
  const pillWidth = textWidth + 8;
  const pillHeight = 10;
  
  drawRoundedRect(doc, x, y, pillWidth, pillHeight, 5, bgColor);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(text, x + 4, y + 7);
  
  return { width: pillWidth };
}

/**
 * Draw a progress bar
 */
export function drawProgressBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number, // 0-100
  bgColor: readonly [number, number, number] = EXTENDED_COLORS.cardBorder,
  fillColor: readonly [number, number, number] = PDF_COLORS.green
): void {
  // Background
  drawRoundedRect(doc, x, y, width, height, height / 2, bgColor);
  
  // Fill
  if (progress > 0) {
    const fillWidth = Math.max((width * progress) / 100, height);
    drawRoundedRect(doc, x, y, fillWidth, height, height / 2, fillColor);
  }
}

/**
 * Draw a metric card (for hero section)
 */
export function drawMetricCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  subtext?: string,
  accentColor: readonly [number, number, number] = PDF_COLORS.primaryBlue
): void {
  // Card with accent
  drawModernCard(doc, x, y, width, height, accentColor);
  
  // Label
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
  doc.text(label.toUpperCase(), x + 8, y + 10);
  
  // Value
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.darkGray[0], PDF_COLORS.darkGray[1], PDF_COLORS.darkGray[2]);
  const truncatedValue = value.length > 18 ? value.substring(0, 15) + '...' : value;
  doc.text(truncatedValue, x + 8, y + 22);
  
  // Subtext
  if (subtext) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
    doc.text(subtext, x + 8, y + 30);
  }
}

/**
 * Draw a section with modern header style
 */
export function drawSectionHeader(
  state: LayoutState, 
  title: string, 
  boxHeight: number
): number {
  const { doc, margin, contentWidth } = state;
  const boxY = state.y;
  
  // Card background
  drawRoundedRect(doc, margin, boxY, contentWidth, boxHeight, 4, PDF_COLORS.lightGray);
  
  // Header bar with gradient effect
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.roundedRect(margin, boxY, contentWidth, 14, 4, 4, 'F');
  doc.rect(margin, boxY + 7, contentWidth, 7, 'F');
  
  // Section title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin + 8, boxY + 9);
  
  return boxY;
}

/**
 * Draw compact fields grid (optimized for space)
 */
export function drawFieldsGrid(
  state: LayoutState, 
  fields: PDFField[], 
  startY: number
): void {
  const { doc, margin, contentWidth } = state;
  const colWidth = (contentWidth - 16) / 2;
  let fieldY = startY + 20;
  
  doc.setFontSize(8);
  
  for (let i = 0; i < fields.length; i += 2) {
    // Left column
    const leftField = fields[i];
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
    doc.text(leftField.label, margin + 8, fieldY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.darkGray[0], PDF_COLORS.darkGray[1], PDF_COLORS.darkGray[2]);
    
    const leftValue = leftField.value || 'N/A';
    const maxWidth = colWidth - 5;
    const truncatedLeft = doc.splitTextToSize(leftValue, maxWidth)[0] || 'N/A';
    doc.text(truncatedLeft, margin + 8, fieldY + 5);
    
    // Right column
    if (fields[i + 1]) {
      const rightField = fields[i + 1];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
      doc.text(rightField.label, margin + 8 + colWidth, fieldY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.darkGray[0], PDF_COLORS.darkGray[1], PDF_COLORS.darkGray[2]);
      
      const rightValue = rightField.value || 'N/A';
      const truncatedRight = doc.splitTextToSize(rightValue, maxWidth)[0] || 'N/A';
      doc.text(truncatedRight, margin + 8 + colWidth, fieldY + 5);
    }
    
    fieldY += 12;
  }
}

/**
 * Draw a complete section box
 */
export function drawSectionBox(
  state: LayoutState, 
  title: string, 
  fields: PDFField[]
): void {
  const fieldRows = Math.ceil(fields.length / 2);
  const boxHeight = 18 + (fieldRows * 12);
  
  checkPageBreak(state, boxHeight + 8);
  
  const boxY = drawSectionHeader(state, title, boxHeight);
  drawFieldsGrid(state, fields, boxY);
  
  state.y = boxY + boxHeight + 6;
}

/**
 * Draw a score badge with color
 */
export function drawScoreBadge(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  score: string,
  color: readonly [number, number, number] = PDF_COLORS.primaryBlue
): number {
  const labelWidth = doc.getTextWidth(label) + 6;
  const scoreWidth = doc.getTextWidth(score) + 8;
  const totalWidth = labelWidth + scoreWidth + 2;
  
  // Label background
  doc.setFillColor(PDF_COLORS.lightGray[0], PDF_COLORS.lightGray[1], PDF_COLORS.lightGray[2]);
  doc.roundedRect(x, y, totalWidth, 12, 6, 6, 'F');
  
  // Score highlight
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x + labelWidth, y, scoreWidth + 2, 12, 6, 6, 'F');
  
  // Text
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
  doc.text(label, x + 4, y + 8);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(score, x + labelWidth + 4, y + 8);
  
  return totalWidth + 4;
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
 * Get verification status as text and color
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
 * Draw a small colored status indicator
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
  doc.circle(x + 2, y - 1.5, 2, 'F');
}

/**
 * Add page numbers and footer
 */
export function addPageNumbers(doc: jsPDF, margin: number): void {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(EXTENDED_COLORS.cardBorder[0], EXTENDED_COLORS.cardBorder[1], EXTENDED_COLORS.cardBorder[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    
    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('EduLoan by CashKaro | priyam.sameer@cashkaro.com | Confidential', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }
}

/**
 * Calculate document completion percentage
 */
export function calculateDocCompletion(
  documents: Array<{ verification_status?: string }>
): { total: number; verified: number; percentage: number } {
  const total = documents.length;
  const verified = documents.filter(d => d.verification_status === 'verified').length;
  const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;
  return { total, verified, percentage };
}
