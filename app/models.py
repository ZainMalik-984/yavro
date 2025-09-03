from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float, Text, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone_number = Column(String)  # Phone number for SMS notifications
    face_encoding = Column(LargeBinary)  # Binary data type for face encodings
    visit_count = Column(Integer, default=0)  # Track total visits for rewards
    current_tier = Column(Integer, default=1)  # Current tier level
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to visits
    visits = relationship("Visit", back_populates="user")
    # Relationship to user rewards
    user_rewards = relationship("UserReward", back_populates="user")


class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="admin")  # "admin" or "pos"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Visit(Base):
    __tablename__ = "visits"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    visit_datetime = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to user
    user = relationship("User", back_populates="visits")


class Tier(Base):
    __tablename__ = "tiers"
    id = Column(Integer, primary_key=True, index=True)
    # e.g., "Bronze", "Silver", "Gold"
    name = Column(String, unique=True, index=True)
    visit_requirement = Column(Integer, unique=True)  # e.g., 5, 10, 15 visits
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to rewards
    rewards = relationship("Reward", back_populates="tier")


class Reward(Base):
    __tablename__ = "rewards"
    id = Column(Integer, primary_key=True, index=True)
    tier_id = Column(Integer, ForeignKey("tiers.id"))
    name = Column(String, index=True)  # e.g., "Free Coffee", "10% Discount"
    reward_type = Column(String)  # "free_coffee", "discount", "spinner"
    value = Column(Float, nullable=True)  # For discount percentage or amount
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to tier
    tier = relationship("Tier", back_populates="rewards")
    # Relationship to spinner options (if reward_type is "spinner")
    spinner_options = relationship("SpinnerOption", back_populates="reward")
    # Relationship to user rewards
    user_rewards = relationship("UserReward", back_populates="reward")


class SpinnerOption(Base):
    __tablename__ = "spinner_options"
    id = Column(Integer, primary_key=True, index=True)
    reward_id = Column(Integer, ForeignKey("rewards.id"))
    name = Column(String, index=True)  # e.g., "Free Coffee", "20% Discount"
    reward_type = Column(String)  # "free_coffee", "discount"
    value = Column(Float, nullable=True)  # For discount percentage or amount
    probability = Column(Float, default=1.0)  # Probability weight for spinning
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to reward
    reward = relationship("Reward", back_populates="spinner_options")


class UserReward(Base):
    __tablename__ = "user_rewards"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    reward_id = Column(Integer, ForeignKey("rewards.id"))
    spinner_option_id = Column(Integer, ForeignKey(
        "spinner_options.id"), nullable=True)
    visit_id = Column(Integer, ForeignKey("visits.id"))
    reward_type = Column(String)  # "free_coffee", "discount", "spinner"
    value = Column(Float, nullable=True)  # Actual value received
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="user_rewards")
    reward = relationship("Reward", back_populates="user_rewards")
    visit = relationship("Visit")
    spinner_option = relationship("SpinnerOption")


class AppSettings(Base):
    __tablename__ = "app_settings"
    id = Column(Integer, primary_key=True, index=True)
    cafe_name = Column(String, default="Yavro Cafe")
    cafe_logo_base64 = Column(Text, nullable=True)  # Base64 encoded logo
    cafe_tagline = Column(String, default="Brewing Connections, One Cup at a Time")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
