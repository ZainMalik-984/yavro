import React from 'react';
import { Coffee as CoffeeIcon } from '@mui/icons-material';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-background">
        <div className="footer-particles"></div>
        <div className="footer-particles"></div>
      </div>
      
      <div className="footer-content">
        <div className="yavro-branding">
          <div className="logo-container">
            <img src="/yavro-icon.png" alt="Yavro" className="yavro-footer-logo" />
            <div className="logo-glow"></div>
          </div>
          <div className="brand-text">
            <span className="yavro-text">Powered by</span>
            <span className="yavro-name">Yavro</span>
          </div>
        </div>
        
        <div className="footer-tagline">
          <span className="tagline-text">Brewing Connections, One Cup at a Time</span>
          <div className="tagline-underline"></div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-line"></div>
        <span className="copyright">© 2024 Yavro. All rights reserved.</span>
      </div>
    </footer>
  );
};

export default Footer;
