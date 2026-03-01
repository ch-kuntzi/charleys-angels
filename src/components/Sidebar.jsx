import React from 'react';
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
  CheckCircle 
} from 'lucide-react';
import './Sidebar.css';

const iconMap = {
  'brain': Brain,
  'shield-check': ShieldCheck,
  'search': Search,
  'hammer': Hammer,
  'mail': Mail,
  'wallet': Wallet,
  'calendar': Calendar,
  'compass': Compass,
  'code': Code,
  'check-circle': CheckCircle,
};

const Sidebar = ({ agents, tasks, columns, selectedAgent, onAgentClick }) => {
  // Count only active tasks (In Queue, In Progress, Review - NOT Deployed or Archived)
  const activeColumns = ['column-1', 'column-2', 'column-3']; // In Queue, In Progress, Review
  
  const tasksPerAgent = Object.values(tasks).reduce((acc, task) => {
    if (task.archived) return acc; // Skip archived tasks
    
    // Check if task is in an active column (not Deployed)
    const isInActiveColumn = activeColumns.some(colId => 
      columns[colId]?.taskIds?.includes(task.id)
    );
    
    if (isInActiveColumn) {
      acc[task.agent] = (acc[task.agent] || 0) + 1;
    }
    
    return acc;
  }, {});

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Agents</h2>
      </div>
      <ul className="agent-list">
        {agents.map(({ name, icon }) => {
          const IconComponent = iconMap[icon];
          const isSelected = Array.isArray(selectedAgent) 
            ? selectedAgent.includes(name) 
            : selectedAgent === name;
          return (
            <li 
              className={`agent-item ${isSelected ? 'selected' : ''}`}
              key={name}
              onClick={() => onAgentClick(name)}
            >
              <div className="agent-info">
                {IconComponent && <IconComponent size={16} strokeWidth={1.5} />}
                <span className="agent-name">{name}</span>
              </div>
              {tasksPerAgent[name] > 0 && (
                <span className="agent-task-count">{tasksPerAgent[name]}</span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;
