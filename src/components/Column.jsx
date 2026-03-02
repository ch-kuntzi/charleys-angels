import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import './Column.css';

const Column = ({ column, tasks, onTaskClick, onRenameColumn, onAddTask, categoryColors = {} }) => {
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

  return (
    <div className="column">
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
        </h3>
      )}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
                columnTitle={column.title}
                categoryColors={categoryColors}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {isQueue && onAddTask && (
        <button className="quick-add-task" onClick={onAddTask}>
          + New Task
        </button>
      )}
    </div>
  );
};

export default Column;
