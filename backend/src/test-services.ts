import mongoose from 'mongoose';
import { generateQuestionPaper } from './services/aiService';
import { generateAssignmentPDFs } from './services/pdfService';
import { Assignment, IAssignment } from './models/Assignment';
import { config } from './config/env';
import path from 'path';
import fs from 'fs';

// Force load env
import dotenv from 'dotenv';
dotenv.config();

const mockAssignmentData = {
  title: 'Quiz on Electricity & Chemical Effects',
  schoolName: 'Delhi Public School, Sector-4, Bokaro',
  subject: 'Science',
  grade: 'Class 8th',
  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
  questionConfigs: [
    { type: 'Multiple Choice Questions', count: 2, marks: 1 },
    { type: 'Short Questions', count: 3, marks: 2 },
    { type: 'Numerical Problems', count: 1, marks: 5 }
  ],
  additionalInstructions: 'Generate a question paper for grade 8 level matching NCERT chapter on Chemical Effects of Electric Current.',
  status: 'pending' as const
};

async function testServices() {
  console.log('--- STARTING STANDALONE SERVICES TEST ---');
  console.log('Gemini API Key configured:', !!config.GEMINI_API_KEY);
  
  if (!config.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not defined in the environment. Cannot perform AI tests.');
    process.exit(1);
  }

  // Create temporary in-memory/mock assignment object (no DB save needed to test services)
  const dummyAssignment = new Assignment(mockAssignmentData);
  
  try {
    // 1. Test AI Question Generation
    console.log('\nStep 1: Testing Gemini AI Question Generation...');
    console.log('Sending config:');
    console.log(JSON.stringify(mockAssignmentData.questionConfigs, null, 2));
    
    const paper = await generateQuestionPaper(dummyAssignment);
    
    console.log('\nAI Generation Successful! Output Structure:');
    console.log(`Sections count: ${paper.sections.length}`);
    for (const sec of paper.sections) {
      console.log(`- ${sec.name}: "${sec.instruction}" with ${sec.questions.length} questions`);
      for (const q of sec.questions) {
        console.log(`  * [${q.difficulty}] ${q.id}: ${q.text.substring(0, 50)}... (${q.marks} Marks)`);
      }
    }
    console.log(`Answer Key items: ${paper.answerKey.length}`);

    // Set paper on assignment
    dummyAssignment.generatedPaper = paper;

    // 2. Test PDF Generation
    console.log('\nStep 2: Testing PDF Compiler (PDFKit)...');
    
    const paths = await generateAssignmentPDFs(dummyAssignment);
    
    console.log('\nPDF Compilation Successful!');
    console.log(`Student PDF compiled to: ${paths.studentPdfPath}`);
    console.log(`Teacher PDF compiled to: ${paths.teacherPdfPath}`);

    const absStudentPath = path.join(config.UPLOADS_DIR, `${dummyAssignment._id}-student.pdf`);
    const absTeacherPath = path.join(config.UPLOADS_DIR, `${dummyAssignment._id}-teacher.pdf`);
    
    console.log(`Student File Exists: ${fs.existsSync(absStudentPath)} (Size: ${fs.statSync(absStudentPath).size} bytes)`);
    console.log(`Teacher File Exists: ${fs.existsSync(absTeacherPath)} (Size: ${fs.statSync(absTeacherPath).size} bytes)`);

    console.log('\n--- STANDALONE SERVICES TEST COMPLETE ---');
    process.exit(0);
  } catch (error) {
    console.error('Test Failed with Error:', error);
    process.exit(1);
  }
}

testServices();
