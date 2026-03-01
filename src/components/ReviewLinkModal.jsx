import React, { useState } from 'react';
import './ReviewLinkModal.css';

const ReviewLinkModal = ({ onSubmit, onCancel }) => {
  const [reviewLink, setReviewLink] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    if (!reviewLink.trim()) {
      setError('Review link is required');
      return;
    }
    
    if (!validateUrl(reviewLink)) {
      setError('Please enter a valid URL');
      return;
    }

    onSubmit(reviewLink);
  };

  const handleSkip = () => {
    onSubmit('');
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="review-link-modal glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Review Link</h3>
          <button onClick={onCancel} className="close-button">&times;</button>
        </div>
        
        <div className="modal-body">
          <p className="modal-description">
            This task is moving to the Review column. Add a review link to track the review process.
          </p>
          <div className="form-group">
            <label>Review Link</label>
            <input 
              type="url" 
              value={reviewLink} 
              onChange={(e) => {
                setReviewLink(e.target.value);
                setError('');
              }}
              placeholder="https://example.com/review"
              className={`input-field ${error ? 'invalid' : ''}`}
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {error && <span className="field-error">{error}</span>}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleSkip} className="btn-secondary">
            Skip
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            Add Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewLinkModal;
