import { useTheme, useMediaQuery } from '@mui/material';

export const useResponsiveLayout = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  return {
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
};