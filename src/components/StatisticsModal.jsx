import React from 'react';
import './StatisticsModal.css';

const StatisticsModal = ({ tasks, columns, onClose, selectedAgent }) => {
  // Filter tasks based on selected agent
  const relevantTasks = Object.values(tasks).filter(task => {
    if (task.archived) return false;
    if (selectedAgent && task.agent !== selectedAgent) return false;
    return true;
  });

  // Calculate statistics
  const totalTasks = relevantTasks.length;
  const deployedTasks = columns?.['column-4']?.taskIds?.filter(id => {
    const task = tasks[id];
    if (!task || task.archived) return false;
    if (selectedAgent && task.agent !== selectedAgent) return false;
    return true;
  }).length || 0;
  
  const completionRate = totalTasks > 0 ? Math.round((deployedTasks / totalTasks) * 100) : 0;

  // Tasks by priority
  const priorityCounts = relevantTasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {});

  // Tasks by category (tags)
  const categoryCounts = relevantTasks.reduce((acc, task) => {
    if (task.tags && task.tags.length > 0) {
      task.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
    }
    return acc;
  }, {});

  // Tasks per agent
  const agentCounts = relevantTasks.reduce((acc, task) => {
    acc[task.agent] = (acc[task.agent] || 0) + 1;
    return acc;
  }, {});

  // Average time to completion (for deployed tasks)
  const deployedTasksWithTime = Object.values(tasks).filter(task => {
    if (!task.completedAt) return false;
    if (task.archived) return false;
    if (selectedAgent && task.agent !== selectedAgent) return false;
    return true;
  });

  let avgCompletionTime = 'N/A';
  if (deployedTasksWithTime.length > 0) {
    const totalDays = deployedTasksWithTime.reduce((acc, task) => {
      const created = new Date(task.id.split('-')[1] || Date.now());
      const completed = new Date(task.completedAt);
      const days = Math.round((completed - created) / (1000 * 60 * 60 * 24));
      return acc + days;
    }, 0);
    avgCompletionTime = `${Math.round(totalDays / deployedTasksWithTime.length)} days`;
  }

  // Tasks by column
  const columnCounts = {};
  Object.values(columns).forEach(column => {
    const count = column.taskIds.filter(id => {
      const task = tasks[id];
      if (!task || task.archived) return false;
      if (selectedAgent && task.agent !== selectedAgent) return false;
      return true;
    }).length;
    columnCounts[column.title] = count;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="statistics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 Statistics {selectedAgent && `- ${selectedAgent}`}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Completion Rate - Large highlight */}
          <div className="stat-card featured">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value-large">{completionRate}%</div>
              <div className="stat-label">Completion Rate</div>
              <div className="stat-progress">
                <div 
                  className="stat-progress-fill" 
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total Tasks */}
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
              <div className="stat-sublabel">(excluding archived)</div>
            </div>
          </div>

          {/* Average Completion Time */}
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{avgCompletionTime}</div>
              <div className="stat-label">Avg. Completion Time</div>
              <div className="stat-sublabel">(deployed tasks)</div>
            </div>
          </div>

          {/* Tasks by Column */}
          <div className="stat-card wide">
            <div className="stat-section-title">📍 Tasks by Status</div>
            <div className="stat-breakdown">
              {Object.entries(columnCounts).map(([column, count]) => (
                <div key={column} className="stat-item">
                  <span className="stat-item-label">{column}</span>
                  <span className="stat-item-value">{count}</span>
                  <div className="stat-item-bar">
                    <div 
                      className="stat-item-bar-fill" 
                      style={{ width: `${totalTasks > 0 ? (count / totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks by Priority */}
          <div className="stat-card wide">
            <div className="stat-section-title">🎯 Tasks by Priority</div>
            <div className="stat-breakdown">
              {Object.entries(priorityCounts).map(([priority, count]) => (
                <div key={priority} className="stat-item">
                  <span className={`stat-item-label priority-${priority.toLowerCase()}`}>
                    {priority}
                  </span>
                  <span className="stat-item-value">{count}</span>
                  <div className="stat-item-bar">
                    <div 
                      className={`stat-item-bar-fill priority-${priority.toLowerCase()}`}
                      style={{ width: `${totalTasks > 0 ? (count / totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks by Category */}
          {Object.keys(categoryCounts).length > 0 && (
            <div className="stat-card wide">
              <div className="stat-section-title">🏷️ Tasks by Category</div>
              <div className="stat-breakdown">
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <div key={category} className="stat-item">
                    <span className="stat-item-label">{category}</span>
                    <span className="stat-item-value">{count}</span>
                    <div className="stat-item-bar">
                      <div 
                        className="stat-item-bar-fill" 
                        style={{ width: `${totalTasks > 0 ? (count / totalTasks) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks per Agent (only show if no agent is selected) */}
          {!selectedAgent && (
            <div className="stat-card wide">
              <div className="stat-section-title">👥 Tasks per Agent</div>
              <div className="stat-breakdown">
                {Object.entries(agentCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([agent, count]) => (
                    <div key={agent} className="stat-item">
                      <span className="stat-item-label">{agent}</span>
                      <span className="stat-item-value">{count}</span>
                      <div className="stat-item-bar">
                        <div 
                          className="stat-item-bar-fill" 
                          style={{ width: `${totalTasks > 0 ? (count / totalTasks) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal;
