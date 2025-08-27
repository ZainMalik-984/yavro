import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUser, deleteUser } from '../services/api';
import { User } from '../types';
import {
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    address: '',
    phone_number: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      address: user.address,
      phone_number: user.phone_number,
    });
    setShowEditModal(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      const updatedUser = await updateUser(editingUser.id, editForm);
      setUsers(
        users.map(user => (user.id === editingUser.id ? updatedUser : user))
      );
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.detail || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      await deleteUser(userToDelete.id);
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className='user-management'>
        <div className='loading-container'>
          <div className='loading-spinner'>
            <RefreshIcon sx={{ fontSize: 40 }} />
          </div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='user-management'>
      <div className='user-management-header'>
        <h2>
          <PeopleIcon
            sx={{ fontSize: 28, marginRight: 1, verticalAlign: 'middle' }}
          />
          User Management
        </h2>
        <p>Manage all registered users and their information</p>
      </div>

      {error && (
        <div className='error-message'>
          <p>{error}</p>
          <button onClick={() => setError('')}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      )}

      <div className='users-table-container'>
        <table className='users-table'>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Visits</th>
              <th>Tier</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone_number || 'N/A'}</td>
                <td>{user.address}</td>
                <td>
                  <span className='visit-count'>{user.visit_count || 0}</span>
                </td>
                <td>
                  <span className='tier-badge'>
                    Tier {user.current_tier || 1}
                  </span>
                </td>
                <td>{user.created_at ? formatDate(user.created_at) : 'N/A'}</td>
                <td>
                  <div className='action-buttons'>
                    <button
                      className='edit-button'
                      onClick={() => handleEdit(user)}
                      title='Edit User'
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                      className='delete-button'
                      onClick={() => handleDelete(user)}
                      title='Delete User'
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !loading && (
          <div className='no-users'>
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className='modal-overlay'>
          <div className='modal'>
            <div className='modal-header'>
              <h3>Edit User</h3>
              <button
                className='close-button'
                onClick={() => setShowEditModal(false)}
              >
                <CloseIcon sx={{ fontSize: 24 }} />
              </button>
            </div>
            <div className='modal-content'>
              <div className='form-group'>
                <label htmlFor='edit-name'>Name</label>
                <input
                  type='text'
                  id='edit-name'
                  value={editForm.name}
                  onChange={e =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div className='form-group'>
                <label htmlFor='edit-email'>Email</label>
                <input
                  type='email'
                  id='edit-email'
                  value={editForm.email}
                  onChange={e =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>
              <div className='form-group'>
                <label htmlFor='edit-address'>Address</label>
                <input
                  type='text'
                  id='edit-address'
                  value={editForm.address}
                  onChange={e =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                />
              </div>
              <div className='form-group'>
                <label htmlFor='edit-phone'>Phone Number</label>
                <input
                  type='tel'
                  id='edit-phone'
                  value={editForm.phone_number}
                  onChange={e =>
                    setEditForm({ ...editForm, phone_number: e.target.value })
                  }
                />
              </div>
            </div>
            <div className='modal-actions'>
              <button
                className='cancel-button'
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className='save-button'
                onClick={handleUpdateUser}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className='modal-overlay'>
          <div className='modal'>
            <div className='modal-header'>
              <h3>Delete User</h3>
              <button
                className='close-button'
                onClick={() => setShowDeleteModal(false)}
              >
                <CloseIcon sx={{ fontSize: 24 }} />
              </button>
            </div>
            <div className='modal-content'>
              <p>
                Are you sure you want to delete{' '}
                <strong>{userToDelete.name}</strong>?
              </p>
              <p className='warning'>
                ⚠️ This action cannot be undone. All user data including visits
                and rewards will be permanently deleted.
              </p>
            </div>
            <div className='modal-actions'>
              <button
                className='cancel-button'
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className='delete-confirm-button'
                onClick={handleConfirmDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
