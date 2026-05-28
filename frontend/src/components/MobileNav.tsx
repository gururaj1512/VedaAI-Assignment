'use client';

import React from 'react';
import { Home, Users, Library, Sparkles } from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';

export default function MobileNav() {
  const { currentStep, setCurrentStep } = useAssignmentStore();

  return (
    <nav className="mobile-nav-bottom">
      <div 
        className={`mobile-nav-item ${currentStep === 'dashboard' ? 'active' : ''}`}
        onClick={() => setCurrentStep('dashboard')}
      >
        <Home size={20} />
        <span>Home</span>
      </div>

      <div 
        className={`mobile-nav-item ${currentStep === 'create' ? 'active' : ''}`}
        onClick={() => setCurrentStep('create')}
      >
        <Users size={20} />
        <span>My Groups</span>
      </div>

      <div className="mobile-nav-item">
        <Library size={20} />
        <span>Library</span>
      </div>

      <div className="mobile-nav-item">
        <Sparkles size={20} />
        <span>AI Toolkit</span>
      </div>
    </nav>
  );
}
