import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Stack
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  Home,
  BugReport
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // In production, send to error monitoring service like Sentry
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to analytics/monitoring
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error}
        resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        {...this.props}
      />;
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, resetError }) => {
  const { t } = useTranslation();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReportError = () => {
    const errorReport = {
      error: error?.toString(),
      stack: error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert(t('error.errorCopied'));
      })
      .catch(() => {
        console.log('Error report:', errorReport);
      });
  };

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center'
        }}
      >
        <ErrorOutline 
          sx={{ 
            fontSize: 80, 
            color: 'error.main', 
            mb: 2 
          }} 
        />

        <Typography variant="h4" gutterBottom color="error">
          {t('error.title')}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          {t('error.description')}
        </Typography>

        <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
          <AlertTitle>{t('error.details')}</AlertTitle>
          <Typography variant="body2" component="pre" sx={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 150,
            overflow: 'auto',
            fontSize: '0.8rem'
          }}>
            {error?.toString()}
          </Typography>
        </Alert>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={resetError}
          >
            {t('error.tryAgain')}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleReload}
          >
            {t('error.reload')}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={handleGoHome}
          >
            {t('error.goHome')}
          </Button>

          <Button
            variant="text"
            startIcon={<BugReport />}
            onClick={handleReportError}
            size="small"
          >
            {t('error.report')}
          </Button>
        </Stack>

        <Typography variant="caption" display="block" sx={{ mt: 3, color: 'text.secondary' }}>
          {t('error.help')}
        </Typography>
      </Paper>
    </Box>
  );
};

// Async Error Boundary for catching promise rejections
export class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Async error caught:', error, errorInfo);
  }

  componentDidMount() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    this.setState({ hasError: true });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          <AlertTitle>Something went wrong</AlertTitle>
          An unexpected error occurred. Please try refreshing the page.
          <Button 
            onClick={() => window.location.reload()} 
            sx={{ ml: 2 }}
            size="small"
          >
            Refresh
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;