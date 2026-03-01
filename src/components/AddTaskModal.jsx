import React, { useState } from 'react';
import './AddTaskModal.css';



const AddTaskModal = ({ agents, onAddTask, onClose, initialDate = '', categories = [] }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agent, setAgent] = useState(agents[0].name);
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(initialDate);
  const [dueTime, setDueTime] = useState('07:00');

  const [tags, setTags] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

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

  const getCategoryColor = (category) => {
    const colorMap = {
      'Bug': '#EF4444',
      'Feature': '#10B981',
      'Research': '#A78BFA',
      'Admin': '#A78BFA',
      'Urgent': '#F59E0B',
    };
    return colorMap[category] || '#8B949E';
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      id: Date.now() + Math.random(),
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const newAttachments = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      id: Date.now() + Math.random(),
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('zip') || type.includes('compressed')) return '📦';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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
              rows="4"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="agent">Assign to</label>
              <select
                id="agent"
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="select-field"
              >
                {agents.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="select-field"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
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
              className={`attachment-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload-add"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload-add" className="upload-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Drop files here or click to upload</span>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="attachment-list">
                {attachments.map((file) => (
                  <div key={file.id} className="attachment-pill">
                    <span className="file-icon">{getFileIcon(file.type)}</span>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      className="remove-attachment"
                      onClick={() => removeAttachment(file.id)}
                      title="Remove attachment"
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
