import { jsPDF } from 'jspdf';
import { Quiz } from '../types';

export const generateQuizPDF = (quiz: Quiz) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const checkPageBreak = (amount: number) => {
    if (yPosition + amount > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(quiz.title, pageWidth - 2 * margin);
  doc.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 10 + 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(quiz.description, pageWidth - 2 * margin);
  doc.text(descLines, margin, yPosition);
  yPosition += descLines.length * 7 + 20;

  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  quiz.questions.forEach((q, index) => {
    checkPageBreak(40);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const questionTitle = `Q${index + 1}: ${q.question}`;
    const questionLines = doc.splitTextToSize(questionTitle, pageWidth - 2 * margin);
    doc.text(questionLines, margin, yPosition);
    yPosition += questionLines.length * 7 + 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    q.options.forEach((opt, optIndex) => {
      const optLabel = String.fromCharCode(65 + optIndex);
      const optText = `${optLabel}. ${opt}`;
      const optLines = doc.splitTextToSize(optText, pageWidth - 2 * margin - 10);
      
      checkPageBreak(optLines.length * 7);
      doc.text(optLines, margin + 5, yPosition);
      yPosition += optLines.length * 7;
    });

    yPosition += 10;
  });

  doc.addPage();
  yPosition = margin;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("Answer Key", margin, yPosition);
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition + 5, pageWidth - margin, yPosition + 5);
  yPosition += 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  quiz.questions.forEach((q, index) => {
    checkPageBreak(25);
    
    doc.setFont('helvetica', 'bold');
    const answerChar = String.fromCharCode(65 + q.correctAnswerIndex);
    const answerText = `${index + 1}. ${answerChar}`;
    doc.text(answerText, margin, yPosition);
    
    // Explanation
    if (q.explanation) {
        yPosition += 6;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(80);
        const explanationPrefix = "Explanation: ";
        const explanationLines = doc.splitTextToSize(`${explanationPrefix}${q.explanation}`, pageWidth - 2 * margin - 10);
        doc.text(explanationLines, margin + 5, yPosition);
        
        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        yPosition += explanationLines.length * 5;
    } else {
        doc.setFont('helvetica', 'normal');
    }
    yPosition += 8;
  });

  doc.save(`${quiz.title.replace(/\s+/g, '_')}_quiz.pdf`);
};