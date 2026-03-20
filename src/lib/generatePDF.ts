import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDF = (idea: any, result: any, rawData: any) => {
  const doc = new jsPDF();
  let y = 20;

  const addTitle = (text: string) => {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 14, y);
    y += (lines.length * 8);
  };

  const addText = (text: string, size = 10, offset = 14) => {
    if(!text) return;
    doc.setFontSize(size);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(String(text), 180);
    doc.text(lines, offset, y);
    y += (lines.length * 5) + 2;
  };
  
  const checkPageBreak = (neededRoom: number) => {
    if (y + neededRoom > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // 1. Cover / Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`AI Startup Due Diligence Report`, 14, y);
  y += 10;
  
  doc.setFontSize(12);
  doc.text(`Target: ${idea.name} | Industry: ${idea.industry} | Budget: ${idea.budget}`, 14, y);
  y += 15;

  // The Verdict
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  const verdictColor = result.verdict?.includes('Greenlit') ? [34, 197, 94] : result.verdict?.includes('Pivot') ? [234, 179, 8] : [220, 38, 38];
  // @ts-ignore
  doc.setFillColor(...verdictColor);
  doc.rect(14, y, 182, 10, 'F');
  doc.text(`FINAL VERDICT: ${result.verdict?.toUpperCase() || 'INDICTED'}`, 18, y + 7);
  y += 20;

  // Core Bet
  addTitle('Primary Hypothesis');
  addText(result.coreBet);
  y += 5;

  // Executive Summary (Reasoning)
  addTitle('Executive Summary');
  addText(result.reasoning);
  y += 10;

  // Assumptions
  checkPageBreak(50);
  addTitle('Key Assumptions Breakdown');
  if (result.criticalAssumptionStack && Array.isArray(result.criticalAssumptionStack)) {
    const tableBody = result.criticalAssumptionStack.map((item: any) => [
      item.assumption,
      item.lethality,
      item.uncertainty,
      item.testAgenda?.substring(0, 120) + (item.testAgenda?.length > 120 ? '...' : '')
    ]);
    autoTable(doc, {
      startY: y,
      head: [['Assumption', 'Risk Level', 'Uncertainty', 'Test Agenda']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 3: { cellWidth: 80 } }
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 15;
  }

  // Pre-Mortem
  checkPageBreak(50);
  if (rawData.preMortem?.result?.fatalScenarios) {
    addTitle('Critical Failure Scenarios');
    const pmBody = rawData.preMortem.result.fatalScenarios.map((s: any) => [
      s.name,
      s.probability,
      s.description?.substring(0, 150) + (s.description?.length > 150 ? '...' : '')
    ]);
    autoTable(doc, {
      startY: y,
      head: [['Scenario', 'Probability', 'Description']],
      body: pmBody,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 25 } }
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 15;
  }

  // Unit Economics
  checkPageBreak(50);
  if (rawData.p10?.result?.unitEconomics) {
    addTitle('Unit Economics & Constraints');
    if (rawData.p10.result.breakevenConditions) {
        addText(`Breakeven Conditions: ${rawData.p10.result.breakevenConditions}`, 9);
        y += 5;
    }
    const ueBody = Object.entries(rawData.p10.result.unitEconomics).map(([key, val]) => [key.replace(/([A-Z])/g, ' $1').toUpperCase(), String(val)]);
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Estimate']],
      body: ueBody,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] }
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 15;
  }

  // Competitor Actions
  checkPageBreak(50);
  if (rawData.competitiveResponse?.result?.retaliationMoves) {
    addTitle('Expected Competitor Actions');
    const compBody = rawData.competitiveResponse.result.retaliationMoves.map((m: any) => [
      m.competitor,
      m.move,
      m.lethality
    ]);
    autoTable(doc, {
      startY: y,
      head: [['Incumbent', 'Expected Retaliation', 'Risk']],
      body: compBody,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] },
      styles: { fontSize: 8 }
    });
  }

  // Save the PDF
  doc.save(`CoValidator_Audit_${idea.name.replace(/\s+/g, '_')}.pdf`);
};
