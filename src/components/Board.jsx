import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';
import './Board.css';

const Board = ({ data, onDragEnd, onTaskClick }) => {
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
            />
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default Board;
