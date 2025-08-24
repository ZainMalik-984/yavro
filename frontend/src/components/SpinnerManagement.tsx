import React, { useState, useEffect } from 'react';
import { SpinnerOption, SpinnerOptionCreate, Reward } from '../types';
import { getSpinnerOptionsByReward, createSpinnerOption, updateSpinnerOption, deleteSpinnerOption, getRewards } from '../services/api';
import './SpinnerManagement.css';

const SpinnerManagement: React.FC = () => {
  const [spinnerOptions, setSpinnerOptions] = useState<SpinnerOption[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedReward, setSelectedReward] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOption, setEditingOption] = useState<SpinnerOption | null>(null);
  const [formData, setFormData] = useState<SpinnerOptionCreate>({
    name: '',
    reward_type: 'free_coffee',
    value: 0,
    probability: 1.0,
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadRewards();
  }, []);

  useEffect(() => {
    if (selectedReward > 0) {
      loadSpinnerOptions();
    } else {
      setSpinnerOptions([]);
    }
  }, [selectedReward]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const rewardsData = await getRewards();
      const spinnerRewards = rewardsData.filter(reward => reward.reward_type === 'spinner');
      setRewards(spinnerRewards);
      if (spinnerRewards.length > 0) {
        setSelectedReward(spinnerRewards[0].id);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
      alert('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const loadSpinnerOptions = async () => {
    try {
      const options = await getSpinnerOptionsByReward(selectedReward);
      setSpinnerOptions(options);
    } catch (error) {
      console.error('Error loading spinner options:', error);
      alert('Failed to load spinner options');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOption) {
        await updateSpinnerOption(editingOption.id, formData);
        alert('Spinner option updated successfully!');
      } else {
        await createSpinnerOption(selectedReward, formData);
        alert('Spinner option created successfully!');
      }
      setShowForm(false);
      setEditingOption(null);
      resetForm();
      loadSpinnerOptions();
    } catch (error) {
      console.error('Error saving spinner option:', error);
      alert('Failed to save spinner option');
    }
  };

  const handleEdit = (option: SpinnerOption) => {
    setEditingOption(option);
    setFormData({
      name: option.name,
      reward_type: option.reward_type,
      value: option.value || 0,
      probability: option.probability,
      description: option.description || '',
      is_active: option.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (optionId: number) => {
    if (window.confirm('Are you sure you want to delete this spinner option?')) {
      try {
        await deleteSpinnerOption(optionId);
        alert('Spinner option deleted successfully!');
        loadSpinnerOptions();
      } catch (error) {
        console.error('Error deleting spinner option:', error);
        alert('Failed to delete spinner option');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      reward_type: 'free_coffee',
      value: 0,
      probability: 1.0,
      description: '',
      is_active: true
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOption(null);
    resetForm();
  };

  const getRewardName = (rewardId: number) => {
    const reward = rewards.find(r => r.id === rewardId);
    return reward ? reward.name : 'Unknown Reward';
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'free_coffee':
        return 'Free Coffee';
      case 'discount':
        return 'Discount';
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="loading">Loading spinner rewards...</div>;
  }

  if (rewards.length === 0) {
    return (
      <div className="spinner-management">
        <div className="spinner-header">
          <h2>Spinner Management</h2>
        </div>
        <div className="no-spinner-rewards">
          <p>No spinner rewards found. Create a reward with type "Spinner" first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-management">
      <div className="spinner-header">
        <h2>Spinner Management</h2>
        <div className="reward-selector">
          <label htmlFor="reward-select">Select Spinner Reward:</label>
          <select
            id="reward-select"
            value={selectedReward}
            onChange={(e) => setSelectedReward(parseInt(e.target.value))}
          >
            {rewards.map((reward) => (
              <option key={reward.id} value={reward.id}>
                {reward.name}
              </option>
            ))}
          </select>
        </div>
        <button 
          className="add-button"
          onClick={() => setShowForm(true)}
          disabled={selectedReward === 0}
        >
          Add Spinner Option
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>{editingOption ? 'Edit Spinner Option' : 'Add New Spinner Option'}</h3>
            <p className="reward-info">For: {getRewardName(selectedReward)}</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Option Name:</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reward_type">Reward Type:</label>
                <select
                  id="reward_type"
                  value={formData.reward_type}
                  onChange={(e) => setFormData({...formData, reward_type: e.target.value})}
                  required
                >
                  <option value="free_coffee">Free Coffee</option>
                  <option value="discount">Discount</option>
                </select>
              </div>

              {formData.reward_type === 'discount' && (
                <div className="form-group">
                  <label htmlFor="value">Discount Percentage:</label>
                  <input
                    type="number"
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})}
                    min="1"
                    max="100"
                    step="0.1"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="probability">Probability Weight:</label>
                <input
                  type="number"
                  id="probability"
                  value={formData.probability}
                  onChange={(e) => setFormData({...formData, probability: parseFloat(e.target.value)})}
                  min="0.1"
                  max="10"
                  step="0.1"
                  required
                />
                <small>Higher values = higher chance of being selected</small>
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
                  {editingOption ? 'Update' : 'Create'}
                </button>
                <button type="button" className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="spinner-options-list">
        <h3>Spinner Options for: {getRewardName(selectedReward)}</h3>
        {spinnerOptions.length === 0 ? (
          <p className="no-data">No spinner options found. Add your first option!</p>
        ) : (
          <div className="spinner-options-grid">
            {spinnerOptions.map((option) => (
              <div key={option.id} className="spinner-option-card">
                <div className="option-header">
                  <h4>{option.name}</h4>
                  <span className={`status ${option.is_active ? 'active' : 'inactive'}`}>
                    {option.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="option-details">
                  <p><strong>Type:</strong> {getRewardTypeLabel(option.reward_type)}</p>
                  {option.value && (
                    <p><strong>Value:</strong> {option.value}%</p>
                  )}
                  <p><strong>Probability:</strong> {option.probability}</p>
                  {option.description && (
                    <p><strong>Description:</strong> {option.description}</p>
                  )}
                  <p><strong>Created:</strong> {new Date(option.created_at).toLocaleDateString()}</p>
                </div>
                <div className="option-actions">
                  <button 
                    className="edit-button"
                    onClick={() => handleEdit(option)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(option.id)}
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

export default SpinnerManagement;
