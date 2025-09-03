import React, { useState, useEffect } from 'react';
import {
  AdminPanelSettings,
  PersonAdd,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  Add,
  Close,
} from '@mui/icons-material';
import { AdminUser, AdminUserCreate } from '../types';
import { api } from '../services/api';
import './AppAdministration.css';

interface AppAdministrationProps {
  onClose: () => void;
}

const AppAdministration: React.FC<AppAdministrationProps> = ({ onClose }) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<AdminUserCreate>({
    username: '',
    email: '',
    password: '',
    role: 'pos',
  });

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/admin-users/');
      setAdminUsers(response.data);
    } catch (err: any) {
      setError('Failed to fetch admin users');
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (showEditForm && editingUser) {
        await api.put(`/admin/admin-users/${editingUser.id}`, formData);
      } else {
        await api.post('/admin/admin-users/', formData);
      }

      setShowCreateForm(false);
      setShowEditForm(false);
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'pos',
      });
      fetchAdminUsers();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || 'Operation failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this admin user?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/admin/admin-users/${userId}`);
      fetchAdminUsers();
    } catch (err: any) {
      setError('Failed to delete admin user');
      console.error('Error deleting admin user:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'pos',
    });
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingUser(null);
    setError('');
  };

  return (
    <div className="app-administration-overlay">
      <div className="app-administration-modal">
        <div className="modal-header">
          <h2>
            <AdminPanelSettings className="header-icon" />
            App Administration
          </h2>
          <button className="close-button" onClick={onClose}>
            <Close />
          </button>
        </div>

        <div className="modal-content">
          <div className="section-header">
            <h3>Admin Users</h3>
            <button
              className="add-button"
              onClick={() => {
                resetForm();
                setShowCreateForm(true);
              }}
              disabled={loading}
            >
              <Add />
              Add Admin User
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {showCreateForm && (
            <div className="form-section">
              <h4>Create New Admin User</h4>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="pos">POS User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="cancel-button"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showEditForm && (
            <div className="form-section">
              <h4>Edit Admin User</h4>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password (leave blank to keep current)</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="pos">POS User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="cancel-button"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="admin-users-list">
            {loading && !showCreateForm && !showEditForm ? (
              <div className="loading">Loading admin users...</div>
            ) : (
              <div className="users-grid">
                {adminUsers.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      <div className="user-header">
                        <h4>{user.username}</h4>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'admin' ? (
                            <Lock className="role-icon" />
                          ) : (
                            <LockOpen className="role-icon" />
                          )}
                          {user.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="user-email">{user.email}</p>
                      <p className="user-status">
                        Status: {user.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className="user-actions">
                      <button
                        onClick={() => handleEdit(user)}
                        className="edit-button"
                        title="Edit user"
                      >
                        <Edit />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="delete-button"
                        title="Delete user"
                      >
                        <Delete />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppAdministration;
