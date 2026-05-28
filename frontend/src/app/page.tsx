'use client';

import React from 'react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import MobileNav from '../components/MobileNav';
import Dashboard from '../components/Dashboard';
import AssignmentWizard from '../components/AssignmentWizard';
import PaperViewer from '../components/PaperViewer';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { Bell, ChevronDown, ArrowLeft, LayoutGrid, Sparkles } from 'lucide-react';

export default function Home() {
  const { currentStep, setCurrentStep, resetWizardData } = useAssignmentStore();

  const renderContent = () => {
    switch (currentStep) {
      case 'dashboard':
        return <Dashboard />;
      case 'create':
        return <AssignmentWizard />;
      case 'view':
        return <PaperViewer />;
      default:
        return <Dashboard />;
    }
  };

  const getBreadcrumbs = () => {
    switch (currentStep) {
      case 'dashboard':
        return (
          <span className="breadcrumb-path">
            <span className="breadcrumb-active">Assignment</span>
          </span>
        );
      case 'create':
        return (
          <span className="breadcrumb-path">
            Assignments / <span className="breadcrumb-active">Create Assignment</span>
          </span>
        );
      case 'view':
        return null;
      default:
        return (
          <span className="breadcrumb-path">
            <span className="breadcrumb-active">Assignment</span>
          </span>
        );
    }
  };

  const handleBackBreadcrumb = () => {
    if (currentStep !== 'dashboard') {
      setCurrentStep('dashboard');
    }
  };

  const handleCreateNew = () => {
    resetWizardData();
    setCurrentStep('create');
  };

  return (
    <div className="app-container">
      {/* Sidebar - Desktop Layout */}
      <Sidebar />

      {/* Main Column Wrapper */}
      <div className="main-wrapper">
        {/* Mobile top header bar */}
        <MobileHeader />

        {/* Desktop top header bar */}
        <header className="top-header">
          <div className="header-breadcrumbs">
            <button className="btn-header-back" onClick={handleBackBreadcrumb}>
              <ArrowLeft size={16} />
            </button>

            {currentStep === 'view' ? (
              <button className="header-create-new" onClick={handleCreateNew}>
                <Sparkles size={14} />
                <span>Create New</span>
              </button>
            ) : (
              <>
                <LayoutGrid size={18} className="text-gray-400" />
                {getBreadcrumbs()}
              </>
            )}
          </div>

          <div className="header-right">
            {/* Bell Notifications */}
            <button className="btn-bell">
              <Bell size={18} />
              <div className="bell-indicator"></div>
            </button>

            {/* Profile Dropdown */}
            <div className="profile-dropdown">
              <img 
                src="/profile.png" 
                alt="John Doe Avatar" 
                className="user-avatar"
              />
              <span className="user-name">John Doe</span>
              <ChevronDown size={14} className="text-gray-500" />
            </div>
          </div>
        </header>

        {/* Content Body viewport */}
        <main className="content-body">
          {renderContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}
