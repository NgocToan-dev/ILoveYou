import React from 'react';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';

const AppLayout = ({ children }) => {
  const { isDesktop } = useResponsiveLayout();

  return isDesktop ? (
    <DesktopLayout>{children}</DesktopLayout>
  ) : (
    <MobileLayout>{children}</MobileLayout>
  );
};

export default AppLayout;