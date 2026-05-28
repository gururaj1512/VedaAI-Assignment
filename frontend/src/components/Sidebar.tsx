'use client';

import React from 'react';
import { Home, Users, FileText, Briefcase, Library, Settings, Sparkles } from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';

export default function Sidebar() {
  const { currentStep, setCurrentStep, resetWizardData, assignments } = useAssignmentStore();

  const handleCreateClick = () => {
    resetWizardData();
    setCurrentStep('create');
  };

  const handleNavClick = (step: 'dashboard') => {
    setCurrentStep(step);
  };

  const assignmentCount = assignments.length > 0 ? assignments.length : 10;

  return (
    <aside className="sidebar">
      <div>
        {/* Logo */}
        <div className="logo-section">
          <img src="/logo.png" alt="VedaAI Logo" style={{ height: '36px', objectFit: 'contain' }} />
        </div>

        {/* Create Assignment Button */}
        <button className="btn-create-assignment" onClick={handleCreateClick}>
          <Sparkles size={16} fill="white" />
          <span>Create Assignment</span>
        </button>

        {/* Navigation List */}
        <nav>
          <ul className="nav-list">
            <li 
              className={`nav-item ${currentStep === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              <div className="nav-item-left">
                <Home size={18} />
                <span>Home</span>
              </div>
            </li>

            <li className="nav-item">
              <div className="nav-item-left">
                <Users size={18} />
                <span>My Groups</span>
              </div>
            </li>

            <li 
              className={`nav-item ${['create', 'view'].includes(currentStep) ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              <div className="nav-item-left">
                <FileText size={18} />
                <span>Assignments</span>
              </div>
              <span className="nav-badge">{assignmentCount}</span>
            </li>

            <li className="nav-item">
              <div className="nav-item-left">
                <Briefcase size={18} />
                <span>AI Teacher's Toolkit</span>
              </div>
            </li>

            <li className="nav-item">
              <div className="nav-item-left">
                <Library size={18} />
                <span>My Library</span>
              </div>
              <span className="nav-badge">32</span>
            </li>
          </ul>
        </nav>
      </div>

      {/* Bottom Profile and Settings */}
      <div className="sidebar-bottom">
        <div className="settings-item">
          <Settings size={18} />
          <span>Settings</span>
        </div>

        <div className="school-profile-card">
          <img 
            src="/profile.png" 
            alt="Delhi Public School Avatar" 
            className="school-avatar" 
          />
          <div className="school-info">
            <span className="school-name">Delhi Public School</span>
            <span className="school-location">Bokaro Steel City</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
