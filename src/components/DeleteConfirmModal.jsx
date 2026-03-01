import React from 'react';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ taskTitle, onConfirm, onCancel }) => {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="delete-confirm-modal glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete Task</h3>
          <button onClick={onCancel} className="close-button">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="warning-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="modal-description">
            Are you sure you want to delete <strong>"{taskTitle}"</strong>?
          </p>
          <p className="modal-warning">
            This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger">
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
