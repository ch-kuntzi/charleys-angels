import React, { useState, useRef, useEffect } from 'react';
import {
  Brain, ShieldCheck, Search, Hammer, Mail, Wallet,
  Calendar, Compass, Code, CheckCircle, ExternalLink,
  LayoutGrid, CalendarDays, Activity, Plus, Settings, X, ChevronLeft
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

/* ─── Mobile Task Card ─── */
const MobileTaskCard = ({ task, onClick, categoryColors = {} }) => {
  const AgentIcon = agentIconMap[task.agent];
  return (
    <div className="m-task-card" onClick={onClick}>
      <h4 className="m-task-title">{task.title}</h4>
      {task.description && <p className="m-task-desc">{task.description}</p>}

      {task.tags && task.tags.length > 0 && (
        <div className="m-task-tags">
          {task.tags.map(tag => {
            const color = getCategoryColor(tag, categoryColors);
            return (
              <span key={tag} className="m-tag" style={{ backgroundColor: `${color}22`, color }}>{tag}</span>
            );
          })}
        </div>
      )}

      {task.reviewLink && (
        <a href={task.reviewLink} target="_blank" rel="noopener noreferrer"
          className="m-deliverable-link" onClick={e => e.stopPropagation()}>
          <ExternalLink size={12} /> View Deliverable
        </a>
      )}

      <div className="m-task-meta">
        <div className="m-agent">
          {AgentIcon && <AgentIcon size={14} strokeWidth={1.5} />}
          <span>{task.agent}</span>
        </div>
        <span className="m-priority" style={{ color: priorityColors[task.priority] }}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="m-due">Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        )}
      </div>
    </div>
  );
};

/* ─── Board View (horizontal column tabs) ─── */
const MobileBoardView = ({ columns, columnOrder, tasks, onTaskClick, categoryColors }) => {
  const [activeCol, setActiveCol] = useState(0);
  const cols = columnOrder.map(id => columns[id]).filter(Boolean);
  const col = cols[activeCol];

  return (
    <div className="m-board">
      <div className="m-col-tabs">
        {cols.map((c, i) => (
          <button
            key={c.id}
            className={`m-col-tab ${i === activeCol ? 'active' : ''}`}
            onClick={() => setActiveCol(i)}
          >
            {c.title}
            <span className="m-tab-count">{c.taskIds.length}</span>
          </button>
        ))}
      </div>

      <div className="m-col-cards">
        {col && col.taskIds.length > 0 ? (
          col.taskIds.map(taskId => {
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
          })
        ) : (
          <div className="m-empty-col">No tasks in {col?.title || 'this column'}</div>
        )}
      </div>
    </div>
  );
};

/* ─── Calendar View (simple month grid) ─── */
const MobileCalendarView = ({ tasks }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const tasksByDate = {};
  Object.values(tasks).forEach(t => {
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!tasksByDate[day]) tasksByDate[day] = [];
        tasksByDate[day].push(t);
      }
    }
  });

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="m-calendar">
      <h3 className="m-cal-month">{monthName}</h3>
      <div className="m-cal-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="m-cal-day-name">{d}</div>
        ))}
      </div>
      <div className="m-cal-grid">
        {days.map((day, i) => (
          <div key={i} className={`m-cal-cell ${day === now.getDate() ? 'today' : ''} ${day ? '' : 'empty'}`}>
            {day && (
              <>
                <span className="m-cal-num">{day}</span>
                {tasksByDate[day] && (
                  <div className="m-cal-dots">
                    {tasksByDate[day].slice(0, 3).map((t, j) => (
                      <div key={j} className="m-cal-dot" title={t.title}
                        style={{ backgroundColor: priorityColors[t.priority] || '#8B949E' }} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Activity Panel (slide-over from right) ─── */
const MobileActivityPanel = ({ activities, onClose }) => {
  const panelRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    if (diff > 0 && panelRef.current) {
      panelRef.current.style.transform = `translateX(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentX.current - startX.current;
    if (diff > 100) {
      onClose();
    } else if (panelRef.current) {
      panelRef.current.style.transform = 'translateX(0)';
    }
    startX.current = 0;
    currentX.current = 0;
  };

  return (
    <>
      <div className="m-overlay" onClick={onClose} />
      <div
        className="m-activity-panel"
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="m-activity-header">
          <h3>Activity</h3>
          <button className="m-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="m-swipe-hint">Swipe right to close</div>
        <div className="m-activity-list">
          {activities && activities.length > 0 ? (
            activities.slice().reverse().map((a, i) => (
              <div key={i} className="m-activity-item">
                <div className="m-activity-text">{a.details || a.description || a.action}</div>
                <div className="m-activity-time">{a.timestamp}</div>
              </div>
            ))
          ) : (
            <div className="m-empty-col">No recent activity</div>
          )}
        </div>
      </div>
    </>
  );
};

/* ─── Main Mobile Dashboard ─── */
const MobileDashboard = ({
  columns, columnOrder = [], tasks, onTaskClick, categoryColors = {},
  activities = [], onAddTask, onSettingsClick
}) => {
  const [activeTab, setActiveTab] = useState('board');
  const [showActivity, setShowActivity] = useState(false);

  return (
    <div className="m-dashboard">
      {/* Top bar */}
      <div className="m-topbar">
        <h1 className="m-topbar-title">Task Dashboard</h1>
        <div className="m-topbar-actions">
          <button className="m-icon-btn" onClick={onSettingsClick}><Settings size={18} /></button>
          <button className="m-add-btn" onClick={onAddTask}><Plus size={16} /> Add</button>
        </div>
      </div>

      {/* Content */}
      <div className="m-content">
        {activeTab === 'board' && (
          <MobileBoardView
            columns={columns}
            columnOrder={columnOrder}
            tasks={tasks}
            onTaskClick={onTaskClick}
            categoryColors={categoryColors}
          />
        )}
        {activeTab === 'calendar' && (
          <MobileCalendarView tasks={tasks} />
        )}
      </div>

      {/* Activity slide-over */}
      {showActivity && (
        <MobileActivityPanel
          activities={activities}
          onClose={() => setShowActivity(false)}
        />
      )}

      {/* Bottom tab bar */}
      <div className="m-bottom-bar">
        <button
          className={`m-bottom-tab ${activeTab === 'board' ? 'active' : ''}`}
          onClick={() => { setActiveTab('board'); setShowActivity(false); }}
        >
          <LayoutGrid size={20} />
          <span>Board</span>
        </button>
        <button
          className={`m-bottom-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => { setActiveTab('calendar'); setShowActivity(false); }}
        >
          <CalendarDays size={20} />
          <span>Calendar</span>
        </button>
        <button
          className={`m-bottom-tab ${showActivity ? 'active' : ''}`}
          onClick={() => setShowActivity(!showActivity)}
        >
          <Activity size={20} />
          <span>Activity</span>
        </button>
      </div>
    </div>
  );
};

export default MobileDashboard;
