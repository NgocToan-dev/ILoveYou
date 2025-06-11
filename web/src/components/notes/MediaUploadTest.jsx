import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Alert, Chip, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import MediaUpload from './MediaUpload';
import VideoDisplay from './VideoDisplay';
import { useStorageAdapter } from '../../hooks/useStorageAdapter.js';
import { runStorageTests, testBackwardCompatibility } from '../../test/storage-abstraction-test.js';

const MediaUploadTest = () => {
  const [media, setMedia] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [runningTests, setRunningTests] = useState(false);
  
  const {
    storageStatus,
    getPrimaryProvider,
    getFallbackProvider,
    isHealthy,
    hasFallback,
    getStatus
  } = useStorageAdapter();

  const handleMediaChange = (newMedia) => {
    console.log('Media updated:', newMedia);
    setMedia(newMedia);
    
    // Log storage adapter information for each upload
    if (newMedia.length > media.length) {
      const newItem = newMedia[newMedia.length - 1];
      console.log('Storage Adapter Info:', {
        provider: newItem.provider,
        usedFallback: newItem.usedFallback,
        metadata: newItem.metadata
      });
    }
  };

  const handleVideoPreview = (videoItem) => {
    setSelectedVideo(videoItem);
  };

  const runAbstractionTests = async () => {
    setRunningTests(true);
    try {
      const results = await runStorageTests();
      const backwardCompatibility = testBackwardCompatibility();
      
      setTestResults({
        ...results,
        backwardCompatibility
      });
    } catch (error) {
      console.error('Test execution failed:', error);
      setTestResults({
        total: 0,
        passed: 0,
        failed: 1,
        tests: [{ name: 'Test Execution', status: 'FAILED', error: error.message }],
        backwardCompatibility: false
      });
    } finally {
      setRunningTests(false);
    }
  };

  useEffect(() => {
    // Initialize storage status
    getStatus();
  }, [getStatus]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Media Upload & Storage Abstraction Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This component tests both the media upload functionality and the new Storage Abstraction Layer.
        Upload files to test backward compatibility and storage provider functionality.
      </Alert>

      {/* Storage Status Panel */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Storage Abstraction Layer Status
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item>
            <Chip
              label={`Primary: ${getPrimaryProvider()}`}
              color="primary"
              size="small"
            />
          </Grid>
          <Grid item>
            <Chip
              label={`Fallback: ${getFallbackProvider()}`}
              color="secondary"
              size="small"
            />
          </Grid>
          <Grid item>
            <Chip
              label={`Healthy: ${isHealthy() ? 'Yes' : 'No'}`}
              color={isHealthy() ? 'success' : 'error'}
              size="small"
            />
          </Grid>
          <Grid item>
            <Chip
              label={`Has Fallback: ${hasFallback() ? 'Yes' : 'No'}`}
              color={hasFallback() ? 'success' : 'warning'}
              size="small"
            />
          </Grid>
        </Grid>

        <Button
          variant="outlined"
          onClick={runAbstractionTests}
          disabled={runningTests}
          sx={{ mr: 2 }}
        >
          {runningTests ? 'Running Tests...' : 'Run Storage Tests'}
        </Button>

        <Button
          variant="outlined"
          onClick={getStatus}
        >
          Refresh Status
        </Button>

        {/* Test Results */}
        {testResults && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Test Results: {testResults.passed}/{testResults.total} Passed
                {testResults.backwardCompatibility ? ' ✅ Backward Compatible' : ' ❌ Compatibility Issue'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {testResults.tests.map((test, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: test.status === 'PASSED' ? '#e8f5e8' : '#ffebee', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                      {test.status === 'PASSED' ? '✅' : '❌'} {test.name}
                    </Typography>
                    {test.error && (
                      <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                        {test.error}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Media Files
        </Typography>
        <MediaUpload 
          media={media}
          onMediaChange={handleMediaChange}
          maxMedia={5}
        />
      </Paper>

      {media.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Media ({media.length} files)
          </Typography>
          
          {media.map((item, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {item.name} - {item.isVideo ? 'Video' : 'Image'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Size: {(item.size / (1024 * 1024)).toFixed(2)}MB
              </Typography>
              
              {/* Storage Provider Information */}
              {item.provider && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`Provider: ${item.provider}`}
                    color="info"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {item.usedFallback && (
                    <Chip
                      label="Used Fallback"
                      color="warning"
                      size="small"
                    />
                  )}
                </Box>
              )}
              
              {item.isVideo && (
                <Button
                  size="small"
                  onClick={() => handleVideoPreview(item)}
                  sx={{ ml: 2, mt: 1 }}
                >
                  Preview Video
                </Button>
              )}
            </Box>
          ))}
        </Paper>
      )}

      {selectedVideo && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Video Preview: {selectedVideo.name}
          </Typography>
          <VideoDisplay
            videoUrl={selectedVideo.url}
            thumbnail={selectedVideo.thumbnail}
            title={selectedVideo.name}
            maxHeight="400px"
          />
          <Button 
            onClick={() => setSelectedVideo(null)}
            sx={{ mt: 2 }}
          >
            Close Preview
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default MediaUploadTest;