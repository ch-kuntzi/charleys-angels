import React from 'react';
import {
  Brain, ShieldCheck, Search, Hammer, Mail, Wallet,
  Calendar, Compass, Code, CheckCircle, ExternalLink
} from 'lucide-react';
import './MobileDashboard.css';

const agentIconMap = {
  'Charley': Brain, 'JoAnne': ShieldCheck, 'Scout': Search,
  'Builder': Hammer, 'Ops': Mail, 'Finance': Wallet,
  'Planner': Calendar, 'Architect': Compass, 'Coder': Code, 'QA': CheckCircle,
};

const priorityColors = { High: '#EF4444', Medium: '#F59E0B', Low: '#10B981' };

const DEFAULT_CATEGORY_COLORS = {
  'Bug': '#EF4444', 'Feature': '#10B981', 'Research': '#A78BFA',
  'Admin': '#A78BFA', 'Urgent': '#F59E0B',
};

const getCategoryColor = (cat, custom = {}) => custom[cat] || DEFAULT_CATEGORY_COLORS[cat] || '#8B949E';

const formatTimestamp = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

const MobileTaskCard = ({ task, onClick, categoryColors = {} }) => {
  const AgentIcon = agentIconMap[task.agent];
  return (
    <div className="task-card" onClick={onClick}>
      <h4 className="task-title">{task.title}</h4>
      <p className="task-description">{task.description}</p>

      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map(tag => {
            const color = getCategoryColor(tag, categoryColors);
            return (
              <span key={tag} className="tag-pill" style={{ backgroundColor: `${color}26`, color }}>
                {tag}
              </span>
            );
          })}
        </div>
      )}

      {task.completedAt && (
        <div className="task-completed">
          <CheckCircle size={14} strokeWidth={2} />
          <span>Completed: {formatTimestamp(task.completedAt)}</span>
        </div>
      )}

      {task.reviewLink && (
        <div className="task-review-link">
          <a href={task.reviewLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
            <ExternalLink size={12} strokeWidth={2} />
            <span className="review-link-text">View Deliverable</span>
          </a>
        </div>
      )}

      <div className="task-footer">
        <div className="footer-left">
          <div className="agent-badge">
            {AgentIcon && <AgentIcon size={16} strokeWidth={1.5} />}
            <span>{task.agent}</span>
          </div>
          <div className="priority-tag" style={{ color: priorityColors[task.priority] }}>
            {task.priority}
          </div>
          {task.dueDate && (
            <div className="task-due-date">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MobileDashboard = ({ columns, tasks, onTaskClick, categoryColors = {} }) => {
  return (
    <div className="mobile-dashboard">
      {Object.values(columns).map(column => (
        <div key={column.id} className="mobile-column">
          <h2 className="mobile-column-title">
            {column.title}
            <span className="mobile-column-count">{column.taskIds.length}</span>
          </h2>
          <div className="mobile-task-list">
            {column.taskIds.map(taskId => {
              const task = tasks[taskId];
              if (!task) return null;
              return (
                <MobileTaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                  categoryColors={categoryColors}
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
