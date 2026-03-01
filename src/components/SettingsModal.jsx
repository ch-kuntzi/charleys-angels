import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import './SettingsModal.css';

const SettingsModal = ({ categories, onUpdateCategories, columns = {}, columnOrder = [], onRenameColumn, onDeleteColumn, onClose }) => {
    const [localCategories, setLocalCategories] = useState([...categories]);
    const [newCategory, setNewCategory] = useState('');

    const handleAddCategory = () => {
        const trimmed = newCategory.trim();
        if (trimmed && !localCategories.includes(trimmed)) {
            setLocalCategories([...localCategories, trimmed]);
            setNewCategory('');
        }
    };

    const handleRemoveCategory = (cat) => {
        setLocalCategories(localCategories.filter(c => c !== cat));
    };

    const handleSave = () => {
        onUpdateCategories(localCategories);
        onClose();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>

                <div className="settings-body">
                    {/* COLUMNS SECTION */}
                    <div className="settings-section">
                        <h3>Columns</h3>
                        <p className="settings-hint">Rename or remove board columns. Columns with tasks cannot be deleted.</p>

                        <div className="category-list">
                            {columnOrder.map((colId) => {
                                const col = columns[colId];
                                if (!col) return null;
                                return (
                                    <ColumnItem
                                        key={colId}
                                        column={col}
                                        onRename={(newTitle) => onRenameColumn(colId, newTitle)}
                                        onDelete={() => onDeleteColumn(colId)}
                                        hasItems={col.taskIds.length > 0}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <hr className="settings-divider" />

                    {/* CATEGORIES SECTION */}
                    <div className="settings-section">
                        <h3>Categories</h3>
                        <p className="settings-hint">Manage task categories used across the dashboard.</p>

                        <div className="category-list">
                            {localCategories.map((cat) => (
                                <div key={cat} className="category-item">
                                    <span>{cat}</span>
                                    <button
                                        className="remove-category-btn"
                                        onClick={() => handleRemoveCategory(cat)}
                                        title="Remove category"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="add-category-row">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="New category name..."
                                className="add-category-input"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                            />
                            <button onClick={handleAddCategory} className="add-category-btn">
                                <Plus size={14} />
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                <div className="settings-footer">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn-primary">Save Settings</button>
                </div>
            </div>
        </div>
    );
};

/* Inline-editable column item */
const ColumnItem = ({ column, onRename, onDelete, hasItems }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(column.title);

    const handleSave = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== column.title) {
            onRename(trimmed);
        }
        setIsEditing(false);
    };

    return (
        <div className="category-item">
            {isEditing ? (
                <input
                    className="column-edit-inline"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') { setEditValue(column.title); setIsEditing(false); }
                    }}
                    autoFocus
                />
            ) : (
                <span
                    className="column-name-editable"
                    onClick={() => { setEditValue(column.title); setIsEditing(true); }}
                    title="Click to rename"
                >
                    {column.title}
                    {hasItems && <span className="column-task-count">{column.taskIds.length}</span>}
                </span>
            )}
            <button
                className="remove-category-btn"
                onClick={onDelete}
                title={hasItems ? "Remove tasks first" : "Delete column"}
                style={{ opacity: hasItems ? 0.3 : 1, cursor: hasItems ? 'not-allowed' : 'pointer' }}
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};

export default SettingsModal;
