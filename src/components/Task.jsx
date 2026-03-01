
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from 'styled-components';

const TaskContainer = styled.div`
  background-color: #334155;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
  border-left: 5px solid ${(props) => props.agentColor};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  opacity: ${(props) => (props.isDragging ? 0.5 : 1)};
`;

const Task = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TaskContainer
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      agentColor={task.agentColor}
      isDragging={isDragging}
    >
      {task.content}
    </TaskContainer>
  );
};

export default Task;
