import React, { useState, useRef, useEffect } from 'react';
import './AddTaskModal.css';

// Reusable custom select matching the card detail style
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

const AddTaskModal = ({ agents, onAddTask, onClose, initialDate = '', categories = [], taskColors = {} }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agent, setAgent] = useState(agents[0].name);
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(initialDate);
  const [dueTime, setDueTime] = useState('07:00');
  const [deliveryMethod, setDeliveryMethod] = useState('reply');
  const [thinkingLevel, setThinkingLevel] = useState('standard');
  const [tags, setTags] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title,
      description,
      agent,
      priority,
      dueDate,
      dueTime,
      deliveryMethod,
      thinkingLevel,
      tags,
      attachments,
      timestamp: 'Just now',
    };
    onAddTask(newTask);
    onClose();
  };

  const toggleTag = (category) => {
    if (tags.includes(category)) {
      setTags(tags.filter(t => t !== category));
    } else {
      setTags([...tags, category]);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsUploading(true);

    const tempTaskId = `task-${Date.now()}`;
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds 5MB limit`);
        continue;
      }
      try {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: tempTaskId, fileName: file.name, data: dataUrl }),
        });
        const result = await res.json();
        if (result.ok) {
          setAttachments(prev => [...prev, {
            name: result.fileName,
            url: result.url,
            localPath: result.localPath,
            type: file.type,
            size: file.size,
            isImage: file.type.startsWith('image/'),
          }]);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const getCategoryColor = (category) => {
    const defaults = {
      'Bug': '#EF4444',
      'Feature': '#10B981',
      'Research': '#A78BFA',
      'Admin': '#A78BFA',
      'Urgent': '#F59E0B',
    };
    return (taskColors && taskColors[category]) || defaults[category] || '#8B949E';
  };

  const agentOptions = agents.map(({ name }) => ({ value: name, label: name }));
  const priorityOptions = [
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];
  const deliveryOptions = [
    { value: 'reply', label: 'Quick Reply' },
    { value: 'comment', label: 'Comment Only' },
    { value: 'nlm-infographic', label: 'NLM Infographic' },
    { value: 'nlm-audio', label: 'NLM Audio' },
    { value: 'nlm-slides', label: 'NLM Slides' },
    { value: 'nlm-mindmap', label: 'NLM Mind Map' },
    { value: 'nlm-summary', label: 'NLM Summary' },
  ];
  const thinkingOptions = [
    { value: 'quick', label: 'Quick' },
    { value: 'standard', label: 'Standard' },
    { value: 'deep', label: 'Deep Research' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea-field"
              rows="3"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assign to</label>
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dueTime">Time</label>
              <input
                type="time"
                id="dueTime"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Delivery</label>
              <ModalSelect
                value={deliveryMethod}
                onChange={setDeliveryMethod}
                options={deliveryOptions}
                placeholder="Delivery method"
              />
            </div>
            <div className="form-group">
              <label>Thinking Level</label>
              <ModalSelect
                value={thinkingLevel}
                onChange={setThinkingLevel}
                options={thinkingOptions}
                placeholder="Thinking level"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Categories</label>
            <div className="tag-selector">
              {categories.map((category) => {
                const color = getCategoryColor(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleTag(category)}
                    className={`tag-pill ${tags.includes(category) ? 'active' : ''}`}
                    style={{
                      backgroundColor: tags.includes(category)
                        ? `${color}26`
                        : 'var(--bg-elevated)',
                      color: tags.includes(category)
                        ? color
                        : 'var(--text-primary)',
                      border: tags.includes(category) ? 'none' : '1px solid var(--border-default)'
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Attachments</label>
            <div
              className="attachment-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
              />
              <span className="upload-label-text">{isUploading ? 'Uploading...' : 'Click to attach files (max 5MB)'}</span>
            </div>
            {attachments.length > 0 && (
              <div className="attachment-list">
                {attachments.map((file, i) => (
                  <div key={i} className="attachment-pill">
                    <span className="file-name">{file.name}</span>
                    <button
                      type="button"
                      className="remove-attachment"
                      onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
