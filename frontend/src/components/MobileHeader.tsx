'use client';

import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';

export default function MobileHeader() {
  const { setCurrentStep } = useAssignmentStore();

  return (
    <header className="mobile-top-header">
      {/* Mobile Logo */}
      <div className="mobile-logo-group" onClick={() => setCurrentStep('dashboard')}>
        <img src="/logo.png" alt="VedaAI Logo" style={{ height: '28px', objectFit: 'contain' }} />
      </div>

      {/* Header Actions */}
      <div className="mobile-header-right">
        {/* Notification Bell */}
        <button className="btn-bell" style={{ width: '32px', height: '32px' }}>
          <Bell size={16} />
          <div className="bell-indicator" style={{ top: '6px', right: '6px' }}></div>
        </button>

        {/* Profile Avatar */}
        <img 
          src="/profile.png" 
          alt="User Profile" 
          className="user-avatar"
        />

        {/* Hamburger Menu Toggle */}
        <button className="btn-hamburger">
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}
