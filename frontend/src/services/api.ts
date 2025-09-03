import axios from 'axios';
import {
  User,
  UserCreate,
  CheckoutResponse,
  Tier,
  TierCreate,
  Reward,
  RewardCreate,
  SpinnerOption,
  SpinnerOptionCreate,
  UserReward,
  SpinnerRequest,
  SpinnerResponse,
  AdminUser,
  AdminUserCreate,
  AdminUserLogin,
  Token,
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth data on 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login or show login modal
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const recognizeUser = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/recognize/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getUserByPhone = async (phone: string): Promise<User> => {
  const response = await api.get(`/user/phone/${phone}`);
  return response.data;
};

export const registerUserWithoutImage = async (
  userData: UserCreate
): Promise<User> => {
  const response = await api.post('/register/no-image/', userData);
  return response.data;
};

export const registerUser = async (
  file: File,
  userData: UserCreate
): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', userData.name);
  formData.append('phone_number', userData.phone_number);

  const response = await api.post('/register/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const checkoutUser = async (
  userId: number
): Promise<CheckoutResponse> => {
  const response = await api.post(`/checkout/${userId}/`);
  return response.data;
};

export const getUser = async (userId: number): Promise<User> => {
  const response = await api.get(`/user/${userId}`);
  return response.data;
};

export const getAllUsers = async (
  skip: number = 0,
  limit: number = 100
): Promise<User[]> => {
  const response = await api.get(`/users/?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const updateUser = async (
  userId: number,
  userData: Partial<User>
): Promise<User> => {
  const response = await api.put(`/user/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: number): Promise<void> => {
  await api.delete(`/user/${userId}`);
};

// Tier management API functions
export const getTiers = async (): Promise<Tier[]> => {
  const response = await api.get('/tiers/');
  return response.data;
};

export const createTier = async (tier: TierCreate): Promise<Tier> => {
  const response = await api.post('/tiers/', tier);
  return response.data;
};

export const updateTier = async (
  tierId: number,
  tier: TierCreate
): Promise<Tier> => {
  const response = await api.put(`/tiers/${tierId}`, tier);
  return response.data;
};

export const deleteTier = async (tierId: number): Promise<void> => {
  await api.delete(`/tiers/${tierId}`);
};

// Reward management API functions
export const getRewards = async (): Promise<Reward[]> => {
  const response = await api.get('/rewards/');
  return response.data;
};

export const getRewardsByTier = async (tierId: number): Promise<Reward[]> => {
  const response = await api.get(`/rewards/tier/${tierId}`);
  return response.data;
};

export const createReward = async (reward: RewardCreate): Promise<Reward> => {
  const response = await api.post('/rewards/', reward);
  return response.data;
};

export const updateReward = async (
  rewardId: number,
  reward: RewardCreate
): Promise<Reward> => {
  const response = await api.put(`/rewards/${rewardId}`, reward);
  return response.data;
};

export const deleteReward = async (rewardId: number): Promise<void> => {
  await api.delete(`/rewards/${rewardId}`);
};

// Spinner option management API functions
export const getSpinnerOptionsByReward = async (
  rewardId: number
): Promise<SpinnerOption[]> => {
  const response = await api.get(`/spinner-options/reward/${rewardId}`);
  return response.data;
};

export const createSpinnerOption = async (
  rewardId: number,
  option: SpinnerOptionCreate
): Promise<SpinnerOption> => {
  const response = await api.post(
    `/spinner-options/reward/${rewardId}`,
    option
  );
  return response.data;
};

export const updateSpinnerOption = async (
  optionId: number,
  option: SpinnerOptionCreate
): Promise<SpinnerOption> => {
  const response = await api.put(`/spinner-options/${optionId}`, option);
  return response.data;
};

export const deleteSpinnerOption = async (optionId: number): Promise<void> => {
  await api.delete(`/spinner-options/${optionId}`);
};

// User reward API functions
export const getUserRewards = async (userId: number): Promise<UserReward[]> => {
  const response = await api.get(`/user-rewards/${userId}`);
  return response.data;
};

export const markUserRewardAsUsed = async (
  userRewardId: number
): Promise<UserReward> => {
  const response = await api.put(`/user-rewards/${userRewardId}/use`);
  return response.data;
};

// Spinner API functions
export const spinReward = async (
  request: SpinnerRequest
): Promise<SpinnerResponse> => {
  const response = await api.post('/spin-reward/', request);
  return response.data;
};

// App Settings API functions
export const getAppSettings = async () => {
  const response = await api.get('/app-settings/');
  return response.data;
};

export const updateAppSettings = async (settings: any) => {
  const response = await api.put('/app-settings/', settings);
  return response.data;
};

export const uploadCafeLogo = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/app-settings/upload-logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Authentication API functions
export const login = async (credentials: AdminUserLogin): Promise<Token> => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const registerAdminUser = async (userData: AdminUserCreate): Promise<AdminUser> => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async (): Promise<AdminUser> => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Admin-only API functions
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await api.get('/admin/admin-users/');
  return response.data;
};

export const createAdminUser = async (userData: AdminUserCreate): Promise<AdminUser> => {
  const response = await api.post('/admin/admin-users/', userData);
  return response.data;
};

export const updateAdminUser = async (userId: number, userData: AdminUserCreate): Promise<AdminUser> => {
  const response = await api.put(`/admin/admin-users/${userId}`, userData);
  return response.data;
};

export const deleteAdminUser = async (userId: number): Promise<void> => {
  await api.delete(`/admin/admin-users/${userId}`);
};

// Export the api instance for direct use
export { api };
