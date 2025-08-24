from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    name: str
    email: str
    address: str

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    visit_count: Optional[int] = 0
    current_tier: Optional[int] = 1
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        # Exclude the face_encoding field from serialization since it contains binary data
        exclude = {"face_encoding"}

class VisitBase(BaseModel):
    user_id: int

class VisitCreate(VisitBase):
    pass

class Visit(VisitBase):
    id: int
    visit_datetime: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class CheckoutResponse(BaseModel):
    success: bool
    message: str
    visit: Optional[Visit] = None
    user: Optional[User] = None
    reward_earned: Optional[dict] = None

# Tier schemas
class TierBase(BaseModel):
    name: str
    visit_requirement: int
    description: Optional[str] = None
    is_active: bool = True

class TierCreate(TierBase):
    pass

class Tier(TierBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Spinner Option schemas
class SpinnerOptionBase(BaseModel):
    name: str
    reward_type: str
    value: Optional[float] = None
    probability: float = 1.0
    description: Optional[str] = None
    is_active: bool = True

class SpinnerOptionCreate(SpinnerOptionBase):
    pass

class SpinnerOption(SpinnerOptionBase):
    id: int
    reward_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Reward schemas
class RewardBase(BaseModel):
    name: str
    reward_type: str
    value: Optional[float] = None
    description: Optional[str] = None
    is_active: bool = True

class RewardCreate(RewardBase):
    tier_id: int

class Reward(RewardBase):
    id: int
    tier_id: int
    created_at: datetime
    spinner_options: List[SpinnerOption] = []
    
    class Config:
        from_attributes = True

# User Reward schemas
class UserRewardBase(BaseModel):
    reward_type: str
    value: Optional[float] = None
    is_used: bool = False

class UserRewardCreate(UserRewardBase):
    user_id: int
    reward_id: int
    visit_id: int
    spinner_option_id: Optional[int] = None

class UserReward(UserRewardBase):
    id: int
    user_id: int
    reward_id: int
    visit_id: int
    spinner_option_id: Optional[int] = None
    used_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Spinner schemas
class SpinnerRequest(BaseModel):
    user_id: int
    reward_id: int
    visit_id: int

class SpinnerResponse(BaseModel):
    success: bool
    message: str
    selected_option: Optional[SpinnerOption] = None
    user_reward: Optional[UserReward] = None
