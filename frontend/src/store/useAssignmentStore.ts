import { create } from 'zustand';

export interface IQuestion {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  options?: string[];
}

export interface ISection {
  name: string;
  instruction: string;
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
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment {
  _id: string;
  title: string;
  schoolName: string;
  subject: string;
  grade: string;
  dueDate: string;
  assignedDate: string;
  questionConfigs: IQuestionConfig[];
  additionalInstructions?: string;
  uploadedFilePath?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  generatedPaper?: IGeneratedPaper;
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IWizardData {
  title: string;
  schoolName: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionConfigs: IQuestionConfig[];
  additionalInstructions: string;
  file: File | null;
}

interface IAssignmentState {
  assignments: IAssignment[];
  isLoading: boolean;
  error: string | null;
  currentStep: 'dashboard' | 'create' | 'view';
  selectedAssignment: IAssignment | null;
  wizardData: IWizardData;
  progressLog: string;

  // Actions
  fetchAssignments: () => Promise<void>;
  createAssignment: () => Promise<IAssignment | null>;
  deleteAssignment: (id: string) => Promise<void>;
  regenerateAssignment: (id: string) => Promise<void>;
  setCurrentStep: (step: 'dashboard' | 'create' | 'view') => void;
  setSelectedAssignment: (assignment: IAssignment | null) => void;
  updateWizardData: (data: Partial<IWizardData>) => void;
  resetWizardData: () => void;
  updateAssignmentStatus: (assignmentId: string, status: IAssignment['status'], payload?: Partial<IAssignment>) => void;
  setProgressLog: (log: string) => void;
}

const initialWizardData: IWizardData = {
  title: '',
  schoolName: 'Delhi Public School, Sector-4, Bokaro', // Default from designs
  subject: 'Science',
  grade: 'Class 8th',
  dueDate: '',
  questionConfigs: [
    { type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { type: 'Short Questions', count: 3, marks: 2 },
    { type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
    { type: 'Numerical Problems', count: 5, marks: 5 }
  ],
  additionalInstructions: '',
  file: null
};

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api`;

export const useAssignmentStore = create<IAssignmentState>((set, get) => ({
  assignments: [],
  isLoading: false,
  error: null,
  currentStep: 'dashboard',
  selectedAssignment: null,
  wizardData: initialWizardData,
  progressLog: '',

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/assignments`);
      const data = await response.json();
      if (data.success) {
        set({ assignments: data.assignments, isLoading: false });
      } else {
        set({ error: data.message, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch assignments', isLoading: false });
    }
  },

  createAssignment: async () => {
    set({ isLoading: true, error: null, progressLog: 'Uploading details...' });
    const { wizardData } = get();

    const formData = new FormData();
    formData.append('title', wizardData.title);
    formData.append('schoolName', wizardData.schoolName);
    formData.append('subject', wizardData.subject);
    formData.append('grade', wizardData.grade);
    formData.append('dueDate', wizardData.dueDate);
    formData.append('additionalInstructions', wizardData.additionalInstructions);
    formData.append('questionConfigs', JSON.stringify(wizardData.questionConfigs));
    if (wizardData.file) {
      formData.append('file', wizardData.file);
    }

    try {
      const response = await fetch(`${API_BASE}/assignments`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        set((state) => ({
          assignments: [data.assignment, ...state.assignments],
          selectedAssignment: data.assignment,
          currentStep: 'view',
          isLoading: false
        }));
        return data.assignment;
      } else {
        set({ error: data.message, isLoading: false });
        return null;
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to initiate creation', isLoading: false });
      return null;
    }
  },

  deleteAssignment: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        set((state) => ({
          assignments: state.assignments.filter((a) => a._id !== id),
          selectedAssignment: state.selectedAssignment?._id === id ? null : state.selectedAssignment,
          currentStep: state.selectedAssignment?._id === id ? 'dashboard' : state.currentStep
        }));
      }
    } catch (err: any) {
      console.error('Failed to delete assignment:', err);
    }
  },

  regenerateAssignment: async (id) => {
    set({ isLoading: true, error: null, progressLog: 'Queueing regeneration...' });
    try {
      const response = await fetch(`${API_BASE}/assignments/${id}/regenerate`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        set((state) => ({
          selectedAssignment: data.assignment,
          assignments: state.assignments.map((a) => (a._id === id ? data.assignment : a)),
          isLoading: false
        }));
      } else {
        set({ error: data.message, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to trigger regeneration', isLoading: false });
    }
  },

  setCurrentStep: (step) => set({ currentStep: step }),
  setSelectedAssignment: (assignment) => set({ selectedAssignment: assignment }),
  updateWizardData: (data) => set((state) => ({ wizardData: { ...state.wizardData, ...data } })),
  resetWizardData: () => set({ wizardData: initialWizardData }),

  updateAssignmentStatus: (assignmentId, status, payload = {}) => {
    set((state) => {
      const updatedAssignments = state.assignments.map((a) => {
        if (a._id === assignmentId) {
          return { ...a, status, ...payload };
        }
        return a;
      });

      let updatedSelected = state.selectedAssignment;
      if (state.selectedAssignment?._id === assignmentId) {
        updatedSelected = { ...state.selectedAssignment, status, ...payload };
      }

      return {
        assignments: updatedAssignments,
        selectedAssignment: updatedSelected
      };
    });
  },

  setProgressLog: (log) => set({ progressLog: log })
}));
