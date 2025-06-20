import { createTheme } from '@mui/material/styles';
import { loveTheme } from '@shared/constants/colors';

export const muiLoveTheme = createTheme({
  palette: {
    ...loveTheme,
    mode: 'light',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 16,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 48,
          '&.MuiButton-containedPrimary': {
            background: `linear-gradient(135deg, ${loveTheme.primary.main}, ${loveTheme.primary.dark})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${loveTheme.primary.dark}, ${loveTheme.primary.main})`,
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: loveTheme.primary.main,
            },
          },
          '& .MuiInputLabel-root': {
            backgroundColor: 'white',
            paddingLeft: '4px',
            paddingRight: '4px',
            '&.Mui-focused': {
              color: loveTheme.primary.main,
            },
          },
          '& .MuiInputLabel-outlined': {
            transform: 'translate(14px, 16px) scale(1)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
              backgroundColor: 'white',
              paddingLeft: '8px',
              paddingRight: '8px',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(233, 30, 99, 0.1)',
        },
      },
    },
  },
});