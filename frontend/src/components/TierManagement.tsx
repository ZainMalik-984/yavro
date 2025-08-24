import React, { useState, useEffect } from 'react';
import { Tier, TierCreate } from '../types';
import { getTiers, createTier, updateTier, deleteTier } from '../services/api';
import './TierManagement.css';

const TierManagement: React.FC = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [formData, setFormData] = useState<TierCreate>({
    name: '',
    visit_requirement: 0,
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      setLoading(true);
      const data = await getTiers();
      setTiers(data);
    } catch (error) {
      console.error('Error loading tiers:', error);
      alert('Failed to load tiers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTier) {
        await updateTier(editingTier.id, formData);
        alert('Tier updated successfully!');
      } else {
        await createTier(formData);
        alert('Tier created successfully!');
      }
      setShowForm(false);
      setEditingTier(null);
      resetForm();
      loadTiers();
    } catch (error) {
      console.error('Error saving tier:', error);
      alert('Failed to save tier');
    }
  };

  const handleEdit = (tier: Tier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      visit_requirement: tier.visit_requirement,
      description: tier.description || '',
      is_active: tier.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (tierId: number) => {
    if (window.confirm('Are you sure you want to delete this tier?')) {
      try {
        await deleteTier(tierId);
        alert('Tier deleted successfully!');
        loadTiers();
      } catch (error) {
        console.error('Error deleting tier:', error);
        alert('Failed to delete tier');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      visit_requirement: 0,
      description: '',
      is_active: true
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTier(null);
    resetForm();
  };

  if (loading) {
    return <div className="loading">Loading tiers...</div>;
  }

  return (
    <div className="tier-management">
      <div className="tier-header">
        <h2>Tier Management</h2>
        <button 
          className="add-button"
          onClick={() => setShowForm(true)}
        >
          Add New Tier
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>{editingTier ? 'Edit Tier' : 'Add New Tier'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Tier Name:</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="visit_requirement">Visit Requirement:</label>
                <input
                  type="number"
                  id="visit_requirement"
                  value={formData.visit_requirement}
                  onChange={(e) => setFormData({...formData, visit_requirement: parseInt(e.target.value)})}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  Active
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-button">
                  {editingTier ? 'Update' : 'Create'}
                </button>
                <button type="button" className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tiers-list">
        {tiers.length === 0 ? (
          <p className="no-data">No tiers found. Create your first tier!</p>
        ) : (
          <div className="tiers-grid">
            {tiers.map((tier) => (
              <div key={tier.id} className="tier-card">
                <div className="tier-header">
                  <h3>{tier.name}</h3>
                  <span className={`status ${tier.is_active ? 'active' : 'inactive'}`}>
                    {tier.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="tier-details">
                  <p><strong>Visit Requirement:</strong> {tier.visit_requirement}</p>
                  {tier.description && (
                    <p><strong>Description:</strong> {tier.description}</p>
                  )}
                  <p><strong>Created:</strong> {new Date(tier.created_at).toLocaleDateString()}</p>
                </div>
                <div className="tier-actions">
                  <button 
                    className="edit-button"
                    onClick={() => handleEdit(tier)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(tier.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TierManagement;
