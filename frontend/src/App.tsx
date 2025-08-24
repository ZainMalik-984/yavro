import React, { useState } from 'react';
import './App.css';
import CameraCapture from './components/CameraCapture';
import CheckoutModal from './components/CheckoutModal';
import { User } from './types';
import UserRegistration from './components/UserRegistration';
import Dashboard from './components/Dashboard';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');

  const handleUserRecognized = (user: User) => {
    setCurrentUser(user);
    setShowCheckout(true);
  };

  const handleUserNotFound = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setShowRegistration(true);
  };

  const handleRegistrationComplete = (user: User) => {
    setCurrentUser(user);
    setShowRegistration(false);
    setShowCheckout(true);
    setCapturedImage(''); // Clear the captured image after registration
  };

  const handleCheckoutComplete = () => {
    setCurrentUser(null);
    setShowCheckout(false);
    setShowRegistration(false);
    setCapturedImage(''); // Clear the captured image
  };

  const handleReset = () => {
    setCurrentUser(null);
    setShowRegistration(false);
    setShowCheckout(false);
    setShowDashboard(false);
    setCapturedImage(''); // Clear the captured image
  };

  return (
    <div className="App">
      
      <video 
        autoPlay 
        muted 
        loop 
        className="coffee-beans-video"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          opacity: 0.9
        }}
      >
        <source src="/coffee-beans.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <header className="App-header">
        <div className="yavro-header">
          <div className="yavro-text">
          <img src="/yavro-icon.png" alt="Yavro" className="yavro-logo" />
            <p>Brewing Connections, One Cup at a Time</p>
          </div>
          <button 
            className="dashboard-button"
            onClick={() => setShowDashboard(true)}
          >
            Admin Dashboard
          </button>
        </div>
      </header>

      <main className="App-main">
        {showDashboard ? (
          <div className="dashboard-container">
            <button 
              className="back-button"
              onClick={handleReset}
            >
              ← Back to Main
            </button>
            <Dashboard />
          </div>
        ) : (
          <>
            {!showRegistration && !showCheckout && (
              <CameraCapture
                onUserRecognized={handleUserRecognized}
                onUserNotFound={handleUserNotFound}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}

            {showRegistration && (
              <UserRegistration
                capturedImage={capturedImage}
                onRegistrationComplete={handleRegistrationComplete}
                onBack={handleReset}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}

            {showCheckout && currentUser && (
              <CheckoutModal
                user={currentUser}
                onCheckoutComplete={handleCheckoutComplete}
                onClose={handleReset}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
