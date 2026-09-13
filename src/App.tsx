import React, { useState, useEffect } from 'react';
import { StudioProvider } from './context/StudioContext';
import { RecordingProvider } from './context/RecordingContext';
import { CloudinaryProvider } from './context/CloudinaryContext';
import { DesktopStudioLayout } from './components/layout/DesktopStudioLayout';
import { MobileStudioLayout } from './components/layout/MobileStudioLayout';

function StudioRoot() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <MobileStudioLayout /> : <DesktopStudioLayout />;
}

export default function App() {
  return (
    <StudioProvider>
      <RecordingProvider>
        <CloudinaryProvider>
          <StudioRoot />
        </CloudinaryProvider>
      </RecordingProvider>
    </StudioProvider>
  );
}
