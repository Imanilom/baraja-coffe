import React from 'react';

const MainContent = ({ children }) => {
  return (
    <main className="flex-1 p-10">
      {children}
    </main>
  );
};

export default MainContent;