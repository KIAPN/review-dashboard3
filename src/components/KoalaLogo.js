import React from 'react';
// Import the logo
import koalaLogo from '../assets/images/koala-logo.svg';

const KoalaLogo = ({ className, width = 200 }) => {
  return (
    <img 
      src={koalaLogo} 
      alt="Koala Insulation Logo" 
      width={width} 
      className={className}
    />
  );
};

export default KoalaLogo;
