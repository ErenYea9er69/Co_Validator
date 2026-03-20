/**
 * generatePDF
 * Triggers the browser's native PDF generator (Print to PDF) securely.
 * We rely on highly optimized @media print CSS in globals.css to maintain 
 * the exact Apple Liquid Glass dark theme, ensuring ultra-crisp vector text
 * and perfect layouts without relying on buggy HTML canvas scrapers.
 */
export const generatePDF = (ideaName: string) => {
  // Add a slight delay to ensure React state has settled
  setTimeout(() => {
    window.print();
  }, 300);
};
