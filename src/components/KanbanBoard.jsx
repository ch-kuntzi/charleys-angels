
import React, { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import styled from 'styled-components';
import Column from './Column';

const BoardContainer = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background-color: #0F172A;
  color: #F8FAFC;
  min-height: 100vh;
`;

const initialColumns = {
  'in-queue': {
    id: 'in-queue',
    title: 'In Queue',
    tasks: [
      { id: 'task-1', content: 'Task 1', agentColor: '#F43F5E' },
      { id: 'task-2', content: 'Task 2', agentColor: '#3B82F6' },
    ],
  },
  'in-progress': {
    id: 'in-progress',
    title: 'In Progress',
    tasks: [
      { id: 'task-3', content: 'Task 3', agentColor: '#F59E0B' },
    ],
  },
  'complete': {
    id: 'complete',
    title: 'Complete',
    tasks: [
        { id: 'task-4', content: 'Task 4', agentColor: '#10B981' },
    ],
  },
};

const KanbanBoard = () => {
  const [columns, setColumns] = useState(initialColumns);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const { id: activeId } = active;
    const { id: overId } = over;
    
    const activeContainer = active.data.current.sortable.containerId;
    const overContainer = over.data.current.sortable.containerId;

    if (activeContainer !== overContainer) {
        const activeColumn = columns[activeContainer];
        const overColumn = columns[overContainer];
        const activeIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
        const overIndex = overColumn.tasks.findIndex(t => t.id === overId);

        const newActiveTasks = [...activeColumn.tasks];
        const [movedTask] = newActiveTasks.splice(activeIndex, 1);
        const newOverTasks = [...overColumn.tasks];
        newOverTasks.splice(overIndex, 0, movedTask);

        setColumns({
            ...columns,
            [activeContainer]: {
                ...activeColumn,
                tasks: newActiveTasks,
            },
            [overContainer]: {
                ...overColumn,
                tasks: newOverTasks,
            },
        });
    }


  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <BoardContainer>
        {Object.values(columns).map((column) => (
          <Column key={column.id} column={column} />
        ))}
      </BoardContainer>
    </DndContext>
  );
};

export default KanbanBoard;
