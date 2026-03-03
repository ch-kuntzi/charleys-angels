import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import './Column.css';

const Column = ({ column, tasks, onTaskClick, onRenameColumn, onAddTask, categoryColors = {},
  selectMode = false, selectedIds = new Set(), onToggleSelect, onEnterSelectMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const handleDoubleClick = () => {
    setEditTitle(column.title);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== column.title && onRenameColumn) {
      onRenameColumn(column.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditTitle(column.title);
      setIsEditing(false);
    }
  };

  const isQueue = column.id === 'column-1';
  const isInProgress = column.id === 'column-2';
  const showAddButton = (isQueue || isInProgress) && onAddTask;
  const selectedInColumn = tasks.filter(t => selectedIds.has(t.id)).length;

  return (
    <div className="column">
      <div className="column-header-row">
        {isEditing ? (
          <input
            className="column-title-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <h3 className="column-title" onDoubleClick={handleDoubleClick} title="Double-click to rename">
            {column.title}
            <span className="column-count">{tasks.length}</span>
          </h3>
        )}
        {tasks.length > 0 && (
          <button
            className={`select-toggle ${selectMode ? 'active' : ''}`}
            onClick={onEnterSelectMode}
          >
            {selectMode ? (selectedInColumn > 0 ? `${selectedInColumn} selected` : 'Select') : 'Select'}
          </button>
        )}
      </div>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''} ${showAddButton ? 'has-add-btn' : 'no-add-btn'}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <div key={task.id} className={`card-wrapper ${selectMode ? 'select-mode' : ''}`}>
                {selectMode && (
                  <label className="card-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(task.id)}
                      onChange={() => onToggleSelect(task.id)}
                    />
                    <span className="checkmark" />
                  </label>
                )}
                <TaskCard
                  task={task}
                  index={index}
                  onClick={() => selectMode ? onToggleSelect(task.id) : onTaskClick(task)}
                  columnTitle={column.title}
                  categoryColors={categoryColors}
                />
              </div>
            ))}
            {provided.placeholder}
            {showAddButton && (
              <button className="quick-add-task" onClick={onAddTask}>
                + New Task
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;
