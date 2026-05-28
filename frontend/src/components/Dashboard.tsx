'use client';

import React, { useEffect, useState } from 'react';
import { MoreVertical, Search, Plus, Eye, Trash2, Filter } from 'lucide-react';
import { useAssignmentStore, IAssignment } from '../store/useAssignmentStore';
import EmptyState from './EmptyState';

export default function Dashboard() {
  const { 
    assignments, 
    fetchAssignments, 
    setCurrentStep, 
    setSelectedAssignment, 
    deleteAssignment,
    resetWizardData,
    isLoading 
  } = useAssignmentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Fetch assignments on mount
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleCardClick = (assignment: IAssignment) => {
    setSelectedAssignment(assignment);
    setCurrentStep('view');
  };

  const handleCreate = () => {
    resetWizardData();
    setCurrentStep('create');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this assignment?')) {
      deleteAssignment(id);
      setActiveDropdown(null);
    }
  };

  const handleToggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  // Filter local assignments
  const filteredAssignments = assignments.filter((a) => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoading && assignments.length === 0) {
    return <EmptyState />;
  }

  // Format dates as DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full md:h-full relative md:overflow-hidden">
      {/* Dashboard Heading Section */}
      <div className="dashboard-heading">
        <div className="dashboard-heading-left">
          <div className="wizard-indicator-dot"></div>
          <div>
            <h2 className="dashboard-title">Assignments</h2>
            <p className="dashboard-subtitle">
              Manage and create assignments for your classes.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="dashboard-toolbar">
        <div className="dashboard-filter-btn">
          <Filter size={16} />
          <span>Filter By</span>
        </div>
        
        <div className="dashboard-search-wrapper">
          <Search size={16} className="dashboard-search-icon" />
          <input 
            type="text"
            placeholder="Search Assignment"
            className="dashboard-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoading && assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="spinner"></div>
          <p className="text-sm mt-4">Loading your assignments...</p>
        </div>
      )}

      {/* Assignments Card Grid */}
      <div className="assignment-grid">
        {filteredAssignments.map((assignment) => (
          <div 
            key={assignment._id}
            className="assignment-card"
            onClick={() => handleCardClick(assignment)}
          >
            {/* Top row with Title and dropdown */}
            <div className="assignment-card-top">
              <h3 className="assignment-card-title">
                {assignment.title}
              </h3>

              {/* Options dropdown button */}
              <div className="relative">
                <button 
                  className="assignment-card-menu"
                  onClick={(e) => handleToggleDropdown(assignment._id, e)}
                >
                  <MoreVertical size={18} />
                </button>

                {activeDropdown === assignment._id && (
                  <div 
                    className="assignment-dropdown"
                    onMouseLeave={() => setActiveDropdown(null)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      className="assignment-dropdown-item"
                      onClick={() => handleCardClick(assignment)}
                    >
                      View Assignment
                    </button>
                    <button 
                      className="assignment-dropdown-item delete"
                      onClick={(e) => handleDelete(assignment._id, e)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom meta row */}
            <div className="assignment-card-bottom">
              <span className="assignment-card-date">
                Assigned on : <span className="date-value">{formatDate(assignment.createdAt)}</span>
              </span>
              <span className="assignment-card-date">
                Due : <span className="date-value">{formatDate(assignment.dueDate)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Fade & Floating Action Button for Desktop screens */}
      <div className="dashboard-bottom-blur-container hidden md:block">
        <div className="dashboard-bottom-blur-overlay"></div>
        <div className="fab-container">
          <button 
            className="fab-btn" 
            onClick={handleCreate}
          >
            <Plus size={16} />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {/* Floating Action Button (FAB) for Mobile screens */}
      <button className="mobile-fab flex md:hidden" onClick={handleCreate}>
        <Plus size={24} />
      </button>
    </div>
  );
}
