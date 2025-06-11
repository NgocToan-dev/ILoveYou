import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  CloudQueue,
  Storage,
  Refresh,
  Speed,
  Security,
} from '@mui/icons-material';
import { 
  backendApi,
  notesService,
  remindersService,
  couplesService,
  loveDaysService,
  authService
} from '../../services';

const BackendTestPanel = () => {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [serviceStatuses, setServiceStatuses] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check backend availability on mount
  useEffect(() => {
    checkBackendHealth();
    checkServiceModes();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const isHealthy = await backendApi.healthCheck();
      setBackendStatus(isHealthy ? 'healthy' : 'unavailable');
    } catch (error) {
      setBackendStatus('error');
    }
  };

  const checkServiceModes = () => {
    setServiceStatuses({
      notes: notesService.getCurrentMode(),
      reminders: remindersService.getCurrentMode(),
      couples: couplesService.getCurrentMode(),
      loveDays: loveDaysService.getCurrentMode(),
      auth: authService.getCurrentMode(),
    });
  };

  const runBackendTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Backend Health Check',
        test: async () => {
          const healthy = await backendApi.healthCheck();
          return { success: healthy, message: healthy ? 'Backend is healthy' : 'Backend unavailable' };
        }
      },
      {
        name: 'Auth Token Verification',
        test: async () => {
          try {
            const result = await authService.verifyToken();
            return { success: true, message: `Token verified via ${result.source}` };
          } catch (error) {
            return { success: false, message: error.message };
          }
        }
      },
      {
        name: 'Notes Service Test',
        test: async () => {
          try {
            // Test getting notes (should work with both backend and Firebase)
            const result = await notesService.getUserPrivateNotes('test-user-id');
            return { success: true, message: `Notes retrieved via ${result.source}` };
          } catch (error) {
            return { success: false, message: error.message };
          }
        }
      },
      {
        name: 'Backend API Availability Check',
        test: async () => {
          try {
            const available = await notesService.checkBackendAvailability();
            return { 
              success: true, 
              message: available ? 'Backend API is available' : 'Backend API unavailable, using Firebase' 
            };
          } catch (error) {
            return { success: false, message: error.message };
          }
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        setTestResults(prev => [...prev, { name: test.name, ...result }]);
      } catch (error) {
        setTestResults(prev => [...prev, { 
          name: test.name, 
          success: false, 
          message: error.message 
        }]);
      }
    }
    
    setLoading(false);
  };

  const switchToBackendMode = () => {
    notesService.forceBackendMode();
    remindersService.forceBackendMode();
    couplesService.forceBackendMode();
    loveDaysService.forceBackendMode();
    authService.forceBackendMode();
    checkServiceModes();
  };

  const switchToFirebaseMode = () => {
    notesService.forceFirebaseMode();
    remindersService.forceFirebaseMode();
    couplesService.forceFirebaseMode();
    loveDaysService.forceFirebaseMode();
    authService.forceFirebaseMode();
    checkServiceModes();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'checking': return 'warning';
      case 'unavailable': return 'error';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'checking': return <CircularProgress size={20} />;
      case 'unavailable': return <Error />;
      case 'error': return <Error />;
      default: return <CloudQueue />;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Backend Integration Test Panel
      </Typography>

      <Grid container spacing={3}>
        {/* Backend Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backend Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {getStatusIcon(backendStatus)}
                <Chip
                  label={backendStatus.toUpperCase()}
                  color={getStatusColor(backendStatus)}
                  sx={{ ml: 1 }}
                />
              </Box>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />}
                onClick={checkBackendHealth}
                disabled={backendStatus === 'checking'}
              >
                Check Health
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Service Modes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Modes
              </Typography>
              <List dense>
                {Object.entries(serviceStatuses).map(([service, status]) => (
                  <ListItem key={service}>
                    <ListItemIcon>
                      {status.useBackend ? <CloudQueue color="primary" /> : <Storage color="secondary" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={service}
                      secondary={`${status.useBackend ? 'Backend' : 'Firebase'} ${status.fallbackEnabled ? '(with fallback)' : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Service Controls */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Controls
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<CloudQueue />}
                  onClick={switchToBackendMode}
                >
                  Switch to Backend Mode
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Storage />}
                  onClick={switchToFirebaseMode}
                >
                  Switch to Firebase Mode
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Speed />}
                  onClick={runBackendTests}
                  disabled={loading}
                >
                  Run Tests
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Test Results
                </Typography>
                <List>
                  {testResults.map((result, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {result.success ? 
                            <CheckCircle color="success" /> : 
                            <Error color="error" />
                          }
                        </ListItemIcon>
                        <ListItemText
                          primary={result.name}
                          secondary={result.message}
                        />
                      </ListItem>
                      {index < testResults.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Integration Info */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              Backend Integration Information
            </Typography>
            <Typography variant="body2">
              • The frontend uses hybrid services that can switch between Firebase and Backend API<br/>
              • Backend is disabled by default (set VITE_USE_BACKEND_API=true to enable)<br/>
              • Firebase fallback is enabled by default for resilience<br/>
              • Real-time subscriptions currently use Firebase only<br/>
              • Authentication always uses Firebase as the primary provider
            </Typography>
          </Alert>
        </Grid>

        {/* Environment Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Environment Configuration
              </Typography>
              <Typography variant="body2" component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                overflow: 'auto'
              }}>
{`# Add to .env file to enable backend
VITE_BACKEND_API_URL=http://localhost:3001/api
VITE_USE_BACKEND_API=true
VITE_FALLBACK_TO_FIREBASE=true`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BackendTestPanel;