import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import TierManagement from './TierManagement';
import RewardManagement from './RewardManagement';
import SpinnerManagement from './SpinnerManagement';
import UserRewards from './UserRewards';
import UserManagement from './UserManagement';

type TabType = 'tiers' | 'rewards' | 'spinners' | 'user-rewards' | 'users';

const Dashboard: React.FC<{ BackButton: () => React.ReactNode }> = ({
  BackButton,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('tiers');

  const tabs = [
    { id: 'tiers', label: 'Tier Management' },
    { id: 'rewards', label: 'Reward Management' },
    { id: 'spinners', label: 'Spinner Management' },
    { id: 'user-rewards', label: 'User Rewards' },
    { id: 'users', label: 'User Management' },
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tiers':
        return <TierManagement />;
      case 'rewards':
        return <RewardManagement />;
      case 'spinners':
        return <SpinnerManagement />;
      case 'user-rewards':
        return <UserRewards />;
      case 'users':
        return <UserManagement />;
      default:
        return <TierManagement />;
    }
  };

  return (
    <div className='dashboard'>
      <div className='dashboard-header'>
        {BackButton()}
        <h1>Reward System Dashboard</h1>
        <p>Manage tiers, rewards, and spinner options</p>
      </div>

      <div className='dashboard-tabs'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='dashboard-content'>{renderTabContent()}</div>
    </div>
  );
};

export default Dashboard;
