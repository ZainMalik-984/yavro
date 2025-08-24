import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import { SpinnerOption, SpinnerRequest, SpinnerResponse } from '../types';
import { spinReward, getSpinnerOptionsByReward } from '../services/api';
import './SpinnerWheel.css';

interface SpinnerWheelProps {
  rewardId: number;
  userId: number;
  visitId: number;
  onSpinComplete: (result: SpinnerResponse) => void;
  onClose: () => void;
}

const SpinnerWheel: React.FC<SpinnerWheelProps> = ({
  rewardId,
  userId,
  visitId,
  onSpinComplete,
  onClose,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SpinnerOption | null>(
    null
  );
  const [spinnerOptions, setSpinnerOptions] = useState<SpinnerOption[]>([]);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadSpinnerOptions();
  }, [rewardId]);

  const loadSpinnerOptions = async () => {
    try {
      setLoading(true);
      setError('');
      const options = await getSpinnerOptionsByReward(rewardId);
      setSpinnerOptions(options);
    } catch (error) {
      console.error('Error loading spinner options:', error);
      setError('Failed to load spinner options');
    } finally {
      setLoading(false);
    }
  };

  const spinWheel = async () => {
    if (isSpinning || spinnerOptions.length === 0) return;

    setIsSpinning(true);
    setShowResult(false);
    setSelectedOption(null);

    try {
      const request: SpinnerRequest = {
        user_id: userId,
        reward_id: rewardId,
        visit_id: visitId,
      };

      const result = await spinReward(request);

      // Find the index of the selected option
      const selectedIndex = spinnerOptions.findIndex(
        opt => opt.id === result.selected_option?.id
      );

      if (selectedIndex !== -1) {
        setPrizeNumber(selectedIndex);
        setMustSpin(true);
        setSelectedOption(result.selected_option || null);
      }
    } catch (error) {
      console.error('Error spinning wheel:', error);
      setIsSpinning(false);
      setError('Failed to spin the wheel');
    }
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    setIsSpinning(false);
    setShowResult(true);

    // Call the completion callback
    if (selectedOption) {
      onSpinComplete({
        success: true,
        message: `Congratulations! You won ${getRewardDescription(selectedOption)}!`,
        selected_option: selectedOption,
      });
    }
  };

  const getRewardDescription = (option: SpinnerOption) => {
    switch (option.reward_type) {
      case 'free_coffee':
        return '☕ Free Coffee';
      case 'discount':
        return `💳 ${option.value}% Off`;
      default:
        return option.name;
    }
  };

  const getRewardColor = (index: number) => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#FF9FF3',
      '#54A0FF',
      '#5F27CD',
      '#00D2D3',
    ];
    return colors[index % colors.length];
  };

  const wheelData = spinnerOptions.map((option, index) => ({
    option: getRewardDescription(option),
    style: {
      backgroundColor: getRewardColor(index),
      textColor: '#ffffff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    option_id: option.id,
  }));

  if (loading) {
    return (
      <div className='spinner-wheel-overlay'>
        <div className='spinner-wheel-container'>
          <div className='loading-message'>
            <div className='loading-spinner'>🎰</div>
            <p>Loading spinner options...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='spinner-wheel-overlay'>
        <div className='spinner-wheel-container'>
          <div className='error-message'>
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={onClose} className='close-button'>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (spinnerOptions.length === 0) {
    return (
      <div className='spinner-wheel-overlay'>
        <div className='spinner-wheel-container'>
          <div className='no-options-message'>
            <h3>No Spinner Options</h3>
            <p>No spinner options are available for this reward.</p>
            <button onClick={onClose} className='close-button'>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='spinner-wheel-overlay'>
      <div className='spinner-wheel-container'>
        <div className='spinner-header'>
          <h2>🎰 Spin the Wheel! 🎰</h2>
          <p>Spin to win your reward!</p>
        </div>

        <div className='wheel-section'>
          <div className='wheel-container'>
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={wheelData}
              onStopSpinning={handleStopSpinning}
              backgroundColors={['#3e3e3e']}
              textColors={['#ffffff']}
              fontSize={16}
              fontWeight='bold'
              radiusLineWidth={2}
              radiusLineColor='#ffffff'
              outerBorderWidth={3}
              outerBorderColor='#8B4513'
              innerBorderWidth={2}
              innerBorderColor='#34495e'
              innerRadius={30}
              spinDuration={0.8}
              startingOptionIndex={0}
            />
          </div>
        </div>

        <div className='spinner-actions'>
          {!isSpinning && !showResult && (
            <button
              className='spin-button'
              onClick={spinWheel}
              disabled={isSpinning}
            >
              🎰 SPIN THE WHEEL! 🎰
            </button>
          )}

          {isSpinning && (
            <div className='spinning-message'>
              <div className='spinner-animation'>🎰</div>
              <p>Spinning...</p>
            </div>
          )}

          {showResult && selectedOption && (
            <div className='result-section'>
              <div className='result-card'>
                <h3>🎉 Congratulations! 🎉</h3>
                <div className='result-reward'>
                  <h4>{getRewardDescription(selectedOption)}</h4>
                  <p>{selectedOption.description}</p>
                </div>
                <button className='claim-button' onClick={onClose}>
                  Claim Reward
                </button>
              </div>
            </div>
          )}
        </div>

        <button className='close-spinner-button' onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default SpinnerWheel;
