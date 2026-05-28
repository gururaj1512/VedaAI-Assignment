'use client';

import React, { useState } from 'react';
import { ArrowLeft, Download, RefreshCw, FileText } from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { useWebSocket } from '../hooks/useWebSocket';

const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default function PaperViewer() {
  const {
    selectedAssignment,
    setCurrentStep,
    regenerateAssignment,
    isLoading,
    progressLog
  } = useAssignmentStore();

  const [downloadDropdown, setDownloadDropdown] = useState(false);

  // Subscribe to websocket events while this assignment is generating/updating
  useWebSocket(selectedAssignment?._id);

  if (!selectedAssignment) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg shadow">
        <p className="text-gray-500 font-semibold">No assignment selected</p>
        <button className="btn-primary mt-4" onClick={() => setCurrentStep('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleRegenerate = () => {
    if (confirm('Are you sure you want to regenerate this question paper? This will overwrite the current questions.')) {
      regenerateAssignment(selectedAssignment._id);
    }
  };

  const handleDownload = (role: 'student' | 'teacher') => {
    setDownloadDropdown(false);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    window.open(`${apiBaseUrl}/api/assignments/${selectedAssignment._id}/download?role=${role}`, '_blank');
  };

  const totalMarks = selectedAssignment.questionConfigs.reduce((sum, c) => sum + (c.count * c.marks), 0);

  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('teacher');

  return (
    <div className="flex flex-col gap-6 w-full items-center">

      {/* AI Assistant response card with Download button */}
      {selectedAssignment.status === 'completed' && (
        <div className="ai-response-card">
          <p className="ai-response-text">
            Certainly, Lakshya! Here are customized Question Paper for your CBSE Grade {selectedAssignment.grade.replace(/\D/g, '') || '8'} {selectedAssignment.subject} classes on the NCERT chapters:
          </p>

          {/* Download Actions */}
          <div className="relative" style={{ alignSelf: 'flex-start' }}>
            <button
              className="ai-download-btn"
              onClick={() => setDownloadDropdown(!downloadDropdown)}
            >
              <Download size={14} />
              <span>Download as PDF</span>
            </button>

            {downloadDropdown && (
              <div
                className="absolute left-0 top-12 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-56 z-50 flex flex-col"
                onMouseLeave={() => setDownloadDropdown(false)}
              >
                <button
                  className="px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer font-bold transition-colors"
                  onClick={() => handleDownload('student')}
                >
                  <FileText size={16} className="text-gray-400" />
                  <span>Question Paper Only</span>
                </button>
                <button
                  className="px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer font-bold transition-colors border-t border-gray-50"
                  onClick={() => handleDownload('teacher')}
                >
                  <FileText size={16} className="text-orange-500" />
                  <span>With Answer Key</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live progress header */}
      {selectedAssignment.status !== 'completed' && (
        <div className="action-top-bar">
          <span className="ai-status-text">
            Status: {selectedAssignment.status === 'generating' ? '⚡ Generating questions...' : '⌛ Pending in queue...'}
          </span>
          <span className="text-xs opacity-85">
            {progressLog || 'Waiting for background queue...'}
          </span>
        </div>
      )}

      {/* Question Paper Sheet Container */}
      <div className="paper-sheet">
        {/* School name & subject header */}
        <div className="paper-header">
          <h1 className="paper-school">{selectedAssignment.schoolName}</h1>
          <div className="paper-subject-line">
            Subject: {selectedAssignment.subject}
          </div>
          <div className="paper-subject-line">
            Class: {selectedAssignment.grade}
          </div>

          <div className="paper-meta-row">
            <span>Time Allowed: 45 minutes</span>
            <span>Maximum Marks: {totalMarks}</span>
          </div>
        </div>

        {/* General Instructions Block */}
        <div className="paper-instructions-box">
          <p className="paper-instructions-text font-bold" style={{ color: '#1A1A1A', fontStyle: 'normal', fontSize: '13px' }}>
            All questions are compulsory unless stated otherwise.
          </p>
        </div>

        {/* Student details blank fields */}
        <div className="paper-student-fields">
          <div>
            <span>Name: ______________________</span>
          </div>
          <div>
            <span>Roll Number: _______________</span>
          </div>
          <div>
            <span>Class: {selectedAssignment.grade} Section: _________</span>
          </div>
        </div>

        {/* Loading skeleton or empty paper state */}
        {selectedAssignment.status !== 'completed' && (
          <div className="flex flex-col gap-6 items-center justify-center py-20 text-gray-400">
            <div className="spinner"></div>
            <p className="text-sm font-semibold">Generating Question Paper content via Gemini AI...</p>
          </div>
        )}

        {/* Sections and Questions */}
        {selectedAssignment.status === 'completed' && selectedAssignment.generatedPaper && (
          <>
            {selectedAssignment.generatedPaper.sections.map((section, sIndex) => {
              // Calculate global question indexing starting from 1
              let precedingQuestions = 0;
              for (let i = 0; i < sIndex; i++) {
                precedingQuestions += selectedAssignment.generatedPaper!.sections[i].questions.length;
              }

              return (
                <div key={sIndex} className="paper-section-container">
                  {/* Section Title (Centered) */}
                  <div className="paper-section-heading">
                    <h3 className="paper-section-name">{section.name}</h3>
                  </div>

                  {/* Section Instruction (Left Aligned) */}
                  <div className="paper-section-meta">
                    <span className="paper-section-instruction">{section.instruction}</span>
                  </div>

                  {/* Questions List */}
                  <div className="paper-questions-list">
                    {section.questions.map((q, qIndex) => {
                      const num = precedingQuestions + qIndex + 1;
                      return (
                        <div key={q.id} className="paper-question-item">
                          <div className="paper-question-text">
                            <span>{num}.&nbsp;&nbsp;</span>
                            <span className="paper-difficulty-tag">[{q.difficulty}]</span>
                            <span>&nbsp;</span>
                            <span>{renderFormattedText(q.text)}</span>
                            <span className="paper-marks-tag">&nbsp;[{q.marks} Marks]</span>
                          </div>

                          {/* MCQ Options */}
                          {q.options && q.options.length > 0 && (
                            <div className="mcq-options-grid">
                              <span>(A) {q.options[0]}</span>
                              <span>(B) {q.options[1]}</span>
                              <span>(C) {q.options[2]}</span>
                              <span>(D) {q.options[3]}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* End of paper footer */}
            <div className="paper-end-footer">
              End of Question Paper
            </div>

            {/* Answer Key display - always shown (teacher view by default) */}
            {viewMode === 'teacher' && (
              <>
                <div className="answer-key-divider">Answer Key:</div>
                <div className="paper-answer-list">
                  {selectedAssignment.generatedPaper.answerKey.map((ans, index) => {
                    // Find matching question body
                    let qText = '';
                    for (const sec of selectedAssignment.generatedPaper!.sections) {
                      const q = sec.questions.find(item => item.id === ans.questionId);
                      if (q) {
                        qText = q.text;
                        break;
                      }
                    }

                    return (
                      <div key={ans.questionId} className="paper-answer-item">
                        <div className="paper-answer-question">
                          <span>{index + 1}.&nbsp;&nbsp;</span>
                          <span>{renderFormattedText(qText)}</span>
                        </div>
                        <div className="paper-answer-body">
                          <p>{renderFormattedText(ans.answer)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Regeneration Modal Loader */}
      {isLoading && selectedAssignment.status !== 'completed' && (
        <div className="loader-overlay">
          <div className="loader-container">
            <div className="spinner"></div>
            <h3 className="empty-title" style={{ margin: 0 }}>Regenerating Assessment</h3>
            <p className="empty-description" style={{ margin: 0 }}>
              Gemini AI is re-formulating questions based on your config. Please hold on.
            </p>
            <div className="loader-progress">
              {progressLog || 'Queueing worker task...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
