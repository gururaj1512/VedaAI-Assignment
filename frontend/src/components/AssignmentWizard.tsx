'use client';

import React, { useState } from 'react';
import { CalendarPlus, Mic, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAssignmentStore, IQuestionConfig } from '../store/useAssignmentStore';
import FileUpload from './ui/FileUpload';

const PRESETS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Fill in the Blanks',
  'True or False'
];

export default function AssignmentWizard() {
  const { 
    wizardData, 
    updateWizardData, 
    createAssignment, 
    setCurrentStep, 
    isLoading,
    progressLog
  } = useAssignmentStore();

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateWizardData({ [e.target.name]: e.target.value });
  };

  const handleFileSelect = (file: File | null) => {
    updateWizardData({ file });
  };

  // --- Question Type Handlers ---
  const handleAddQuestionType = () => {
    const nextAvailable = PRESETS.find(p => !wizardData.questionConfigs.some(c => c.type === p)) || PRESETS[0];
    updateWizardData({
      questionConfigs: [
        ...wizardData.questionConfigs,
        { type: nextAvailable, count: 5, marks: 2 }
      ]
    });
  };

  const handleRemoveQuestionType = (index: number) => {
    const updated = [...wizardData.questionConfigs];
    updated.splice(index, 1);
    updateWizardData({ questionConfigs: updated });
  };

  const handleRowTypeChange = (index: number, type: string) => {
    const updated = [...wizardData.questionConfigs];
    updated[index] = { ...updated[index], type };
    updateWizardData({ questionConfigs: updated });
  };

  const handleCounterChange = (index: number, field: 'count' | 'marks', delta: number) => {
    const updated = [...wizardData.questionConfigs];
    const val = updated[index][field];
    const newVal = Math.max(1, val + delta);
    updated[index] = { ...updated[index], [field]: newVal };
    updateWizardData({ questionConfigs: updated });
  };

  // --- Calculations ---
  const totalQuestions = wizardData.questionConfigs.reduce((sum, c) => sum + c.count, 0);
  const totalMarks = wizardData.questionConfigs.reduce((sum, c) => sum + (c.count * c.marks), 0);

  // --- Submit handler ---
  const handleNextSubmit = async () => {
    setValidationError(null);

    if (!wizardData.title.trim()) {
      setValidationError('Please enter an assignment title');
      return;
    }

    if (!wizardData.schoolName.trim()) {
      setValidationError('Please enter a school name');
      return;
    }

    if (!wizardData.dueDate) {
      setValidationError('Please select a due date');
      return;
    }

    if (wizardData.questionConfigs.length === 0) {
      setValidationError('Please configure at least one question type');
      return;
    }

    // Submit to backend
    const assignment = await createAssignment();
    if (!assignment) {
      setValidationError('Failed to initiate AI question generation. Please check backend log.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full items-center">
      {/* Wizard Step Indicator Header */}
      <div className="w-full max-w-4xl wizard-header">
        <div className="wizard-title-group">
          <div className="wizard-indicator-dot"></div>
          <div>
            <h1 className="wizard-title">Create Assignment</h1>
            <p className="wizard-subtitle">Set up a new assignment for your students</p>
          </div>
        </div>
        <div className="wizard-progress-bar">
          <div className="progress-segment active"></div>
          <div className="progress-segment inactive"></div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="wizard-card">
        {/* Title Block */}
        <div>
          <h2 className="form-section-title">Assignment Details</h2>
          <p className="form-section-subtitle">Basic information about your assignment</p>
        </div>

        {/* Assignment Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="title">Assignment Title</label>
          <input 
            type="text" 
            id="title"
            name="title"
            placeholder="e.g. Quiz on Electricity"
            className="input-text"
            value={wizardData.title}
            onChange={handleTextChange}
          />
        </div>

        {/* Hidden inputs to keep values for validation/submitting */}
        <input type="hidden" name="schoolName" value={wizardData.schoolName} />

        {/* Drag and Drop File Upload */}
        <FileUpload 
          selectedFile={wizardData.file}
          onFileSelect={handleFileSelect}
        />

        {/* Due Date Picker */}
        <div className="form-group">
          <label className="form-label" htmlFor="dueDate">Due Date</label>
          <div className="input-with-icon">
            <input 
              type="date" 
              id="dueDate"
              name="dueDate"
              className="input-text"
              value={wizardData.dueDate}
              onChange={handleTextChange}
            />
            <div className="input-icon-right">
              <CalendarPlus size={18} />
            </div>
          </div>
        </div>

        {/* Question Type Counters */}
        <div className="form-group">
          {wizardData.questionConfigs.length > 0 && (
            <div className="question-config-header hidden md:flex">
              <div className="header-col-type">Question Type</div>
              <div className="header-col-spacing"></div>
              <div className="header-col-count">No. of Questions</div>
              <div className="header-col-marks">Marks</div>
            </div>
          )}

          <div className="question-configs-list">
            {wizardData.questionConfigs.map((config, index) => (
              <div key={index} className="question-config-row">
                
                {/* Select Type Dropdown */}
                <div className="dropdown-select-wrapper">
                  <select 
                    className="dropdown-select"
                    value={config.type}
                    onChange={(e) => handleRowTypeChange(index, e.target.value)}
                  >
                    {PRESETS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Delete Row Button */}
                <button 
                  type="button" 
                  className="btn-remove-row"
                  onClick={() => handleRemoveQuestionType(index)}
                >
                  ×
                </button>

                {/* Number of Questions Counter */}
                <div className="counter-group">
                  <span className="counter-label">No. of Questions</span>
                  <div className="counter-controls">
                    <button 
                      type="button" 
                      className="btn-counter"
                      onClick={() => handleCounterChange(index, 'count', -1)}
                    >
                      -
                    </button>
                    <span className="counter-value">{config.count}</span>
                    <button 
                      type="button" 
                      className="btn-counter"
                      onClick={() => handleCounterChange(index, 'count', 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Marks per Question Counter */}
                <div className="counter-group">
                  <span className="counter-label">Marks</span>
                  <div className="counter-controls">
                    <button 
                      type="button" 
                      className="btn-counter"
                      onClick={() => handleCounterChange(index, 'marks', -1)}
                    >
                      -
                    </button>
                    <span className="counter-value">{config.marks}</span>
                    <button 
                      type="button" 
                      className="btn-counter"
                      onClick={() => handleCounterChange(index, 'marks', 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Control row for Adding Types and summarizing */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button 
            type="button" 
            className="btn-add-type"
            onClick={handleAddQuestionType}
          >
            <div className="btn-add-type-icon">
              <Plus size={16} />
            </div>
            <span>Add Question Type</span>
          </button>

          <div className="question-summary-block">
            <span className="summary-item">
              Total Questions : <span className="summary-item-bold">{totalQuestions}</span>
            </span>
            <span className="summary-item">
              Total Marks : <span className="summary-item-bold">{totalMarks}</span>
            </span>
          </div>
        </div>

        {/* Additional instructions text area */}
        <div className="form-group">
          <label className="form-label" htmlFor="additionalInstructions">
            Additional Information (For better output)
          </label>
          <div className="input-with-icon">
            <textarea 
              id="additionalInstructions"
              name="additionalInstructions"
              rows={4}
              placeholder="e.g Generate a question paper for 3 hour exam duration..."
              className="input-textarea"
              value={wizardData.additionalInstructions}
              onChange={handleTextChange}
            />
            <div className="mic-button-wrapper">
              <Mic size={16} />
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationError && (
          <div className="text-sm text-red-600 font-semibold text-center">{validationError}</div>
        )}

        {/* Actions Navigation Row */}
        <div className="wizard-actions">
          <button 
            type="button" 
            className="btn-nav-prev"
            onClick={() => setCurrentStep('dashboard')}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>

          <button 
            type="button" 
            className="btn-nav-next"
            onClick={handleNextSubmit}
            disabled={isLoading}
          >
            <span>Next</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Spinner Modal for AI Generation */}
      {isLoading && (
        <div className="loader-overlay">
          <div className="loader-container">
            <div className="spinner"></div>
            <h3 className="empty-title" style={{ margin: 0 }}>Creating Assessment</h3>
            <p className="empty-description" style={{ margin: 0 }}>
              Gemini AI is parsing details and compiling your exam paper. Please do not close this window.
            </p>
            <div className="loader-progress">
              {progressLog || 'Initializing queues...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
