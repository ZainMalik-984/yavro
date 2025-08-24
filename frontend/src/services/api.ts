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
  SpinnerResponse 
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const registerUser = async (file: File, userData: UserCreate): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', userData.name);
  formData.append('email', userData.email);
  formData.append('address', userData.address);
  
  const response = await api.post('/register/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const checkoutUser = async (userId: number): Promise<CheckoutResponse> => {
  const response = await api.post(`/checkout/${userId}/`);
  return response.data;
};

export const getUser = async (userId: number): Promise<User> => {
  const response = await api.get(`/user/${userId}`);
  return response.data;
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

export const updateTier = async (tierId: number, tier: TierCreate): Promise<Tier> => {
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

export const updateReward = async (rewardId: number, reward: RewardCreate): Promise<Reward> => {
  const response = await api.put(`/rewards/${rewardId}`, reward);
  return response.data;
};

export const deleteReward = async (rewardId: number): Promise<void> => {
  await api.delete(`/rewards/${rewardId}`);
};

// Spinner option management API functions
export const getSpinnerOptionsByReward = async (rewardId: number): Promise<SpinnerOption[]> => {
  const response = await api.get(`/spinner-options/reward/${rewardId}`);
  return response.data;
};

export const createSpinnerOption = async (rewardId: number, option: SpinnerOptionCreate): Promise<SpinnerOption> => {
  const response = await api.post(`/spinner-options/reward/${rewardId}`, option);
  return response.data;
};

export const updateSpinnerOption = async (optionId: number, option: SpinnerOptionCreate): Promise<SpinnerOption> => {
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

export const markUserRewardAsUsed = async (userRewardId: number): Promise<UserReward> => {
  const response = await api.put(`/user-rewards/${userRewardId}/use`);
  return response.data;
};

// Spinner API functions
export const spinReward = async (request: SpinnerRequest): Promise<SpinnerResponse> => {
  const response = await api.post('/spin-reward/', request);
  return response.data;
};
