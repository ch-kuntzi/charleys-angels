import React, { useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AddTaskModal from './components/AddTaskModal';
import TaskDetailModal from './components/TaskDetailModal';
import FilterBar from './components/FilterBar';
import CalendarView from './components/CalendarView';
import ActivityLog from './components/ActivityLog';
import Toast from './components/Toast';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import StatisticsModal from './components/StatisticsModal';

const initialData = {
  tasks: {
    'task-1': { id: 'task-1', title: 'Design the new logo', description: 'Create a new logo for the company', agent: 'Charley', priority: 'High', timestamp: '2 hours ago', tags: ['Feature'], dueDate: '', dueTime: '07:00', startDate: '', comments: [], attachments: [], reviewLink: '', archived: false },
    'task-2': { id: 'task-2', title: 'Develop the new feature', description: 'Implement the new feature for the app', agent: 'Builder', priority: 'Medium', timestamp: '5 hours ago', tags: ['Feature'], dueDate: '', dueTime: '07:00', startDate: '', comments: [], attachments: [], reviewLink: '', archived: false },
    'task-3': { id: 'task-3', title: 'Fix the bug', description: 'Fix the bug in the login page', agent: 'Coder', priority: 'High', timestamp: '1 day ago', tags: ['Bug', 'Urgent'], dueDate: '', dueTime: '07:00', startDate: '', comments: [], attachments: [], reviewLink: '', archived: false },
    'task-4': { id: 'task-4', title: 'Write the documentation', description: 'Write the documentation for the new API', agent: 'Scout', priority: 'Low', timestamp: '2 days ago', tags: ['Admin'], dueDate: '', dueTime: '07:00', startDate: '', comments: [], attachments: [], reviewLink: '', archived: false, completedAt: '2026-02-27T10:00:00.000Z' },
  },
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'In Queue',
      taskIds: ['task-1', 'task-2'],
    },
    'column-2': {
      id: 'column-2',
      title: 'In Progress',
      taskIds: ['task-3'],
    },
    'column-3': {
      id: 'column-3',
      title: 'Review',
      taskIds: [],
    },
    'column-4': {
      id: 'column-4',
      title: 'Deployed',
      taskIds: ['task-4'],
    },
  },
  columnOrder: ['column-1', 'column-2', 'column-3', 'column-4'],
};

const agents = [
  { name: 'Charley', icon: 'brain' },
  { name: 'JoAnne', icon: 'shield-check' },
  { name: 'Scout', icon: 'search' },
  { name: 'Builder', icon: 'hammer' },
  { name: 'Ops', icon: 'mail' },
  { name: 'Finance', icon: 'wallet' },
  { name: 'Planner', icon: 'calendar' },
  { name: 'Architect', icon: 'compass' },
  { name: 'Coder', icon: 'code' },
  { name: 'QA', icon: 'check-circle' },
];

const getInitialData = () => {
  const savedData = localStorage.getItem('taskDashboardData');
  return savedData ? JSON.parse(savedData) : initialData;
};

const getInitialActivity = () => {
  const savedActivity = localStorage.getItem('taskDashboardActivity');
  return savedActivity ? JSON.parse(savedActivity) : [];
};

function App() {
  const [data, setData] = useState(getInitialData);
  const [activity, setActivity] = useState(getInitialActivity);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({ agent: '', priority: '', tag: '' });
  const [searchTerm, setSearchTerm] = useState('');
  // Changed from single view to array of active views
  const [activeViews, setActiveViews] = useState(['board']);
  const [toasts, setToasts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const addActivity = (action, details) => {
    const newActivity = {
      id: Date.now(),
      action,
      details,
      timestamp: new Date().toLocaleString(),
    };
    const updatedActivity = [newActivity, ...activity].slice(0, 50);
    setActivity(updatedActivity);
    localStorage.setItem('taskDashboardActivity', JSON.stringify(updatedActivity));
  };

  const handleSetData = (newData) => {
    setIsSaving(true);
    setData(newData);
    localStorage.setItem('taskDashboardData', JSON.stringify(newData));
    setTimeout(() => setIsSaving(false), 500);
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];
    const task = data.tasks[draggableId];

    // Check if moved to Deployed column - set completion timestamp
    let updatedTask = { ...task };
    if (finish.id === 'column-4' && start.id !== 'column-4') {
      updatedTask.completedAt = new Date().toISOString();
    }

    // Check if moved FROM Deployed to another column - clear timestamp
    if (start.id === 'column-4' && finish.id !== 'column-4') {
      updatedTask.completedAt = null;
    }

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...start,
        taskIds: newTaskIds,
      };

      const newState = {
        ...data,
        tasks: {
          ...data.tasks,
          [draggableId]: updatedTask,
        },
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      };

      handleSetData(newState);
      return;
    }

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = {
      ...start,
      taskIds: startTaskIds,
    };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finish,
      taskIds: finishTaskIds,
    };

    const newState = {
      ...data,
      tasks: {
        ...data.tasks,
        [draggableId]: updatedTask,
      },
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    };

    addActivity('moved', `"${task.title}" moved from ${start.title} to ${finish.title}`);
    if (finish.id === 'column-4') {
      showToast(`Task completed! 🎉`, 'success');
    }
    handleSetData(newState);
  };

  const handleAddTask = (newTask) => {
    const taskWithDefaults = {
      ...newTask,
      comments: newTask.comments || [],
      attachments: newTask.attachments || [],
      reviewLink: newTask.reviewLink || '',
      archived: false,
      completedAt: null,
    };

    const newData = {
      ...data,
      tasks: {
        ...data.tasks,
        [taskWithDefaults.id]: taskWithDefaults,
      },
      columns: {
        ...data.columns,
        'column-1': {
          ...data.columns['column-1'],
          taskIds: [taskWithDefaults.id, ...data.columns['column-1'].taskIds],
        },
      },
    };
    handleSetData(newData);
    addActivity('created', `Task "${taskWithDefaults.title}" created by ${taskWithDefaults.agent}`);
    showToast('Task created successfully!', 'success');
  };

  const handleAddTaskWithDate = (dateString) => {
    setModalInitialDate(dateString);
    setIsModalOpen(true);
  };

  const handleOpenTaskModal = (task) => {
    setSelectedTask(task);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
  };

  const handleSaveTask = (updatedTask) => {
    const newData = {
      ...data,
      tasks: {
        ...data.tasks,
        [updatedTask.id]: updatedTask,
      },
    };
    handleSetData(newData);
    addActivity('updated', `"${updatedTask.title}" updated`);
    showToast('Task updated successfully!', 'success');
  };

  const handleDeleteTask = (taskId) => {
    setDeleteConfirmModal(taskId);
  };

  const confirmDelete = () => {
    const taskId = deleteConfirmModal;
    const task = data.tasks[taskId];
    const newData = { ...data };
    delete newData.tasks[taskId];

    Object.keys(newData.columns).forEach(columnId => {
      newData.columns[columnId].taskIds = newData.columns[columnId].taskIds.filter(id => id !== taskId);
    });

    handleSetData(newData);
    addActivity('deleted', `"${task.title}" deleted`);
    showToast('Task deleted successfully!', 'success');
    setSelectedTask(null);
    setDeleteConfirmModal(null);
  };

  const handleArchiveTask = (taskId) => {
    const task = data.tasks[taskId];
    const isArchiving = !task.archived;

    const newData = {
      ...data,
      tasks: {
        ...data.tasks,
        [taskId]: {
          ...task,
          archived: isArchiving,
        },
      },
    };

    handleSetData(newData);
    addActivity(isArchiving ? 'archived' : 'unarchived', `"${task.title}" ${isArchiving ? 'archived' : 'unarchived'}`);
    showToast(`Task ${isArchiving ? 'archived' : 'unarchived'}!`, 'success');
    setSelectedTask(null);
  };

  const handleStartNow = (taskId) => {
    const task = data.tasks[taskId];
    const updatedTask = {
      ...task,
      startDate: '', // Clear the start date to start immediately
    };

    // Find which column the task is currently in
    let sourceColumnId = null;
    for (const columnId in data.columns) {
      if (data.columns[columnId].taskIds.includes(taskId)) {
        sourceColumnId = columnId;
        break;
      }
    }

    // If task is in Queue (column-1), move it to In Progress (column-2)
    if (sourceColumnId === 'column-1') {
      const sourceColumn = data.columns[sourceColumnId];
      const destColumn = data.columns['column-2'];

      // Remove from Queue
      const newSourceTaskIds = sourceColumn.taskIds.filter(id => id !== taskId);

      // Add to In Progress at the top
      const newDestTaskIds = [taskId, ...destColumn.taskIds];

      const newData = {
        ...data,
        tasks: {
          ...data.tasks,
          [taskId]: updatedTask,
        },
        columns: {
          ...data.columns,
          [sourceColumnId]: {
            ...sourceColumn,
            taskIds: newSourceTaskIds,
          },
          'column-2': {
            ...destColumn,
            taskIds: newDestTaskIds,
          },
        },
      };

      handleSetData(newData);
      addActivity('started', `"${task.title}" moved from Queue to In Progress`);
      showToast('Task started now!', 'success');
    } else {
      // For tasks with future start dates in other columns, just clear the date
      const newData = {
        ...data,
        tasks: {
          ...data.tasks,
          [taskId]: updatedTask,
        },
      };

      handleSetData(newData);
      addActivity('started', `"${task.title}" started early (bypassed schedule)`);
      showToast('Task started now!', 'success');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value,
    }));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleAgentFilterClick = (agentName) => {
    if (selectedAgentFilter.includes(agentName)) {
      setSelectedAgentFilter(selectedAgentFilter.filter(a => a !== agentName));
    } else {
      setSelectedAgentFilter([...selectedAgentFilter, agentName]);
    }
  };

  // New view toggle handler with two-view logic
  const handleViewToggle = (viewName) => {
    if (activeViews.includes(viewName)) {
      // Deactivating a view - only allow if more than one view is active
      if (activeViews.length > 1) {
        setActiveViews(activeViews.filter(v => v !== viewName));
      }
    } else {
      // Activating a view
      if (activeViews.length === 0) {
        // Should never happen, but just in case
        setActiveViews([viewName]);
      } else if (activeViews.length === 1) {
        // Add second view - check compatibility
        const currentView = activeViews[0];

        // Board and Calendar cannot both be active
        if ((currentView === 'board' && viewName === 'calendar') ||
          (currentView === 'calendar' && viewName === 'board')) {
          // Replace current view with new view
          setActiveViews([viewName]);
        } else {
          // Compatible views - add it
          setActiveViews([...activeViews, viewName]);
        }
      } else if (activeViews.length === 2) {
        // Already have 2 views - replace intelligently
        if (viewName === 'activity') {
          // Trying to add activity when 2 views active (must be board+calendar, which shouldn't happen)
          // Replace with activity only
          setActiveViews(['activity']);
        } else if (activeViews.includes('activity')) {
          // Activity is active with another view, replace the other view
          setActiveViews(['activity', viewName]);
        } else {
          // Two main views active (board+calendar, shouldn't happen), replace with new view
          setActiveViews([viewName]);
        }
      }
    }
  };

  const filteredTasks = Object.values(data.tasks).filter(task => {
    // Archive filter
    if (!showArchived && task.archived) {
      return false;
    }

    // Search term
    const searchTermMatch = searchTerm === '' ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Sidebar agent filter (multi-select)
    const sidebarAgentMatch = selectedAgentFilter.length === 0 || selectedAgentFilter.includes(task.agent);

    // Other filters
    const priorityMatch = filters.priority === '' || task.priority === filters.priority;
    const tagMatch = filters.tag === '' || (task.tags && task.tags.includes(filters.tag));

    return searchTermMatch && sidebarAgentMatch && priorityMatch && tagMatch;
  });

  const filteredData = {
    ...data,
    tasks: filteredTasks.reduce((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {}),
    columns: Object.keys(data.columns).reduce((acc, columnId) => {
      acc[columnId] = {
        ...data.columns[columnId],
        taskIds: data.columns[columnId].taskIds.filter(id => filteredTasks.find(t => t.id === id))
      };
      return acc;
    }, {})
  };

  // Determine layout class based on active views
  const isTwoViewLayout = activeViews.length === 2;
  const showBoard = activeViews.includes('board');
  const showCalendar = activeViews.includes('calendar');
  const showActivity = activeViews.includes('activity');

  return (
    <div className={`app ${isTwoViewLayout ? 'two-view-layout' : ''}`}>
      <Sidebar
        agents={agents}
        tasks={data.tasks}
        columns={data.columns}
        selectedAgent={selectedAgentFilter}
        onAgentClick={handleAgentFilterClick}
      />
      <div className="main-content">
        <Header
          onAddTaskClick={() => { setModalInitialDate(''); setIsModalOpen(true); }}
          isSaving={isSaving}
          activeViews={activeViews}
          onViewToggle={handleViewToggle}
        />
        <FilterBar
          agents={agents}
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          searchTerm={searchTerm}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived(!showArchived)}
        />
        <div className="view-container">
          {showBoard && (
            <div className="view-panel board-panel">
              <Board
                data={filteredData}
                onDragEnd={onDragEnd}
                onTaskClick={handleOpenTaskModal}
              />
            </div>
          )}
          {showCalendar && (
            <div className="view-panel calendar-panel">
              <CalendarView
                tasks={filteredTasks}
                onTaskClick={handleOpenTaskModal}
                onAddTaskWithDate={handleAddTaskWithDate}
              />
            </div>
          )}
        </div>
      </div>
      {showActivity && (
        <div className="activity-overlay">
          <ActivityLog activity={activity} />
        </div>
      )}
      {isModalOpen && (
        <AddTaskModal
          agents={agents}
          onAddTask={handleAddTask}
          onClose={() => setIsModalOpen(false)}
          initialDate={modalInitialDate}
        />
      )}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          agents={agents}
          onClose={handleCloseTaskModal}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onArchive={handleArchiveTask}
          onStartNow={handleStartNow}
          columnTitle={Object.values(data.columns).find(col => col.taskIds.includes(selectedTask.id))?.title}
        />
      )}
      {deleteConfirmModal && (
        <DeleteConfirmModal
          taskTitle={data.tasks[deleteConfirmModal]?.title}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmModal(null)}
        />
      )}
      <Toast toasts={toasts} />
    </div>
  );
}

export default App;
