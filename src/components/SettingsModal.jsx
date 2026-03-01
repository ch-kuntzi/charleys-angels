import React, { useState } from 'react';
import { X, Plus, Trash2, Heart } from 'lucide-react';
import './SettingsModal.css';

const SettingsModal = ({ categories, onUpdateCategories, onClose }) => {
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

export default SettingsModal;
