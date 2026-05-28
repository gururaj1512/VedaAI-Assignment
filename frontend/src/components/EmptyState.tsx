'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';

export default function EmptyState() {
  const { setCurrentStep, resetWizardData } = useAssignmentStore();

  const handleCreate = () => {
    resetWizardData();
    setCurrentStep('create');
  };

  return (
    <div className="empty-state-card">
      {/* SVG Illustration matching Figma */}
      <svg
        className="empty-illustration"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Background Circle */}
        <circle cx="100" cy="100" r="70" fill="#EBEBEB" opacity="0.6" />

        {/* Paper Document */}
        <rect x="70" y="50" width="60" height="84" rx="8" fill="white" filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.05))" />
        {/* Lines on paper */}
        <rect x="80" y="66" width="30" height="4" rx="2" fill="#2E2E2E" />
        <rect x="80" y="78" width="40" height="4" rx="2" fill="#D2D2D2" />
        <rect x="80" y="90" width="40" height="4" rx="2" fill="#D2D2D2" />
        <rect x="80" y="102" width="20" height="4" rx="2" fill="#D2D2D2" />

        {/* Floating Mini card */}
        <rect x="130" y="60" width="28" height="18" rx="4" fill="white" filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.05))" />
        <circle cx="138" cy="69" r="2.5" fill="#C5C5C5" />
        <rect x="144" y="67" width="10" height="4" rx="1" fill="#C5C5C5" />

        {/* Decorative Sparkles & Dots */}
        {/* Blue dot */}
        <circle cx="170" cy="110" r="3.5" fill="#4B779A" />
        {/* Swirl */}
        <path d="M50 82C40 85 30 75 35 68C40 60 55 70 48 95" stroke="#2E2E2E" strokeWidth="1.5" strokeLinecap="round" />
        {/* Sparkle star */}
        <path d="M60 130L62 135L67 137L62 139L60 144L58 139L53 137L58 135L60 130Z" fill="#4B779A" />

        {/* Magnifying Glass */}
        <circle cx="116" cy="100" r="28" fill="white" filter="drop-shadow(0px 4px 15px rgba(0,0,0,0.1))" />
        <circle cx="116" cy="100" r="24" stroke="#D2D2D2" strokeWidth="6" />
        {/* Handle */}
        <path d="M133 117L152 136" stroke="#D2D2D2" strokeWidth="7" strokeLinecap="round" />
        {/* Handle dark tip */}
        <path d="M142 126L152 136" stroke="#C5C5C5" strokeWidth="7" strokeLinecap="round" />

        {/* Big Red Cross in lens focus */}
        <path d="M107 91L125 109" stroke="#FF3B30" strokeWidth="5" strokeLinecap="round" />
        <path d="M125 91L107 109" stroke="#FF3B30" strokeWidth="5" strokeLinecap="round" />
      </svg>

      {/* Text Elements */}
      <h2 className="empty-title">No assignments yet</h2>
      <p className="empty-description">
        Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>

      {/* Action Button */}
      <button className="btn-primary" onClick={handleCreate}>
        <Plus size={16} />
        <span>Create Your First Assignment</span>
      </button>
    </div>
  );
}
