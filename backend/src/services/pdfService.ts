import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { IAssignment } from '../models/Assignment';

/**
 * Ensures that the uploads directory exists.
 */
const ensureUploadsDir = () => {
  if (!fs.existsSync(config.UPLOADS_DIR)) {
    fs.mkdirSync(config.UPLOADS_DIR, { recursive: true });
  }
};

/**
 * Parses simple markdown elements (bolding **text**, bullets *, -, •, or numbered lists)
 * and draws them aligned and formatted to the PDF using PDFKit.
 */
const drawFormattedText = (doc: any, text: string, startX: number, width: number): void => {
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
    let cleanedLine = line.trim();

    if (cleanedLine === '') {
      doc.moveDown(0.3);
      continue;
    }

    let isBullet = false;
    let isNumbered = false;
    let listNumber = '';

    if (cleanedLine.startsWith('* ') || cleanedLine.startsWith('- ') || cleanedLine.startsWith('• ')) {
      isBullet = true;
      cleanedLine = cleanedLine.substring(2);
    } else {
      const numMatch = cleanedLine.match(/^(\d+)\.\s+/);
      if (numMatch) {
        isNumbered = true;
        listNumber = numMatch[1];
        cleanedLine = cleanedLine.substring(numMatch[0].length);
      }
    }

    // Indent item lines
    let lineX = startX + (leadingSpaces * 4);
    if (isBullet || isNumbered) {
      lineX += 15;
    }

    const textWidth = width - (lineX - startX);
    const currentY = doc.y;

    if (isBullet) {
      doc.font('Helvetica-Bold').text('• ', lineX - 10, currentY);
    } else if (isNumbered) {
      doc.font('Helvetica-Bold').text(`${listNumber}. `, lineX - 15, currentY);
    }

    // Set cursor for the content block
    doc.x = lineX;
    doc.y = currentY;

    // Regex match bold tags **word**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;
    const parts: { text: string; isBold: boolean }[] = [];

    while ((match = boldRegex.exec(cleanedLine)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: cleanedLine.substring(lastIndex, match.index),
          isBold: false
        });
      }
      parts.push({
        text: match[1],
        isBold: true
      });
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < cleanedLine.length) {
      parts.push({
        text: cleanedLine.substring(lastIndex),
        isBold: false
      });
    }

    if (parts.length === 0) {
      parts.push({ text: cleanedLine, isBold: false });
    }

    // Write parts inline
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j];
      if (part.isBold) {
        doc.font('Helvetica-Bold');
      } else {
        doc.font('Helvetica');
      }

      const isLastPart = (j === parts.length - 1);
      doc.text(part.text, { width: textWidth, continued: !isLastPart });
    }

    doc.moveDown(0.25);
  }
};

/**
 * Parses simple markdown elements (bolding **text**)
 * and draws them inline without list formatting or moving down.
 */
const drawInlineFormattedText = (doc: any, text: string, textWidth: number, isContinuedAtEnd: boolean): void => {
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  const parts: { text: string; isBold: boolean }[] = [];

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        isBold: false
      });
    }
    parts.push({
      text: match[1],
      isBold: true
    });
    lastIndex = boldRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      isBold: false
    });
  }

  if (parts.length === 0) {
    parts.push({ text: text, isBold: false });
  }

  for (let j = 0; j < parts.length; j++) {
    const part = parts[j];
    if (part.isBold) {
      doc.font('Helvetica-Bold');
    } else {
      doc.font('Helvetica');
    }

    const isLastPart = (j === parts.length - 1);
    doc.text(part.text, { width: textWidth, continued: !isLastPart ? true : isContinuedAtEnd });
  }
};

/**
 * Builds a single PDF file (either Student version or Teacher version)
 */
const buildPdfFile = (assignment: IAssignment, filePath: string, includeAnswerKey: boolean): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      ensureUploadsDir();
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // --- HEADER SECTION ---
      // School Name
      doc.font('Helvetica-Bold')
         .fontSize(18)
         .text(assignment.schoolName.toUpperCase(), { align: 'center' });
      doc.moveDown(0.3);

      // Subject and Class
      doc.font('Helvetica')
         .fontSize(12)
         .text(`Subject: ${assignment.subject}   |   Class: ${assignment.grade}`, { align: 'center' });
      doc.moveDown(0.5);

      // Divider Line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.4);

      // Due Date & Max Marks
      const totalMarks = assignment.questionConfigs.reduce((sum, c) => sum + (c.count * c.marks), 0);
      
      const currentY = doc.y;
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .text(`Due Date: ${new Date(assignment.dueDate).toLocaleDateString('en-GB')}`, 50, currentY);
      doc.text(`Maximum Marks: ${totalMarks}`, 350, currentY, { align: 'right', width: 195 });
      
      doc.moveDown(0.6);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.6);

      // General Instructions
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .text('General Instructions:');
      doc.font('Helvetica-Oblique')
         .fontSize(9)
         .text('All questions are compulsory unless stated otherwise. Write clearly and show workings where necessary.');
      doc.moveDown(0.8);

      // --- STUDENT INFO BLOCK ---
      doc.font('Helvetica')
         .fontSize(10);
      
      const infoY = doc.y;
      doc.text('Name: _______________________________', 50, infoY);
      doc.text('Roll Number: ________________________', 320, infoY);
      doc.moveDown(0.8);
      
      const infoY2 = doc.y;
      doc.text('Class/Section: ______________________', 50, infoY2);
      doc.text('Date: _______________________________', 320, infoY2);
      doc.moveDown(1.5);

      // --- QUESTION SECTIONS ---
      if (assignment.generatedPaper && assignment.generatedPaper.sections) {
        let globalQuestionIndex = 1;

        for (const section of assignment.generatedPaper.sections) {
          // Section Heading
          doc.font('Helvetica-Bold')
             .fontSize(13)
             .text(section.name, 50, doc.y, { align: 'center', underline: true, width: 495 });
          doc.moveDown(0.3);

          // Section instructions
          doc.font('Helvetica-Oblique')
             .fontSize(9.5)
             .text(section.instruction, 50, doc.y, { align: 'left', width: 495 });
          doc.moveDown(0.8);

          // Questions in section
          for (const q of section.questions) {
            const questionY = doc.y;

            // Draw index and difficulty/marks tags on left/right side or flow
            // Flow text with layout tags
            doc.font('Helvetica-Bold')
               .fontSize(10)
               .text(`${globalQuestionIndex}. `, 50, questionY, { continued: true });
            
            // Highlight difficulty tag
            doc.font('Helvetica-Bold')
               .fontSize(9)
               .text(`[${q.difficulty}] `, { continued: true });
            
            // Question body text (inline formatted)
            drawInlineFormattedText(doc, q.text, 495, true);
            
            // Marks tag right-aligned at the end
            doc.font('Helvetica-Bold')
               .fontSize(9)
               .text(` [${q.marks} Marks]`, { align: 'right' });
            
            doc.moveDown(0.4);

            // MCQs Options
            if (q.options && q.options.length > 0) {
              const alphabet = ['A', 'B', 'C', 'D'];
              doc.font('Helvetica').fontSize(9.5);
              
              // Draw options in a grid format (2 columns)
              const optY = doc.y;
              doc.text(`(A) ${q.options[0]}`, 70, optY, { width: 220 });
              doc.text(`(B) ${q.options[1]}`, 300, optY, { width: 220 });
              doc.moveDown(0.3);
              
              const optY2 = doc.y;
              doc.text(`(C) ${q.options[2]}`, 70, optY2, { width: 220 });
              doc.text(`(D) ${q.options[3]}`, 300, optY2, { width: 220 });
              doc.moveDown(0.8);
            } else {
              doc.moveDown(0.6);
            }

            globalQuestionIndex++;
          }
          doc.moveDown(1.0);
        }
      }

      // --- END OF EXAM PAPER ---
      doc.moveDown(1.0);
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .text('*** End of Question Paper ***', 50, doc.y, { align: 'center', width: 495 });

      // --- ANSWER KEY SECTION (If requested) ---
      if (includeAnswerKey && assignment.generatedPaper && assignment.generatedPaper.answerKey) {
        doc.addPage();
        
        doc.font('Helvetica-Bold')
           .fontSize(16)
           .text('ANSWER KEY', { align: 'center', underline: true });
        doc.moveDown(1.0);

        let answerIndex = 1;
        for (const ans of assignment.generatedPaper.answerKey) {
          // Find matching question text if possible
          let questionText = '';
          if (assignment.generatedPaper.sections) {
            for (const sec of assignment.generatedPaper.sections) {
              const q = sec.questions.find(item => item.id === ans.questionId);
              if (q) {
                questionText = q.text;
                break;
              }
            }
          }

          doc.font('Helvetica-Bold')
             .fontSize(10)
             .text(`Question ${answerIndex}: `, { continued: true });
          
          drawInlineFormattedText(doc, questionText, 495, false);
          doc.moveDown(0.2);

          doc.font('Helvetica-Bold')
             .fontSize(10)
             .text('Correct Answer / Solution:');
          
          doc.fontSize(9.5);
          drawFormattedText(doc, ans.answer, 50, 495);
          doc.moveDown(0.8);

          answerIndex++;
        }
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates both the Student PDF (no answer key) and Teacher PDF (with answer key).
 * Returns the path to the Student PDF.
 */
export const generateAssignmentPDFs = async (assignment: IAssignment): Promise<{ studentPdfPath: string; teacherPdfPath: string }> => {
  const studentFileName = `${assignment._id}-student.pdf`;
  const teacherFileName = `${assignment._id}-teacher.pdf`;
  
  const studentPath = path.join(config.UPLOADS_DIR, studentFileName);
  const teacherPath = path.join(config.UPLOADS_DIR, teacherFileName);

  console.log(`Compiling Student PDF to: ${studentPath}`);
  await buildPdfFile(assignment, studentPath, false);

  console.log(`Compiling Teacher PDF to: ${teacherPath}`);
  await buildPdfFile(assignment, teacherPath, true);

  return {
    studentPdfPath: `/uploads/${studentFileName}`,
    teacherPdfPath: `/uploads/${teacherFileName}`
  };
};
