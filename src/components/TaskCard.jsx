import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import {
  Brain,
  ShieldCheck,
  Search,
  Hammer,
  Mail,
  Wallet,
  Calendar,
  Compass,
  Code,
  CheckCircle,
  ExternalLink,

} from 'lucide-react';
import './TaskCard.css';

const agentIconMap = {
  'Charley': Brain,
  'JoAnne': ShieldCheck,
  'Scout': Search,
  'Builder': Hammer,
  'Ops': Mail,
  'Finance': Wallet,
  'Planner': Calendar,
  'Architect': Compass,
  'Coder': Code,
  'QA': CheckCircle,
};

const priorityColors = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#10B981',
};

const getCategoryColor = (category) => {
  const colorMap = {
    'Bug': '#EF4444',
    'Feature': '#10B981',
    'Research': '#A78BFA',
    'Admin': '#A78BFA',
    'Urgent': '#F59E0B',
  };
  return colorMap[category] || '#8B949E';
};

const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleString('en-US', options);
};

const isDateInFuture = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
};

const TaskCard = ({ task, index, onClick, columnTitle }) => {
  const recentComments = (task.comments || []).slice(-2);
  const hasMoreComments = (task.comments || []).length > 2;
  const AgentIcon = agentIconMap[task.agent];

  const isInReviewOrDeployed = columnTitle === 'Review' || columnTitle === 'Deployed';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
        >
          <h4 className="task-title">{task.title}</h4>
          <p className="task-description">{task.description}</p>

          {task.tags && task.tags.length > 0 && (
            <div className="task-tags">
              {task.tags.map((tag) => {
                const color = getCategoryColor(tag);
                return (
                  <span
                    key={tag}
                    className="tag-pill"
                    style={{
                      backgroundColor: `${color}26`,
                      color: color
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}



          {/* Completion Timestamp for Deployed Tasks */}
          {task.completedAt && (
            <div className="task-completed">
              <CheckCircle size={14} strokeWidth={2} />
              <span>Completed: {formatTimestamp(task.completedAt)}</span>
            </div>
          )}

          {/* Deliverable Link */}
          {task.reviewLink && (
            <div className="task-review-link">
              <a
                href={task.reviewLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
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
              <div
                className="priority-tag"
                style={{ color: priorityColors[task.priority] }}
              >
                {task.priority}
              </div>
              {task.dueDate && (
                <div className="task-due-date">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                  {task.dueTime && <span className="task-time"> {task.dueTime}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
