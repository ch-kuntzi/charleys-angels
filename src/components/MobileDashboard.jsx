import React from 'react';
import './MobileDashboard.css';
import TaskCard from './TaskCard';

const MobileDashboard = ({ columns, tasks, onTaskClick }) => {
  return (
    <div className="mobile-dashboard">
      {Object.values(columns).map(column => (
        <div key={column.id} className="mobile-column">
          <h2 className="mobile-column-title">{column.title}</h2>
          <div className="mobile-task-list">
            {column.taskIds.map(taskId => {
              const task = tasks[taskId];
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileDashboard;
