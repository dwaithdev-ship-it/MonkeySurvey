import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, responseCount }) => {
  console.log("SuccessModal Visibility:", isOpen);
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content success-animation">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2>Survey Submitted!</h2>
        <p>Your response has been successfully recorded.</p>
        <div className="stats-badge">
          <span>Total Responses: </span>
          <strong>{responseCount}</strong>
        </div>
        <button className="btn-modal-close" onClick={onClose}>
          Continue to Next Survey
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
