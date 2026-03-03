import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Send,
  Trash2,
  Archive,
  ArchiveRestore,
  Play,
  ExternalLink,
  Image,
  FileText,
  Brain,
  ShieldCheck,
  Search,
  Hammer,
  Mail,
  Wallet,
  Calendar,
  Compass,
  Code,
  CheckCircle,
} from 'lucide-react';

const agentIconMap = {
  'Charley': Brain,
  'JoAnne': ShieldCheck,
  'Scout': Search,
  'Builder': Hammer,
  'Ops': Mail,
  'Finance': Wallet,
  'Planner': Calendar,
  'Architect': Compass,
  'Coder': Code,
  'QA': CheckCircle,
};
import './TaskDetailModal.css';



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

const TaskDetailModal = ({ task, agents, onClose, onSave, onDelete, onArchive, columnTitle, onStartNow, categories = [], taskColors = {} }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [agent, setAgent] = useState(task.agent);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [dueTime, setDueTime] = useState(task.dueTime || '07:00');

  const [tags, setTags] = useState(task.tags || []);
  const [deliveryMethod, setDeliveryMethod] = useState(task.deliveryMethod || 'reply');
  const [thinkingLevel, setThinkingLevel] = useState(task.thinkingLevel || 'standard');
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleChatMouseDown = (e) => {
    const startX = e.clientX;
    setIsDragging(true);
    const onMove = (e) => {
      const dx = Math.max(-84, Math.min(0, e.clientX - startX));
      setDragOffset(dx);
    };
    const onUp = () => {
      setIsDragging(false);
      setDragOffset(0);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const discussionEndRef = useRef(null);

  const hasFutureStartDate = false;
  const isInQueue = columnTitle === 'In Queue';

  useEffect(() => {
    discussionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.comments]);

  const handleSave = (andClose = true) => {
    onSave({
      ...task,
      title,
      description,
      agent,
      priority,
      dueDate,
      dueTime,
      deliveryMethod,
      thinkingLevel,
      tags,
    });
    if (andClose) onClose();
  };

  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  const autoResizeInput = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleAddMessage = () => {
    if (newMessage.trim() === '') return;

    const newComment = {
      text: newMessage,
      author: 'Chris',
      timestamp: new Date().toISOString(),
    };
    // Include all local state so unsaved field edits aren't lost on send
    onSave({
      ...task,
      title,
      description,
      agent,
      priority,
      dueDate,
      dueTime,
      deliveryMethod,
      thinkingLevel,
      tags,
      comments: [...(task.comments || []), newComment],
    });
    setNewMessage('');
    // Reset textarea height after clearing
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            fileName: file.name,
            data: reader.result,
          }),
        });
        const result = await res.json();
        if (result.ok) {
          const isImage = file.type.startsWith('image/');
          const attachment = {
            name: result.fileName,
            url: result.url,
            localPath: result.localPath,
            type: file.type,
            size: file.size,
            isImage,
          };

          // Add as chat message with attachment
          const newComment = {
            text: newMessage.trim() || `📎 ${result.fileName}`,
            author: 'Chris',
            timestamp: new Date().toISOString(),
            attachment,
          };

          // Also add to task-level attachments
          const updatedAttachments = [...(task.attachments || []), attachment];

          onSave({
            ...task,
            comments: [...(task.comments || []), newComment],
            attachments: updatedAttachments,
          });
          setNewMessage('');
        } else {
          alert('Upload failed: ' + result.error);
        }
      } catch (err) {
        alert('Upload error: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const toggleTag = (tag) => {
    setTags(prevTags =>
      prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag]
    );
  };

  const getCategoryPillStyle = (category) => {
    const defaults = {
      'Bug': '#EF4444',
      'Feature': '#10B981',
      'Research': '#A78BFA',
      'Admin': '#A78BFA',
      'Urgent': '#F59E0B',
    };
    const color = (taskColors && taskColors[category]) || defaults[category] || '#8B949E';
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
          <div className={`sidebar-container ${sidebarOpen ? 'sidebar-container--open' : ''}`}>
            <div className={`modal-sidebar ${sidebarOpen ? 'modal-sidebar--open' : ''}`}>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="textarea-field"
                  rows="3"
                  placeholder="Add a more detailed description..."
                />
              </div>
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
            <button
              className="sidebar-tab"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Hide card details' : 'Show card details'}
            >
              <span className="sidebar-tab-label">Card Details</span>
            </button>
          </div>
          <div className="modal-main">
            {/* DISCUSSION THREAD */}
            <div className="discussion-section">
              {/* Agent avatar + name header */}
              {(() => {
                const activeAgent = agent || task.agent;
                const AgentIcon = agentIconMap[activeAgent];
                return (
                  <div className="discussion-agent-header">
                    {AgentIcon && (
                      <div className="discussion-agent-avatar">
                        <AgentIcon size={20} strokeWidth={1.5} />
                      </div>
                    )}
                    <h4 className="discussion-title">{activeAgent || 'Conversation'}</h4>
                  </div>
                );
              })()}
              <div className="discussion-thread" onMouseDown={handleChatMouseDown}>
                <div
                  className="chat-messages"
                  style={{
                    transform: `translateX(${dragOffset}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease',
                  }}
                >
                  {(task.comments || []).length === 0 ? (
                    <p className="empty-state">No messages yet. Start the conversation!</p>
                  ) : (
                    (task.comments || []).map((msg, index) => {
                      const isChris = msg.author === 'Chris';
                      return (
                        <div key={index} className={`chat-row ${isChris ? 'chat-right' : 'chat-left'}`}>
                          <div className={`chat-bubble ${isChris ? 'bubble-chris' : 'bubble-agent'}`}>
                            <p className="chat-text">{msg.text || msg.message}</p>
                            {msg.attachment && msg.attachment.isImage && (
                              <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="chat-attachment-img">
                                <img src={msg.attachment.url} alt={msg.attachment.name} />
                              </a>
                            )}
                            {msg.attachment && !msg.attachment.isImage && (
                              <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="chat-attachment-file">
                                <FileText size={14} />
                                <span>{msg.attachment.name}</span>
                              </a>
                            )}
                          </div>
                          <span className="chat-time">{(() => {
                            const d = new Date(msg.timestamp);
                            const now = new Date();
                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                            const diffDays = Math.round((today - msgDay) / 86400000);
                            const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            if (diffDays === 0) return t;
                            if (diffDays === 1) return `Yesterday ${t}`;
                            return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${t}`;
                          })()}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={discussionEndRef} />
                </div>
              </div>
              <div className="discussion-input-area">
                <div className="message-input-wrapper">
                  <button onClick={() => fileInputRef.current?.click()} className="attach-button-inlay" title="Attach file">
                    <Paperclip size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
                  />
                  <textarea
                    ref={messageInputRef}
                    rows={1}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      autoResizeInput(e.target);
                    }}
                    placeholder="Type a message..."
                    className="message-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddMessage();
                      }
                    }}
                  />
                  <button onClick={handleAddMessage} className="send-button-inlay">
                    <Send size={14} />
                  </button>
                </div>
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
          <div className="footer-right">
            <button onClick={() => handleSave(false)} className="btn-secondary">Save</button>
            <button onClick={() => handleSave(true)} className="btn-primary">Save &amp; Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
