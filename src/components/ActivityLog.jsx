import React from 'react';
import './ActivityLog.css';

const ActivityLog = ({ activity }) => {
  return (
    <div className="activity-panel">
      <div className="activity-panel-header">
        <h3>Project Activity</h3>
      </div>
      <div className="activity-panel-content">
        {activity.length === 0 ? (
          <p className="empty-state">No activity yet</p>
        ) : (
          <div className="activity-list">
            {activity.map(({ id, action, details, timestamp }) => (
              <div key={id} className="activity-item">
                <div className="activity-action">{action}</div>
                <div className="activity-details">{details}</div>
                <div className="activity-timestamp">{timestamp}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
