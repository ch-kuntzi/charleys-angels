import React from 'react';
import { Settings } from 'lucide-react';
import './Header.css';

const Header = ({ onAddTaskClick, isSaving, activeViews = [], onViewToggle, onSettingsClick }) => {
  return (
    <header className="header">
      <div className="header-row">
        <h1 className="header-title">Charley's Angels Task Dashboard</h1>
        <div className="view-toggle">
          <button
            className={activeViews.includes('board') ? 'active' : ''}
            onClick={() => onViewToggle('board')}
            title="Board View"
          >
            Board
          </button>
          <button
            className={activeViews.includes('calendar') ? 'active' : ''}
            onClick={() => onViewToggle('calendar')}
            title="Calendar View"
          >
            Calendar
          </button>
          <button
            className={activeViews.includes('activity') ? 'active' : ''}
            onClick={() => onViewToggle('activity')}
            title="Project Activity"
          >
            Project Activity
          </button>
        </div>
        <div className="header-actions">
          <button className="settings-btn" onClick={onSettingsClick} title="Settings">
            <Settings size={18} />
          </button>
          <button className="add-task-btn btn-primary" onClick={onAddTaskClick}>
            + Add Task
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
