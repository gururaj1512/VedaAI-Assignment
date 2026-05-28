import { Schema, model, Document } from 'mongoose';

export interface IQuestion {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  options?: string[]; // For Multiple Choice Questions
}

export interface ISection {
  name: string; // e.g. "Section A"
  instruction: string; // e.g. "Attempt all questions. Each question carries 2 marks"
  questions: IQuestion[];
}

export interface IAnswer {
  questionId: string;
  answer: string;
}

export interface IGeneratedPaper {
  sections: ISection[];
  answerKey: IAnswer[];
}

export interface IQuestionConfig {
  type: string;       // e.g. "Multiple Choice Questions", "Short Questions"
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  schoolName: string;
  subject: string;
  grade: string;
  dueDate: Date;
  assignedDate: Date;
  questionConfigs: IQuestionConfig[];
  additionalInstructions?: string;
  uploadedFilePath?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  generatedPaper?: IGeneratedPaper;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionConfigSchema = new Schema<IQuestionConfig>({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 }
}, { _id: false });

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'], required: true },
  marks: { type: Number, required: true },
  options: { type: [String], default: undefined }
}, { _id: false });

const SectionSchema = new Schema<ISection>({
  name: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true }
}, { _id: false });

const AnswerSchema = new Schema<IAnswer>({
  questionId: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const GeneratedPaperSchema = new Schema<IGeneratedPaper>({
  sections: { type: [SectionSchema], required: true },
  answerKey: { type: [AnswerSchema], required: true }
}, { _id: false });

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true, trim: true },
  schoolName: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  grade: { type: String, required: true, trim: true },
  dueDate: { type: Date, required: true },
  assignedDate: { type: Date, default: Date.now },
  questionConfigs: { type: [QuestionConfigSchema], required: true },
  additionalInstructions: { type: String, trim: true },
  uploadedFilePath: { type: String },
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  error: { type: String },
  generatedPaper: { type: GeneratedPaperSchema },
  pdfPath: { type: String }
}, {
  timestamps: true
});

export const Assignment = model<IAssignment>('Assignment', AssignmentSchema);
export default Assignment;
