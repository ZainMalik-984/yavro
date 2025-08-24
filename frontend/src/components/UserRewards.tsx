import React, { useState, useEffect } from 'react';
import { UserReward, User } from '../types';
import { getUserRewards, markUserRewardAsUsed, getUser } from '../services/api';
import './UserRewards.css';

const UserRewards: React.FC = () => {
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId > 0) {
      loadUserRewards();
      loadUserDetails();
    } else {
      setUserRewards([]);
      setUserDetails(null);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // For now, we'll use a mock approach since we don't have a get all users endpoint
      // In a real app, you'd have an endpoint to get all users
      const mockUsers: User[] = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          address: '123 Main St',
          visit_count: 5,
          current_tier: 5,
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          address: '456 Oak Ave',
          visit_count: 12,
          current_tier: 10,
        },
        {
          id: 3,
          name: 'Bob Johnson',
          email: 'bob@example.com',
          address: '789 Pine Rd',
          visit_count: 18,
          current_tier: 15,
        },
      ];
      setUsers(mockUsers);
      if (mockUsers.length > 0) {
        setSelectedUserId(mockUsers[0].id);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRewards = async () => {
    try {
      const rewards = await getUserRewards(selectedUserId);
      setUserRewards(rewards);
    } catch (error) {
      console.error('Error loading user rewards:', error);
      alert('Failed to load user rewards');
    }
  };

  const loadUserDetails = async () => {
    try {
      const user = await getUser(selectedUserId);
      setUserDetails(user);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const handleUseReward = async (userRewardId: number) => {
    if (window.confirm('Are you sure you want to mark this reward as used?')) {
      try {
        await markUserRewardAsUsed(userRewardId);
        alert('Reward marked as used successfully!');
        loadUserRewards();
      } catch (error) {
        console.error('Error using reward:', error);
        alert('Failed to mark reward as used');
      }
    }
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

  const getRewardValue = (reward: UserReward) => {
    if (reward.reward_type === 'discount' && reward.value) {
      return `${reward.value}%`;
    }
    return reward.reward_type === 'free_coffee' ? 'Free' : 'N/A';
  };

  if (loading) {
    return <div className='loading'>Loading users...</div>;
  }

  if (users.length === 0) {
    return (
      <div className='user-rewards'>
        <div className='user-rewards-header'>
          <h2>User Rewards</h2>
        </div>
        <div className='no-users'>
          <p>No users found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='user-rewards'>
      <div className='user-rewards-header'>
        <h2>User Rewards</h2>
        <div className='user-selector'>
          <label htmlFor='user-select'>Select User:</label>
          <select
            id='user-select'
            value={selectedUserId}
            onChange={e => setSelectedUserId(parseInt(e.target.value))}
          >
            <option value={0}>Select a user</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} (Tier {user.current_tier}, {user.visit_count}{' '}
                visits)
              </option>
            ))}
          </select>
        </div>
      </div>

      {userDetails && (
        <div className='user-details'>
          <h3>User Information</h3>
          <div className='user-info'>
            <p>
              <strong>Name:</strong> {userDetails.name}
            </p>
            <p>
              <strong>Email:</strong> {userDetails.email}
            </p>
            <p>
              <strong>Current Tier:</strong> {userDetails.current_tier}
            </p>
            <p>
              <strong>Total Visits:</strong> {userDetails.visit_count}
            </p>
          </div>
        </div>
      )}

      <div className='rewards-list'>
        <h3>Reward History</h3>
        {userRewards.length === 0 ? (
          <p className='no-data'>No rewards found for this user.</p>
        ) : (
          <div className='rewards-table'>
            <table>
              <thead>
                <tr>
                  <th>Reward Type</th>
                  <th>Value</th>
                  <th>Earned Date</th>
                  <th>Status</th>
                  <th>Used Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userRewards.map(reward => (
                  <tr
                    key={reward.id}
                    className={reward.is_used ? 'used' : 'unused'}
                  >
                    <td>{getRewardTypeLabel(reward.reward_type)}</td>
                    <td>{getRewardValue(reward)}</td>
                    <td>{new Date(reward.created_at).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`status ${reward.is_used ? 'used' : 'unused'}`}
                      >
                        {reward.is_used ? 'Used' : 'Available'}
                      </span>
                    </td>
                    <td>
                      {reward.used_at
                        ? new Date(reward.used_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      {!reward.is_used && (
                        <button
                          className='use-button'
                          onClick={() => handleUseReward(reward.id)}
                        >
                          Mark as Used
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRewards;
