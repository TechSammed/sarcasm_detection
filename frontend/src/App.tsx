import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Workspace } from './pages/Workspace';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Workspace />} />
      <Route path="/app" element={<Workspace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

