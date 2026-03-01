import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  Send,
  Trash2,
  Archive,
  ArchiveRestore,
  Play
} from 'lucide-react';
import './TaskDetailModal.css';

const categories = ['Bug', 'Feature', 'Research', 'Admin', 'Urgent'];

const isDateInFuture = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
};

const TaskDetailModal = ({ task, agents, onClose, onSave, onDelete, onArchive, columnTitle, onStartNow }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [agent, setAgent] = useState(task.agent);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [dueTime, setDueTime] = useState(task.dueTime || '07:00');
  const [startDate, setStartDate] = useState(task.startDate || '');
  const [tags, setTags] = useState(task.tags || []);
  const [newMessage, setNewMessage] = useState('');
  
  const discussionEndRef = useRef(null);
  
  const hasFutureStartDate = isDateInFuture(task.startDate);
  const isInQueue = columnTitle === 'In Queue';

  useEffect(() => {
    discussionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.comments]);

  const handleSave = () => {
    onSave({
      ...task,
      title,
      description,
      agent,
      priority,
      dueDate,
      dueTime,
      startDate,
      tags,
    });
    onClose();
  };

  const handleAddMessage = () => {
    if (newMessage.trim() === '') return;
    
    const newComment = {
      text: newMessage,
      author: 'Charley', // Assuming the user is always Charley for now
      timestamp: new Date().toISOString(),
    };
    onSave({
      ...task,
      comments: [...(task.comments || []), newComment],
    });
    setNewMessage('');
  };

  const toggleTag = (tag) => {
    setTags(prevTags => 
      prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag]
    );
  };

  const getCategoryPillStyle = (category) => {
    const colorMap = {
      'Bug': 'var(--status-error)',
      'Feature': 'var(--status-success)',
      'Research': 'var(--accent-secondary)',
      'Admin': 'var(--accent-secondary)',
      'Urgent': 'var(--status-warning)',
    };
    const color = colorMap[category] || 'var(--text-secondary)';
    const isActive = tags.includes(category);
    return {
      backgroundColor: isActive ? `${color}26` : 'var(--bg-elevated)',
      color: isActive ? color : 'var(--text-primary)',
      border: isActive ? `1px solid ${color}40` : '1px solid var(--border-default)'
    };
  };
  
  const handleStartNow = () => {
    if (onStartNow) {
      onStartNow(task.id);
      onClose(); // Close the modal after starting
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="modal-title-input"
          />
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-main">
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="textarea-field"
                rows="4"
                placeholder="Add a more detailed description..."
              />
            </div>

            {/* DISCUSSION THREAD */}
            <div className="discussion-section">
              <h4 className="discussion-title">Discussion</h4>
              <div className="discussion-thread">
                {(task.comments || []).length === 0 ? (
                  <p className="empty-state">No messages yet. Start the conversation!</p>
                ) : (
                  (task.comments || []).map((msg, index) => (
                    <div key={index} className="message-bubble">
                      <div className="message-header">
                        <span className="message-author">{msg.author}</span>
                        <span className="message-timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="message-text">{msg.text}</p>
                    </div>
                  ))
                )}
                <div ref={discussionEndRef} />
              </div>
              <div className="discussion-input-area">
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder="Type a message..."
                  className="input-field"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
                />
                <button onClick={handleAddMessage} className="send-button">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="modal-sidebar">
            <div className="form-group">
              <label>Agent</label>
              <select value={agent} onChange={(e) => setAgent(e.target.value)} className="select-field">
                {agents.map(({ name }) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="select-field">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field"/>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field"/>
            </div>
             <div className="form-group">
              <label>Categories</label>
              <div className="tag-selector">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => toggleTag(cat)} className="tag-pill" style={getCategoryPillStyle(cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            <button onClick={() => onDelete(task.id)} className="btn-secondary">
              <Trash2 size={14} /> Delete
            </button>
            <button onClick={() => onArchive(task.id)} className="btn-secondary">
              {task.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              {task.archived ? 'Unarchive' : 'Archive'}
            </button>
             {isInQueue && !hasFutureStartDate && (
              <button 
                className="btn-secondary start-now-btn"
                onClick={handleStartNow}
                title="Move to In Progress"
              >
                <Play size={14} />
                Start Now
              </button>
            )}
          </div>
          <button onClick={handleSave} className="btn-primary">Save & Close</button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
