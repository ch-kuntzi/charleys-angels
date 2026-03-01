import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import './CalendarView.css';

const CalendarView = ({ tasks, onTaskClick, onAddTaskWithDate, onUpdateTaskDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showHeartbeatReminders, setShowHeartbeatReminders] = useState(false);
  const [dragOverDay, setDragOverDay] = useState(null);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek, year, month };
  };

  const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth();
  const today = new Date().getDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const getDateString = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getTasksForDate = (day) => {
    const dateString = getDateString(day);
    return tasks.filter(task => task.dueDate === dateString);
  };

  const isOverdue = (day) => {
    if (year < currentYear) return true;
    if (year === currentYear && month < currentMonth) return true;
    if (year === currentYear && month === currentMonth && day < today) return true;
    return false;
  };

  const hasHeartbeatReminder = (day) => {
    if (!showHeartbeatReminders) return false;
    const tasksForDay = getTasksForDate(day);
    return tasksForDay.some(t => t.priority === 'High') || tasksForDay.length > 2;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day) => {
    const dateString = getDateString(day);
    if (onAddTaskWithDate) {
      onAddTaskWithDate(dateString);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, day) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = (e, day) => {
    e.preventDefault();
    setDragOverDay(null);
    const taskId = e.dataTransfer.getData('taskId');
    const newDate = getDateString(day);
    if (onUpdateTaskDate && taskId) {
      onUpdateTaskDate(taskId, newDate);
    }
  };

  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const tasksForDay = getTasksForDate(day);
    const isToday = day === today && month === currentMonth && year === currentYear;
    const overdue = isOverdue(day) && tasksForDay.length > 0;
    const hasHeartbeat = hasHeartbeatReminder(day);
    const isDragTarget = dragOverDay === day;

    days.push(
      <div
        key={day}
        className={`calendar-day ${isToday ? 'today' : ''} ${overdue ? 'overdue' : ''} ${hasHeartbeat ? 'heartbeat-reminder' : ''} ${isDragTarget ? 'drag-over' : ''}`}
        onClick={() => handleDayClick(day)}
        onDragOver={(e) => handleDragOver(e, day)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, day)}
      >
        <div className="day-number">
          {day}
          {hasHeartbeat && <Heart size={10} fill="var(--accent-secondary)" stroke="var(--accent-secondary)" className="heartbeat-icon" />}
        </div>
        <div className="day-tasks">
          {tasksForDay.map((task) => (
            <div
              key={task.id}
              className="calendar-task"
              draggable
              onDragStart={(e) => handleDragStart(e, task)}
              onClick={(e) => { e.stopPropagation(); onTaskClick?.(task); }}
            >
              <span className="task-name">{task.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="calendar-view fade-in">
      <div className="calendar-header">
        <div className="calendar-controls">
          <button className="month-nav-btn" onClick={handlePrevMonth}>
            <ChevronLeft size={20} />
          </button>
          <h2>{monthNames[month]} {year}</h2>
          <button className="month-nav-btn" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="calendar-options">
          <button
            className={`heartbeat-toggle-btn ${showHeartbeatReminders ? 'active' : ''}`}
            onClick={() => setShowHeartbeatReminders(!showHeartbeatReminders)}
          >
            <Heart size={16} strokeWidth={2} />
            <span>Heartbeat Reminders</span>
          </button>
        </div>
      </div>
      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {days}
      </div>
    </div>
  );
};

export default CalendarView;
