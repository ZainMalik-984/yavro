export interface User {
  id: number;
  name: string;
  email: string;
  address: string;
  visit_count: number;
  current_tier: number;
  created_at?: string;
}

export interface UserCreate {
  name: string;
  email: string;
  address: string;
}

export interface Visit {
  id: number;
  user_id: number;
  visit_datetime: string;
  created_at: string;
}

export interface CheckoutResponse {
  success: boolean;
  message: string;
  visit?: Visit;
  user?: User;
  reward_earned?: RewardEarned;
}

export interface RewardEarned {
  type: 'free_coffee' | 'discount' | 'spinner';
  reward_id: number;
  user_reward_id?: number;
  tier_name: string;
  discount_percentage?: number;
  message: string;
}

// Tier system types
export interface Tier {
  id: number;
  name: string;
  visit_requirement: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface TierCreate {
  name: string;
  visit_requirement: number;
  description?: string;
  is_active: boolean;
}

export interface SpinnerOption {
  id: number;
  reward_id: number;
  name: string;
  reward_type: string;
  value?: number;
  probability: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface SpinnerOptionCreate {
  name: string;
  reward_type: string;
  value?: number;
  probability: number;
  description?: string;
  is_active: boolean;
}

export interface Reward {
  id: number;
  tier_id: number;
  name: string;
  reward_type: string;
  value?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  spinner_options: SpinnerOption[];
}

export interface RewardCreate {
  tier_id: number;
  name: string;
  reward_type: string;
  value?: number;
  description?: string;
  is_active: boolean;
}

export interface UserReward {
  id: number;
  user_id: number;
  reward_id: number;
  visit_id: number;
  spinner_option_id?: number;
  reward_type: string;
  value?: number;
  is_used: boolean;
  used_at?: string;
  created_at: string;
}

export interface SpinnerRequest {
  user_id: number;
  reward_id: number;
  visit_id: number;
}

export interface SpinnerResponse {
  success: boolean;
  message: string;
  selected_option?: SpinnerOption;
  user_reward?: UserReward;
}
