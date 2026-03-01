import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import Column from './Column';
import './Board.css';

const Board = ({ data, onDragEnd, onTaskClick, onRenameColumn, onAddColumn }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board">
        {data.columnOrder.map((columnId) => {
          const column = data.columns[columnId];
          const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

          return (
            <Column
              key={column.id}
              column={column}
              tasks={tasks}
              onTaskClick={onTaskClick}
              onRenameColumn={onRenameColumn}
            />
          );
        })}
        {onAddColumn && (
          <button className="add-column-btn" onClick={onAddColumn} title="Add column">
            <Plus size={20} />
            <span>Add Column</span>
          </button>
        )}
      </div>
    </DragDropContext>
  );
};

export default Board;
