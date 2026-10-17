"use client";
import { jsPDF } from "jspdf";

export function downloadPdf(text: string, filename: string) {
  const doc = new jsPDF();
  
  // Replace problematic unicode with ASCII-safe equivalents
  const cleanText = text
    .replace(/→/g, "->")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const lines = doc.splitTextToSize(cleanText, 180);
  let y = 20;
  
  for (const ln of lines) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    
    // Detect headers (lines starting with ## or all caps)
    if (ln.trim().startsWith("##")) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(ln.trim().replace(/^##\s*/, ""), 15, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    } else if (ln.trim().match(/^[A-Z\s]{10,}$/)) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(ln, 15, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    } else {
      doc.text(ln, 15, y);
      y += 6;
    }
  }
  
  doc.save(filename.endsWith(".pdf") ? filename : filename + ".pdf");
}
