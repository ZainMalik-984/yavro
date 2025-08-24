import React, { useState, useEffect } from 'react';
import { Reward, RewardCreate, Tier } from '../types';
import {
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  getTiers,
} from '../services/api';
import './RewardManagement.css';

const RewardManagement: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState<RewardCreate>({
    tier_id: 0,
    name: '',
    reward_type: 'free_coffee',
    value: 0,
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rewardsData, tiersData] = await Promise.all([
        getRewards(),
        getTiers(),
      ]);
      setRewards(rewardsData);
      setTiers(tiersData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReward) {
        await updateReward(editingReward.id, formData);
        alert('Reward updated successfully!');
      } else {
        await createReward(formData);
        alert('Reward created successfully!');
      }
      setShowForm(false);
      setEditingReward(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving reward:', error);
      alert('Failed to save reward');
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      tier_id: reward.tier_id,
      name: reward.name,
      reward_type: reward.reward_type,
      value: reward.value || 0,
      description: reward.description || '',
      is_active: reward.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (rewardId: number) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      try {
        await deleteReward(rewardId);
        alert('Reward deleted successfully!');
        loadData();
      } catch (error) {
        console.error('Error deleting reward:', error);
        alert('Failed to delete reward');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tier_id: 0,
      name: '',
      reward_type: 'free_coffee',
      value: 0,
      description: '',
      is_active: true,
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReward(null);
    resetForm();
  };

  const getTierName = (tierId: number) => {
    const tier = tiers.find(t => t.id === tierId);
    return tier ? tier.name : 'Unknown Tier';
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'free_coffee':
        return 'Free Coffee';
      case 'discount':
        return 'Discount';
      case 'spinner':
        return 'Spinner';
      default:
        return type;
    }
  };

  if (loading) {
    return <div className='loading'>Loading rewards...</div>;
  }

  return (
    <div className='reward-management'>
      <div className='reward-header'>
        <h2>Reward Management</h2>
        <button className='add-button' onClick={() => setShowForm(true)}>
          Add New Reward
        </button>
      </div>

      {showForm && (
        <div className='form-overlay'>
          <div className='form-container'>
            <h3>{editingReward ? 'Edit Reward' : 'Add New Reward'}</h3>
            <form onSubmit={handleSubmit}>
              <div className='form-group'>
                <label htmlFor='tier_id'>Tier:</label>
                <select
                  id='tier_id'
                  value={formData.tier_id}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      tier_id: parseInt(e.target.value),
                    })
                  }
                  required
                >
                  <option value={0}>Select a tier</option>
                  {tiers.map(tier => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} ({tier.visit_requirement} visits)
                    </option>
                  ))}
                </select>
              </div>

              <div className='form-group'>
                <label htmlFor='name'>Reward Name:</label>
                <input
                  type='text'
                  id='name'
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className='form-group'>
                <label htmlFor='reward_type'>Reward Type:</label>
                <select
                  id='reward_type'
                  value={formData.reward_type}
                  onChange={e =>
                    setFormData({ ...formData, reward_type: e.target.value })
                  }
                  required
                >
                  <option value='free_coffee'>Free Coffee</option>
                  <option value='discount'>Discount</option>
                  <option value='spinner'>Spinner</option>
                </select>
              </div>

              {formData.reward_type === 'discount' && (
                <div className='form-group'>
                  <label htmlFor='value'>Discount Percentage:</label>
                  <input
                    type='number'
                    id='value'
                    value={formData.value}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        value: parseFloat(e.target.value),
                      })
                    }
                    min='1'
                    max='100'
                    step='0.1'
                    required
                  />
                </div>
              )}

              <div className='form-group'>
                <label htmlFor='description'>Description:</label>
                <textarea
                  id='description'
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className='form-group'>
                <label>
                  <input
                    type='checkbox'
                    checked={formData.is_active}
                    onChange={e =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  Active
                </label>
              </div>

              <div className='form-actions'>
                <button type='submit' className='save-button'>
                  {editingReward ? 'Update' : 'Create'}
                </button>
                <button
                  type='button'
                  className='cancel-button'
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className='rewards-list'>
        {rewards.length === 0 ? (
          <p className='no-data'>No rewards found. Create your first reward!</p>
        ) : (
          <div className='rewards-grid'>
            {rewards.map(reward => (
              <div key={reward.id} className='reward-card'>
                <div className='reward-header'>
                  <h3>{reward.name}</h3>
                  <span
                    className={`status ${reward.is_active ? 'active' : 'inactive'}`}
                  >
                    {reward.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className='reward-details'>
                  <p>
                    <strong>Tier:</strong> {getTierName(reward.tier_id)}
                  </p>
                  <p>
                    <strong>Type:</strong>{' '}
                    {getRewardTypeLabel(reward.reward_type)}
                  </p>
                  {reward.value && (
                    <p>
                      <strong>Value:</strong> {reward.value}%
                    </p>
                  )}
                  {reward.description && (
                    <p>
                      <strong>Description:</strong> {reward.description}
                    </p>
                  )}
                  <p>
                    <strong>Created:</strong>{' '}
                    {new Date(reward.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className='reward-actions'>
                  <button
                    className='edit-button'
                    onClick={() => handleEdit(reward)}
                  >
                    Edit
                  </button>
                  <button
                    className='delete-button'
                    onClick={() => handleDelete(reward.id)}
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

export default RewardManagement;
