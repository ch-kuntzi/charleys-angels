import React, { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Plus, Check, X } from 'lucide-react';
import Column from './Column';
import './Board.css';

const Board = ({ data, onDragEnd, onTaskClick, onRenameColumn, onAddColumn, onReorderColumns }) => {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  const handleAddColumn = () => {
    const trimmed = newColumnName.trim();
    if (trimmed && onAddColumn) {
      onAddColumn(trimmed);
      setNewColumnName('');
      setIsAddingColumn(false);
    }
  };

  const handleColumnDragStart = (e, columnId) => {
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('columnId', columnId);
    // Add a slight delay to let the drag image render
    setTimeout(() => {
      document.querySelector(`[data-column-id="${columnId}"]`)?.classList.add('column-dragging');
    }, 0);
  };

  const handleColumnDragOver = (e, columnId) => {
    e.preventDefault();
    if (draggedColumnId && draggedColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleColumnDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleColumnDrop = (e, targetColumnId) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const sourceColumnId = draggedColumnId;
    if (sourceColumnId && sourceColumnId !== targetColumnId && onReorderColumns) {
      onReorderColumns(sourceColumnId, targetColumnId);
    }
    document.querySelector(`[data-column-id="${sourceColumnId}"]`)?.classList.remove('column-dragging');
    setDraggedColumnId(null);
  };

  const handleColumnDragEnd = () => {
    if (draggedColumnId) {
      document.querySelector(`[data-column-id="${draggedColumnId}"]`)?.classList.remove('column-dragging');
    }
    setDraggedColumnId(null);
    setDragOverColumnId(null);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board">
        {data.columnOrder.map((columnId) => {
          const column = data.columns[columnId];
          const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

          return (
            <div
              key={column.id}
              data-column-id={column.id}
              className={`column-drag-wrapper ${dragOverColumnId === column.id ? 'column-drop-target' : ''}`}
              draggable
              onDragStart={(e) => handleColumnDragStart(e, column.id)}
              onDragOver={(e) => handleColumnDragOver(e, column.id)}
              onDragLeave={handleColumnDragLeave}
              onDrop={(e) => handleColumnDrop(e, column.id)}
              onDragEnd={handleColumnDragEnd}
            >
              <Column
                column={column}
                tasks={tasks}
                onTaskClick={onTaskClick}
                onRenameColumn={onRenameColumn}
              />
            </div>
          );
        })}
        {isAddingColumn ? (
          <div className="add-column-form">
            <input
              className="add-column-input"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Column name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddColumn();
                if (e.key === 'Escape') { setIsAddingColumn(false); setNewColumnName(''); }
              }}
            />
            <div className="add-column-actions">
              <button className="add-column-confirm" onClick={handleAddColumn} title="Create">
                <Check size={16} />
              </button>
              <button className="add-column-cancel" onClick={() => { setIsAddingColumn(false); setNewColumnName(''); }} title="Cancel">
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button className="add-column-btn" onClick={() => setIsAddingColumn(true)} title="Add column">
            <Plus size={20} />
            <span>Add Column</span>
          </button>
        )}
      </div>
    </DragDropContext>
  );
};

export default Board;
