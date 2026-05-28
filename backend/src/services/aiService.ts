import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import { config } from '../config/env';
import { IAssignment, IGeneratedPaper } from '../models/Assignment';

// Initialize the Google Gen AI client if API key is provided
let aiClient: GoogleGenAI | null = null;
if (config.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
}

// Define the response schema using OpenAPI-like schema format supported by Gemini
const paperResponseSchema = {
  type: 'OBJECT',
  properties: {
    sections: {
      type: 'ARRAY',
      description: 'List of sections in the question paper',
      items: {
        type: 'OBJECT',
        properties: {
          name: { 
            type: 'STRING', 
            description: 'Name of the section (e.g., Section A, Section B)' 
          },
          instruction: { 
            type: 'STRING', 
            description: 'General instruction for the section (e.g., Attempt all questions. Each question carries 2 marks)' 
          },
          questions: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { 
                  type: 'STRING', 
                  description: 'Unique question ID, format: q1, q2, q3, etc.' 
                },
                text: { 
                  type: 'STRING', 
                  description: 'The question content text.' 
                },
                difficulty: { 
                  type: 'STRING', 
                  enum: ['Easy', 'Moderate', 'Challenging'],
                  description: 'Difficulty level tag of the question.' 
                },
                marks: { 
                  type: 'INTEGER', 
                  description: 'Marks allocated to this question.' 
                },
                options: { 
                  type: 'ARRAY', 
                  items: { type: 'STRING' },
                  description: 'Provide exactly 4 options if this is a Multiple Choice Question (MCQ). Otherwise, omit or leave empty.' 
                }
              },
              required: ['id', 'text', 'difficulty', 'marks']
            }
          }
        },
        required: ['name', 'instruction', 'questions']
      }
    },
    answerKey: {
      type: 'ARRAY',
      description: 'List of answers corresponding to all generated questions.',
      items: {
        type: 'OBJECT',
        properties: {
          questionId: { 
            type: 'STRING', 
            description: 'The question ID (e.g., q1) this answer solves.' 
          },
          answer: { 
            type: 'STRING', 
            description: 'The correct answer or detailed explanation of the solution.' 
          }
        },
        required: ['questionId', 'answer']
      }
    }
  },
  required: ['sections', 'answerKey']
};

export const generateQuestionPaper = async (assignment: IAssignment): Promise<IGeneratedPaper> => {
  if (!aiClient) {
    throw new Error('Gemini API key is not configured. Cannot process AI generation.');
  }

  // Build the prompt based on configurations
  const configsDesc = assignment.questionConfigs
    .map(c => `- Type: ${c.type}, Total Questions: ${c.count}, Marks per Question: ${c.marks} marks (Total: ${c.count * c.marks} marks)`)
    .join('\n');

  const promptText = `
You are an expert curriculum designer and educator. Generate a structured question paper based on the following configurations:

School Name: ${assignment.schoolName}
Subject: ${assignment.subject}
Grade/Class: ${assignment.grade}
Due Date: ${assignment.dueDate.toDateString()}

Question Configurations:
${configsDesc}

Additional Instructions:
${assignment.additionalInstructions || 'None provided.'}

Requirements:
1. Divide the question paper into logical sections (e.g., Section A, Section B, Section C).
2. For each section, provide a clear instruction (e.g., "Attempt all questions. Each question carries 2 marks").
3. Generate EXACTLY the number of questions requested for each question type in the configurations.
4. Each question must have:
   - A unique question ID in sequence (q1, q2, q3...).
   - The question text.
   - A difficulty level tag: choose from 'Easy', 'Moderate', or 'Challenging' based on the question content.
   - The correct marks value matching the configuration.
   - For 'Multiple Choice Questions' type, you MUST provide exactly 4 string options in the 'options' field. For other types, do not include options.
5. Create a complete, detailed 'answerKey' with a clear solution for each question generated.
6. Make sure the content is highly relevant to the subject and grade level specified. Use the attached upload document if provided.
`;

  const contents: any[] = [promptText];

  // If there's an uploaded file, load and inject it as a multimodal part
  if (assignment.uploadedFilePath && fs.existsSync(assignment.uploadedFilePath)) {
    const fileBuffer = fs.readFileSync(assignment.uploadedFilePath);
    const base64Data = fileBuffer.toString('base64');
    
    // Determine MIME type
    let mimeType = 'text/plain';
    const lowerPath = assignment.uploadedFilePath.toLowerCase();
    if (lowerPath.endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (lowerPath.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    }

    if (mimeType === 'text/plain') {
      contents.push(`\nUse the following text context from the uploaded syllabus/material to generate the questions:\n${fileBuffer.toString('utf-8')}`);
    } else {
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType
        }
      });
    }
  }

  console.log(`Sending AI generation request for assignment: ${assignment._id}`);

  const response = await aiClient.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: paperResponseSchema as any,
      temperature: 0.3,
    }
  });

  if (!response.text) {
    throw new Error('Empty response received from Gemini API');
  }

  try {
    const parsedData = JSON.parse(response.text) as IGeneratedPaper;
    return parsedData;
  } catch (parseError) {
    console.error('Failed to parse Gemini response as JSON. Raw text was:', response.text);
    throw new Error(`AI generated invalid structured data: ${(parseError as Error).message}`);
  }
};
