import React from 'react';

const BlankPage: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'transparent',
      pointerEvents: 'none'
    }} />
  );
};

export default BlankPage;
