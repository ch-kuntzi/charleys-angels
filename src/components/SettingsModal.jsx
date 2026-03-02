import React, { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import './SettingsModal.css';

const DEFAULT_CATEGORY_COLORS = {
    'Bug': '#EF4444',
    'Feature': '#10B981',
    'Research': '#A78BFA',
    'Admin': '#A78BFA',
    'Urgent': '#F59E0B',
};

const AVAILABLE_COLORS = [
    { value: '#EF4444', label: 'Red' },
    { value: '#F97316', label: 'Orange' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#22C55E', label: 'Green' },
    { value: '#10B981', label: 'Emerald' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#6366F1', label: 'Indigo' },
    { value: '#8B5CF6', label: 'Violet' },
    { value: '#A78BFA', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#64748B', label: 'Slate' },
];

const getColor = (cat, customColors) => customColors[cat] || DEFAULT_CATEGORY_COLORS[cat] || '#8B949E';

const CollapsibleSection = ({ title, hint, defaultOpen = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="settings-section">
            <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <h3>{title}</h3>
            </div>
            {isOpen && (
                <div className="section-content">
                    {hint && <p className="settings-hint">{hint}</p>}
                    {children}
                </div>
            )}
        </div>
    );
};

const SettingsModal = ({ categories, onUpdateCategories, columns = {}, columnOrder = [], onRenameColumn, onDeleteColumn, taskColors = {}, onUpdateTaskColors, onClose }) => {
    const [localCategories, setLocalCategories] = useState([...categories]);
    const [newCategory, setNewCategory] = useState('');
    const [localTaskColors, setLocalTaskColors] = useState({ ...taskColors });

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

    const handleColorChange = (category, color) => {
        setLocalTaskColors(prev => ({ ...prev, [category]: color }));
    };

    const handleSave = () => {
        onUpdateCategories(localCategories);
        if (onUpdateTaskColors) onUpdateTaskColors(localTaskColors);
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
                    <CollapsibleSection
                        title={`Columns (${columnOrder.length})`}
                        hint="Click a column name to rename. Columns with tasks cannot be deleted."
                    >
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
                    </CollapsibleSection>

                    <hr className="settings-divider" />

                    {/* CATEGORIES SECTION */}
                    <CollapsibleSection
                        title={`Categories (${localCategories.length})`}
                        hint="Manage categories and their colors. Colors are reflected on task card tags."
                    >
                        <div className="category-list">
                            {localCategories.map((cat) => {
                                const color = getColor(cat, localTaskColors);
                                return (
                                    <div key={cat} className="category-item">
                                        <span className="category-name" style={{ color }}>{cat}</span>
                                        <div className="category-item-right">
                                            <div className="color-picker-row">
                                                {AVAILABLE_COLORS.map(c => (
                                                    <button
                                                        key={c.value}
                                                        className={`color-dot ${color === c.value ? 'active' : ''}`}
                                                        style={{ backgroundColor: c.value }}
                                                        onClick={() => handleColorChange(cat, c.value)}
                                                        title={c.label}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                className="remove-category-btn"
                                                onClick={() => handleRemoveCategory(cat)}
                                                title="Remove category"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
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
                    </CollapsibleSection>
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
