import React, { useState, useRef } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Plus, Check, X } from 'lucide-react';
import Column from './Column';
import './Board.css';

const Board = ({ data, onDragEnd, onTaskClick, onRenameColumn, onAddColumn, onReorderColumns }) => {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);
  const [settledColumnId, setSettledColumnId] = useState(null);
  const dragSourceIndex = useRef(null);

  const handleAddColumn = () => {
    const trimmed = newColumnName.trim();
    if (trimmed && onAddColumn) {
      onAddColumn(trimmed);
      setNewColumnName('');
      setIsAddingColumn(false);
    }
  };

  const getShiftDirection = (columnId) => {
    if (!draggedColumnId || !dragOverColumnId || draggedColumnId === columnId) return '';
    const order = data.columnOrder;
    const dragIdx = order.indexOf(draggedColumnId);
    const overIdx = order.indexOf(dragOverColumnId);
    const thisIdx = order.indexOf(columnId);

    if (dragIdx < overIdx) {
      // Dragging right: columns between drag and over shift left
      if (thisIdx > dragIdx && thisIdx <= overIdx) return 'shift-left';
    } else if (dragIdx > overIdx) {
      // Dragging left: columns between over and drag shift right
      if (thisIdx >= overIdx && thisIdx < dragIdx) return 'shift-right';
    }
    return '';
  };

  const handleColumnDragStart = (e, columnId) => {
    setDraggedColumnId(columnId);
    dragSourceIndex.current = data.columnOrder.indexOf(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('columnId', columnId);
    setTimeout(() => {
      const el = document.querySelector(`[data-column-id="${columnId}"]`);
      if (el) el.classList.add('column-dragging');
    }, 0);
  };

  const handleColumnDragOver = (e, columnId) => {
    e.preventDefault();
    if (draggedColumnId && draggedColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleColumnDragLeave = (e) => {
    // Only clear if actually leaving the column area
    const related = e.relatedTarget;
    if (!related || !e.currentTarget.contains(related)) {
      // Don't clear dragOverColumnId here to keep shift animation stable
    }
  };

  const handleColumnDrop = (e, targetColumnId) => {
    e.preventDefault();
    const sourceColumnId = draggedColumnId;

    // Trigger settle wiggle on the dropped column
    setSettledColumnId(sourceColumnId);
    setTimeout(() => setSettledColumnId(null), 400);

    setDragOverColumnId(null);
    if (sourceColumnId && sourceColumnId !== targetColumnId && onReorderColumns) {
      onReorderColumns(sourceColumnId, targetColumnId);
    }
    document.querySelector(`[data-column-id="${sourceColumnId}"]`)?.classList.remove('column-dragging');
    setDraggedColumnId(null);
    dragSourceIndex.current = null;
  };

  const handleColumnDragEnd = () => {
    if (draggedColumnId) {
      document.querySelector(`[data-column-id="${draggedColumnId}"]`)?.classList.remove('column-dragging');
    }
    setDraggedColumnId(null);
    setDragOverColumnId(null);
    dragSourceIndex.current = null;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board">
        {data.columnOrder.map((columnId) => {
          const column = data.columns[columnId];
          const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);
          const shiftClass = getShiftDirection(columnId);
          const isSettled = settledColumnId === columnId;
          const isDragged = draggedColumnId === columnId;

          return (
            <div
              key={column.id}
              data-column-id={column.id}
              className={`column-drag-wrapper ${isDragged ? 'column-dragging' : ''} ${shiftClass} ${isSettled ? 'column-settled' : ''}`}
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
