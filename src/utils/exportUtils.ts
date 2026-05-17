import { toPng } from 'html-to-image';
import download from 'downloadjs';
import type { DataRow } from '../types';
import Papa from 'papaparse';

export const exportToCSV = (data: DataRow[], filename: string = 'export.csv') => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportElementToPNG = async (elementId: string, filename: string = 'chart.png') => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    const dataUrl = await toPng(element, { quality: 1, pixelRatio: 2 });
    download(dataUrl, filename);
  } catch (error) {
    console.error('Failed to export PNG', error);
  }
};



