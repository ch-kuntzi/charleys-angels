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

// Convert hue (0-360) to hex color at 65% sat, 55% lightness
const hueToHex = (hue) => {
    const h = hue / 360;
    const s = 0.65;
    const l = 0.55;
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Estimate hue from a hex color
const hexToHue = (hex) => {
    if (!hex) return 0;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return 0;
    let h;
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return Math.round(h * 360);
};

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

    const handleHueChange = (category, hue) => {
        const hex = hueToHex(parseInt(hue));
        setLocalTaskColors(prev => ({ ...prev, [category]: hex }));
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
                        hint="Manage categories and their colors. Colors sync with task card tags."
                    >
                        <div className="category-list">
                            {localCategories.map((cat) => {
                                const color = getColor(cat, localTaskColors);
                                const hue = hexToHue(color);
                                return (
                                    <div key={cat} className="category-item category-color-item">
                                        <div className="category-row-top">
                                            <span className="category-name" style={{ color }}>{cat}</span>
                                            <button
                                                className="remove-category-btn"
                                                onClick={() => handleRemoveCategory(cat)}
                                                title="Remove category"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="color-slider-row">
                                            <input
                                                type="range"
                                                min="0"
                                                max="360"
                                                value={hue}
                                                onChange={(e) => handleHueChange(cat, e.target.value)}
                                                className="hue-slider"
                                                style={{ '--thumb-color': color }}
                                            />
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
