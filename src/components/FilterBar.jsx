import React, { useState, useRef, useEffect } from 'react';
import './FilterBar.css';

const categories = ['Bug', 'Feature', 'Research', 'Admin', 'Urgent'];

const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="custom-select" ref={ref}>
      <button
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${value ? 'has-value' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div className="custom-select-menu">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
              {value === opt.value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterBar = ({ filters, onFilterChange, onSearch, searchTerm, showArchived, onToggleArchived }) => {
  const activeFilterCount = [
    filters.priority,
    filters.tag
  ].filter(f => f !== '').length;

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat })),
  ];

  return (
    <div className="filter-bar">
      <div className="search-container">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button onClick={() => onSearch('')} className="clear-search">
            &times;
          </button>
        )}
      </div>

      <div className="filters">
        <CustomSelect
          value={filters.priority}
          onChange={(val) => onFilterChange('priority', val)}
          options={priorityOptions}
          placeholder="All Priorities"
        />

        <CustomSelect
          value={filters.tag}
          onChange={(val) => onFilterChange('tag', val)}
          options={categoryOptions}
          placeholder="All Categories"
        />

        <button
          className={`archive-toggle ${showArchived ? 'active' : ''}`}
          onClick={onToggleArchived}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 8v13H3V8" />
            <path d="M1 3h22v5H1z" />
            <path d="M10 12h4" />
          </svg>
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </button>

        {activeFilterCount > 0 && (
          <div className="filter-count">
            {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
