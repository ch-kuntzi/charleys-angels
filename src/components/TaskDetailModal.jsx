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

/* Reusable custom select matching FilterBar style */
const ModalSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder || '';

  return (
    <div className="modal-custom-select" ref={ref}>
      <button
        className={`modal-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{selectedLabel}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div className="modal-select-menu">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`modal-select-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
              {value === opt.value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TaskDetailModal = ({ task, agents, onClose, onSave, onDelete, onArchive, columnTitle, onStartNow }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [agent, setAgent] = useState(task.agent);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [dueTime, setDueTime] = useState(task.dueTime || '07:00');

  const [tags, setTags] = useState(task.tags || []);
  const [newMessage, setNewMessage] = useState('');

  const discussionEndRef = useRef(null);

  const hasFutureStartDate = false;
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

      tags,
    });
    onClose();
  };

  const handleAddMessage = () => {
    if (newMessage.trim() === '') return;

    const newComment = {
      text: newMessage,
      author: 'Charley',
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
      onClose();
    }
  };

  const agentOptions = agents.map(({ name }) => ({ value: name, label: name }));
  const priorityOptions = [
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];

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
                <div className="message-input-wrapper">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
                  />
                  <button onClick={handleAddMessage} className="send-button-inlay">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-sidebar">
            <div className="form-group">
              <label>Agent</label>
              <ModalSelect
                value={agent}
                onChange={setAgent}
                options={agentOptions}
                placeholder="Select agent"
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <ModalSelect
                value={priority}
                onChange={setPriority}
                options={priorityOptions}
                placeholder="Select priority"
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="date-input" />
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
