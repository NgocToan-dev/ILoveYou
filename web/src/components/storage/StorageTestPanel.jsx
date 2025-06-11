/**
 * Storage Test Panel
 * Comprehensive testing component for the Storage Abstraction Layer
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  SwapHoriz as SwitchIcon,
  MonitorHeart as HealthIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useStorageAdapter } from '../../hooks/useStorageAdapter.js';

const StorageTestPanel = () => {
  const {
    uploadFile,
    downloadFile,
    deleteFile,
    getFileUrl,
    listFiles,
    switchProviders,
    performHealthCheck,
    getConfiguration,
    updateConfiguration,
    storageStatus,
    getStatus,
    isLoading,
    error,
    getPrimaryProvider,
    getFallbackProvider,
    isHealthy,
    hasFallback,
    clearError
  } = useStorageAdapter();

  const [testFile, setTestFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [testResults, setTestResults] = useState([]);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState({});
  const [fileList, setFileList] = useState([]);

  // Initialize temp config
  useEffect(() => {
    setTempConfig(getConfiguration());
  }, [getConfiguration]);

  // Add test result
  const addTestResult = (test, result, success = true) => {
    const newResult = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      test,
      result: JSON.stringify(result, null, 2),
      success
    };
    setTestResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  // Test file upload
  const testUpload = async () => {
    if (!testFile) {
      alert('Please select a file first');
      return;
    }

    try {
      const result = await uploadFile(
        testFile,
        `test/${Date.now()}_${testFile.name}`,
        { testUpload: true },
        (progress) => setUploadProgress(progress)
      );
      
      addTestResult('File Upload', result);
      setUploadProgress(0);
      setTestFile(null);
      
      // Refresh file list
      await testListFiles();
    } catch (err) {
      addTestResult('File Upload', { error: err.message }, false);
      setUploadProgress(0);
    }
  };

  // Test file download
  const testDownload = async (filePath) => {
    try {
      const result = await downloadFile(filePath);
      addTestResult('File Download', {
        path: filePath,
        blob: { size: result.blob.size, type: result.blob.type },
        provider: result.provider,
        usedFallback: result.usedFallback
      });
    } catch (err) {
      addTestResult('File Download', { error: err.message }, false);
    }
  };

  // Test file deletion
  const testDelete = async (filePath) => {
    try {
      const result = await deleteFile(filePath);
      addTestResult('File Delete', { path: filePath, ...result });
      
      // Refresh file list
      await testListFiles();
    } catch (err) {
      addTestResult('File Delete', { error: err.message }, false);
    }
  };

  // Test get file URL
  const testGetUrl = async (filePath) => {
    try {
      const result = await getFileUrl(filePath);
      addTestResult('Get File URL', result);
    } catch (err) {
      addTestResult('Get File URL', { error: err.message }, false);
    }
  };

  // Test list files
  const testListFiles = async () => {
    try {
      const result = await listFiles('test/');
      addTestResult('List Files', { count: result.files.length, provider: result.provider });
      setFileList(result.files);
    } catch (err) {
      addTestResult('List Files', { error: err.message }, false);
      setFileList([]);
    }
  };

  // Test provider switch (MinIO only - no switching needed)
  const testSwitchProvider = async () => {
    try {
      const result = await switchProviders('minio');
      addTestResult('Provider Switch', result);
    } catch (err) {
      addTestResult('Provider Switch', { error: err.message }, false);
    }
  };

  // Test health check
  const testHealthCheck = async () => {
    try {
      const result = await performHealthCheck();
      addTestResult('Health Check', result);
    } catch (err) {
      addTestResult('Health Check', { error: err.message }, false);
    }
  };

  // Update configuration
  const handleConfigUpdate = async () => {
    try {
      const result = await updateConfiguration(tempConfig);
      addTestResult('Configuration Update', result);
      setConfigDialogOpen(false);
    } catch (err) {
      addTestResult('Configuration Update', { error: err.message }, false);
    }
  };

  // Clear all test results
  const clearResults = () => {
    setTestResults([]);
  };

  const StatusChip = ({ label, status, color }) => (
    <Chip
      label={`${label}: ${status}`}
      color={status === 'healthy' || status === true ? 'success' : 'error'}
      size="small"
      sx={{ mr: 1, mb: 1 }}
    />
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Storage Abstraction Layer Test Panel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Storage Status
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <StatusChip 
                  label="Primary" 
                  status={getPrimaryProvider()} 
                />
                <StatusChip 
                  label="Fallback" 
                  status={getFallbackProvider()} 
                />
                <StatusChip 
                  label="Healthy" 
                  status={isHealthy()} 
                />
                <StatusChip 
                  label="Has Fallback" 
                  status={hasFallback()} 
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={getStatus}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<HealthIcon />}
                  onClick={testHealthCheck}
                  disabled={isLoading}
                >
                  Health Check
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SwitchIcon />}
                  onClick={testSwitchProvider}
                  disabled={isLoading}
                >
                  Switch Provider
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => setConfigDialogOpen(true)}
                >
                  Config
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upload Test Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Test
              </Typography>
              
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setTestFile(e.target.files[0])}
                style={{ marginBottom: 16 }}
              />
              
              {uploadProgress > 0 && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption">{uploadProgress}%</Typography>
                </Box>
              )}
              
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={testUpload}
                disabled={!testFile || isLoading}
                fullWidth
              >
                Test Upload
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* File List Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Test Files ({fileList.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={testListFiles}
                  disabled={isLoading}
                >
                  Refresh List
                </Button>
              </Box>
              
              <List>
                {fileList.map((file, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <Box>
                        <IconButton
                          edge="end"
                          aria-label="download"
                          onClick={() => testDownload(file.fullPath)}
                          disabled={isLoading}
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="get-url"
                          onClick={() => testGetUrl(file.fullPath)}
                          disabled={isLoading}
                        >
                          <RefreshIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => testDelete(file.fullPath)}
                          disabled={isLoading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(2)} KB - ${file.provider}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Results */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Test Results ({testResults.length})
              </Typography>
              <Button
                size="small"
                onClick={clearResults}
                sx={{ ml: 'auto', mr: 2 }}
              >
                Clear
              </Button>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {testResults.map((result) => (
                  <ListItem key={result.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={result.test}
                            color={result.success ? 'success' : 'error'}
                            size="small"
                          />
                          <Typography variant="caption">
                            {result.timestamp}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <pre style={{ fontSize: '12px', marginTop: 8 }}>
                          {result.result}
                        </pre>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Storage Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Primary Provider"
                value={tempConfig.primary || ''}
                onChange={(e) => setTempConfig(prev => ({ ...prev, primary: e.target.value }))}
                fullWidth
                select
                SelectProps={{ native: true }}
              >
                <option value="minio">MinIO</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fallback Provider"
                value={tempConfig.fallback || ''}
                onChange={(e) => setTempConfig(prev => ({ ...prev, fallback: e.target.value }))}
                fullWidth
                select
                SelectProps={{ native: true }}
              >
                <option value="minio">MinIO (Not Available)</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tempConfig.enableFallback || false}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, enableFallback: e.target.checked }))}
                  />
                }
                label="Enable Fallback"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tempConfig.autoFailover || false}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, autoFailover: e.target.checked }))}
                  />
                }
                label="Auto Failover"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Health Check Interval (ms)"
                type="number"
                value={tempConfig.healthCheckInterval || ''}
                onChange={(e) => setTempConfig(prev => ({ ...prev, healthCheckInterval: parseInt(e.target.value) }))}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfigUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StorageTestPanel;