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
  CheckCircle,
  ChevronLeft,
  ChevronRight
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

const Sidebar = ({ agents, tasks, columns, selectedAgent, onAgentClick, collapsed, onToggleCollapse }) => {
  const activeColumns = ['column-1', 'column-2', 'column-3'];

  const tasksPerAgent = Object.values(tasks).reduce((acc, task) => {
    if (task.archived) return acc;
    const isInActiveColumn = activeColumns.some(colId =>
      columns[colId]?.taskIds?.includes(task.id)
    );
    if (isInActiveColumn) {
      acc[task.agent] = (acc[task.agent] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h2>Agents</h2>}
        <button className="sidebar-toggle" onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
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
              title={collapsed ? `${name}${tasksPerAgent[name] ? ` (${tasksPerAgent[name]})` : ''}` : ''}
            >
              <div className="agent-info">
                {IconComponent && <IconComponent size={16} strokeWidth={1.5} />}
                {!collapsed && <span className="agent-name">{name}</span>}
              </div>
              {!collapsed && tasksPerAgent[name] > 0 && (
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
