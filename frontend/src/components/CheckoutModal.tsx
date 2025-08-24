import React, { useState } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { checkoutUser } from '../services/api';
import { User } from '../types';
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

  const visitCount = user.visit_count || 0;
  const visitsToReward = 5;
  const visitsRemaining = visitsToReward - (visitCount % visitsToReward);
  const isRewardEligible = (visitCount + 1) % visitsToReward === 0;

  const handleCheckout = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await checkoutUser(user.id);
      
      if (response.success) {
        setCheckoutSuccess(true);
        // Auto-close after showing success message
        setTimeout(() => {
          onCheckoutComplete();
        }, 3000);
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

  if (checkoutSuccess) {
    return (
      <div className="checkout-modal-overlay">
        <div className="checkout-modal success">
          <div className="success-content">
            <div className="success-icon">
              <CelebrationIcon />
            </div>
            <h2>Checkout Complete!</h2>
            <p>Visit recorded successfully for {user.name}</p>
            {isRewardEligible && (
              <div className="reward-notification">
                <h3>
                  <CardGiftcardIcon />
                  Congratulations!
                </h3>
                <p>You've earned a FREE COFFEE!</p>
                <p>This is your {visitCount + 1}th visit!</p>
              </div>
            )}
            <p className="closing-message">Redirecting back to recognition...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-modal-overlay">
      <div className="checkout-modal">
        {/* Coffee Image Section with Smoke Animation */}
        <div className="coffee-image-section">
          <div className="coffee-container">
            {/* Wave rings for smoke effect */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="smoke-ring"
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
                  className="coffee-particle"
                  style={{
                    left: "50%",
                    top: "50%",
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              );
            })}

            {/* Enhanced backdrop effects */}
            <div className="coffee-backdrop" />

            {/* Main coffee image container */}
            <div className="coffee-image-container">
              <div className="coffee-cup">
                <div className="coffee-steam">
                  <div className="steam-line steam-1"></div>
                  <div className="steam-line steam-2"></div>
                  <div className="steam-line steam-3"></div>
                </div>
                <div className="coffee-liquid"></div>
                <div className="coffee-handle"></div>
              </div>
              
              {/* Coffee beans decoration */}
              <div className="coffee-beans">
                <div className="bean bean-1">☕</div>
                <div className="bean bean-2">🫘</div>
                <div className="bean bean-3">☕</div>
              </div>
            </div>

            {/* Corner decorations */}
            <div className="corner-decoration top-right" />
            <div className="corner-decoration bottom-left" />
          </div>
        </div>

        <div className="modal-header">
          <div className="header-content">
            <div className="yavro-branding">
              <img src="/yavro-icon.png" alt="Yavro" className="yavro-icon" />
            </div>
            <button onClick={onClose} className="close-button">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="customer-info">
          <div className="customer-avatar">
            <PersonIcon />
          </div>
          <div className="customer-details">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <p>{user.address}</p>
          </div>
        </div>

        <div className="reward-status">
          <h3>
            <EmojiEventsIcon />
            Reward Status
          </h3>
          <div className="visit-counter">
            <div className="visit-info">
              <span className="visit-number">{visitCount}</span>
              <span className="visit-label">Total Visits</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((visitCount % visitsToReward) / visitsToReward) * 100}%` }}
              ></div>
            </div>
            <div className="visits-remaining">
              {visitsRemaining} visit{visitsRemaining !== 1 ? 's' : ''} until next reward
            </div>
          </div>
          
          {isRewardEligible && (
            <div className="reward-alert">
              <h4>
                <CardGiftcardIcon />
                Next visit = FREE COFFEE!
              </h4>
              <p>Complete this checkout to claim your reward!</p>
            </div>
          )}
        </div>

        <div className="checkout-actions">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="action-buttons">
            <button 
              onClick={onClose}
              className="cancel-button"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleCheckout}
              className="checkout-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (
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
