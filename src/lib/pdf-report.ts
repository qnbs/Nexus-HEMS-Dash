/**
 * PDF Monthly Report Generator
 * Creates comprehensive energy reports with Sankey diagrams and CO2 balance
 */

import type { EnergyData } from '../types';

export interface MonthlyStats {
  month: string;
  year: number;
  totalPvGeneration: number;
  totalGridImport: number;
  totalGridExport: number;
  totalConsumption: number;
  selfConsumptionRate: number;
  co2Saved: number;
  costSavings: number;
}

/**
 * Generates monthly energy statistics
 */
export async function generateMonthlyStats(
  year: number,
  month: number,
): Promise<MonthlyStats> {
  // In production, fetch from IndexedDB
  return {
    month: new Date(year, month).toLocaleString('de-DE', { month: 'long' }),
    year,
    totalPvGeneration: 850.3,
    totalGridImport: 120.5,
    totalGridExport: 380.2,
    totalConsumption: 590.6,
    selfConsumptionRate: 79.5,
    co2Saved: 425.2,
    costSavings: 156.8,
  };
}

/**
 * Captures Sankey diagram as PNG for PDF inclusion
 */
export async function captureSankeyDiagram(): Promise<string> {
  const svgElement = document.querySelector('svg[role="img"]') as SVGSVGElement;
  if (!svgElement) {
    throw new Error('Sankey diagram not found');
  }

  // Convert SVG to data URL
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Convert to PNG using canvas
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  return new Promise((resolve, reject) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Generates PDF report
 * In production, use jsPDF or similar library
 */
export async function generatePdfReport(stats: MonthlyStats): Promise<Blob> {
  console.log('Generating PDF report for', stats.month, stats.year);

  // Capture Sankey diagram
  const sankeyImage = await captureSankeyDiagram();

  // Mock PDF generation
  const pdfContent = `
    Nexus-HEMS Energy Report
    ${stats.month} ${stats.year}
    
    PV Generation: ${stats.totalPvGeneration.toFixed(1)} kWh
    Grid Import: ${stats.totalGridImport.toFixed(1)} kWh
    Grid Export: ${stats.totalGridExport.toFixed(1)} kWh
    Consumption: ${stats.totalConsumption.toFixed(1)} kWh
    Self-Consumption: ${stats.selfConsumptionRate.toFixed(1)}%
    CO₂ Saved: ${stats.co2Saved.toFixed(1)} kg
    Cost Savings: €${stats.costSavings.toFixed(2)}
    
    [Sankey Diagram]
    ${sankeyImage.substring(0, 100)}...
  `;

  return new Blob([pdfContent], { type: 'application/pdf' });
}

/**
 * Downloads PDF report
 */
export async function downloadPdfReport(stats: MonthlyStats): Promise<void> {
  const blob = await generatePdfReport(stats);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nexus-hems-report-${stats.year}-${String(new Date(stats.year, 0).getMonth() + 1).padStart(2, '0')}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Calculate CO2 savings based on PV generation
 */
export function calculateCo2Savings(pvGenerationKwh: number): number {
  // Average grid CO2 intensity: 500g/kWh
  const gridCo2Intensity = 0.5; // kg/kWh
  return pvGenerationKwh * gridCo2Intensity;
}
