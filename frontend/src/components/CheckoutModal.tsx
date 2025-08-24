import React, { useState, useEffect } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CasinoIcon from '@mui/icons-material/Casino';
import { checkoutUser, getTiers, getRewardsByTier } from '../services/api';
import { User, Tier, Reward, SpinnerResponse, RewardEarned } from '../types';
import SpinnerWheel from './SpinnerWheel';
import './CheckoutModal.css';

interface CheckoutModalProps {
  user: User;
  onCheckoutComplete: () => void;
  onClose: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  user,
  onCheckoutComplete,
  onClose,
  isLoading,
  setIsLoading,
}) => {
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);
  const [nextTier, setNextTier] = useState<Tier | null>(null);
  const [eligibleReward, setEligibleReward] = useState<Reward | null>(null);
  const [isRewardEligible, setIsRewardEligible] = useState(false);
  const [visitsToNextReward, setVisitsToNextReward] = useState(0);
  const [showSpinner, setShowSpinner] = useState(false);
  const [spinnerRewardId, setSpinnerRewardId] = useState<number | null>(null);
  const [visitId, setVisitId] = useState<number | null>(null);
  const [earnedReward, setEarnedReward] = useState<RewardEarned | null>(null);

  const visitCount = user.visit_count || 0;

  useEffect(() => {
    loadTierData();
  }, [user]);

  const loadTierData = async () => {
    try {
      const tiersData = await getTiers();
      setTiers(tiersData);

      // Find current tier based on user's current_tier
      const current = tiersData.find(
        tier => tier.visit_requirement === user.current_tier
      );
      setCurrentTier(current || null);

      // Find next tier
      const next = tiersData
        .filter(tier => tier.visit_requirement > user.current_tier)
        .sort((a, b) => a.visit_requirement - b.visit_requirement)[0];
      setNextTier(next || null);

      // Check if this visit will earn a reward based on multiples of tier requirements
      let willEarnReward = false;
      let rewardTier = null;

      for (const tier of tiersData) {
        if ((visitCount + 1) % tier.visit_requirement === 0) {
          willEarnReward = true;
          rewardTier = tier;
          break;
        }
      }

      setIsRewardEligible(willEarnReward);

      if (willEarnReward && rewardTier) {
        // Load the reward for this tier
        const rewards = await getRewardsByTier(rewardTier.id);
        setEligibleReward(rewards[0] || null);
      }

      // Calculate visits to next reward (for display purposes)
      if (next) {
        setVisitsToNextReward(next.visit_requirement - visitCount);
      } else {
        setVisitsToNextReward(0);
      }
    } catch (error) {
      console.error('Error loading tier data:', error);
    }
  };

  const getRewardDescription = (reward: Reward) => {
    switch (reward.reward_type) {
      case 'free_coffee':
        return 'FREE COFFEE!';
      case 'discount':
        return `${reward.value}% DISCOUNT!`;
      case 'spinner':
        return 'SPIN THE WHEEL!';
      default:
        return reward.name;
    }
  };

  const getRewardIcon = (reward: Reward) => {
    switch (reward.reward_type) {
      case 'free_coffee':
        return <CardGiftcardIcon />;
      case 'discount':
        return <CreditCardIcon />;
      case 'spinner':
        return <CasinoIcon />;
      default:
        return <CardGiftcardIcon />;
    }
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await checkoutUser(user.id);

      if (response.success) {
        // Store the earned reward if any
        if (response.reward_earned) {
          setEarnedReward(response.reward_earned);
        }

        // Check if this was a spinner reward
        if (
          response.reward_earned?.type === 'spinner' &&
          response.reward_earned.reward_id
        ) {
          setSpinnerRewardId(response.reward_earned.reward_id);
          setVisitId(response.visit?.id || null);
          setShowSpinner(true);
        } else {
          setCheckoutSuccess(true);
          // Auto-close after showing success message
          setTimeout(() => {
            onCheckoutComplete();
          }, 3000);
        }
      } else {
        setError(response.message || 'Checkout failed');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.detail || err.message || 'Checkout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpinnerComplete = (result: SpinnerResponse) => {
    // Handle spinner completion
    console.log('Spinner completed:', result);
    setShowSpinner(false);
    setCheckoutSuccess(true);

    // Auto-close after showing success message
    setTimeout(() => {
      onCheckoutComplete();
    }, 3000);
  };

  const handleSpinnerClose = () => {
    setShowSpinner(false);
    setCheckoutSuccess(true);

    // Auto-close after showing success message
    setTimeout(() => {
      onCheckoutComplete();
    }, 3000);
  };

  // Show spinner wheel if spinner reward was earned
  if (showSpinner && spinnerRewardId && visitId) {
    return (
      <SpinnerWheel
        rewardId={spinnerRewardId}
        userId={user.id}
        visitId={visitId}
        onSpinComplete={handleSpinnerComplete}
        onClose={handleSpinnerClose}
      />
    );
  }

  if (checkoutSuccess) {
    return (
      <div className='checkout-modal-overlay'>
        <div className='checkout-modal success'>
          <div className='success-content'>
            <div className='success-icon'>
              <CelebrationIcon />
            </div>
            <h2>Checkout Complete!</h2>
            <p>Visit recorded successfully for {user.name}</p>
            {earnedReward && (
              <div className='reward-notification'>
                <h3>
                  {earnedReward.type === 'free_coffee' && <CardGiftcardIcon />}
                  {earnedReward.type === 'discount' && <CreditCardIcon />}
                  {earnedReward.type === 'spinner' && <CasinoIcon />}
                  Congratulations!
                </h3>
                <p>{earnedReward.message}</p>
                <p>This is your {visitCount + 1}th visit!</p>
                {earnedReward.type === 'spinner' && (
                  <p className='spinner-note'>
                    🎰 Spin the wheel to claim your reward!
                  </p>
                )}
              </div>
            )}
            <p className='closing-message'>
              Redirecting back to recognition...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='checkout-modal-overlay'>
      <div className='checkout-modal'>
        {/* Coffee Image Section with Smoke Animation */}
        <div className='coffee-image-section'>
          <button
            onClick={onClose}
            className='close-button'
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 1000,
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            <CloseIcon />
          </button>
          <div className='coffee-container'>
            {/* Wave rings for smoke effect */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='smoke-ring'
                style={{
                  borderColor: `rgba(210, 105, 30, ${0.4 - i * 0.08})`,
                  transform: `scale(${1 + i * 0.1})`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}

            {/* Floating coffee particles */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * 360) / 8;
              const radius = 100;
              return (
                <div
                  key={i}
                  className='coffee-particle'
                  style={{
                    left: '50%',
                    top: '50%',
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              );
            })}

            {/* Enhanced backdrop effects */}
            <div className='coffee-backdrop' />

            {/* Main coffee image container */}
            <div className='coffee-image-container'>
              <div className='coffee-cup'>
                <div className='coffee-steam'>
                  <div className='steam-line steam-1'></div>
                  <div className='steam-line steam-2'></div>
                  <div className='steam-line steam-3'></div>
                </div>
                <div className='coffee-liquid'></div>
                <div className='coffee-handle'></div>
              </div>

              {/* Coffee beans decoration */}
              <div className='coffee-beans'>
                <div className='bean bean-1'>☕</div>
                <div className='bean bean-2'>🫘</div>
                <div className='bean bean-3'>☕</div>
              </div>
            </div>

            {/* Corner decorations */}
            <div className='corner-decoration top-right' />
            <div className='corner-decoration bottom-left' />
          </div>
        </div>

        <div className='modal-header'>
          <img src='/yavro-icon.png' alt='Yavro' className='yavro-icon' />
        </div>

        <div className='customer-info'>
          <div className='customer-avatar'>
            <PersonIcon />
          </div>
          <div className='customer-details'>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <p>{user.address}</p>
          </div>
        </div>

        <div className='reward-status'>
          <h3>
            <EmojiEventsIcon />
            Reward Status
          </h3>

          {/* Current Tier Display */}
          {currentTier && (
            <div className='current-tier'>
              <h4>Current Tier: {currentTier.name}</h4>
              <p>{currentTier.description}</p>
            </div>
          )}

          <div className='visit-counter'>
            <div className='visit-info'>
              <span className='visit-number'>{visitCount}</span>
              <span className='visit-label'>Total Visits</span>
            </div>

            {/* Progress to next tier */}
            {nextTier && (
              <div className='progress-bar'>
                <div
                  className='progress-fill'
                  style={{
                    width: `${((visitCount - (currentTier?.visit_requirement || 0)) / (nextTier.visit_requirement - (currentTier?.visit_requirement || 0))) * 100}%`,
                  }}
                ></div>
              </div>
            )}

            <div className='visits-remaining'>
              {visitsToNextReward > 0 ? (
                `${visitsToNextReward} visit${visitsToNextReward !== 1 ? 's' : ''} until next tier`
              ) : (
                <>
                  <p>You've reached the highest tier!</p>
                  <p>
                    You'll get rewards on every multiple of{' '}
                    {currentTier?.visit_requirement || 'your tier'} visits
                  </p>
                  {currentTier && (
                    <p>
                      Next reward at visit #
                      {Math.ceil(
                        (visitCount + 1) / currentTier.visit_requirement
                      ) * currentTier.visit_requirement}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {isRewardEligible && eligibleReward && (
            <div className='reward-alert'>
              <h4>
                {getRewardIcon(eligibleReward)}
                Next visit = {getRewardDescription(eligibleReward)}
              </h4>
              <p>
                Complete this checkout to claim your{' '}
                {eligibleReward.reward_type === 'spinner' ? 'spin' : 'reward'}!
              </p>
              {eligibleReward.reward_type === 'spinner' && (
                <p className='spinner-hint'>
                  🎰 You'll get to spin the wheel for a random reward!
                </p>
              )}
            </div>
          )}
        </div>

        <div className='checkout-actions'>
          {error && <div className='error-message'>{error}</div>}

          <div className='action-buttons'>
            <button
              onClick={onClose}
              className='cancel-button'
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              className='checkout-button'
              disabled={isLoading}
            >
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  <CreditCardIcon />
                  Complete Checkout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
