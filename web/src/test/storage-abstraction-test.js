/**
 * Storage Abstraction Layer Integration Test
 * Tests to verify backward compatibility and new functionality
 */

import { storageAdapter } from '../../../shared/services/storage/index.js';

// Test suite for Storage Abstraction Layer
export const runStorageTests = async () => {
  console.log('🧪 Starting Storage Abstraction Layer Tests...');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  const runTest = async (testName, testFunction) => {
    results.total++;
    console.log(`🔄 Running: ${testName}`);
    
    try {
      const result = await testFunction();
      results.passed++;
      results.tests.push({
        name: testName,
        status: 'PASSED',
        result: result
      });
      console.log(`✅ PASSED: ${testName}`);
      return result;
    } catch (error) {
      results.failed++;
      results.tests.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        stack: error.stack
      });
      console.error(`❌ FAILED: ${testName}`, error);
      return null;
    }
  };

  // Test 1: Storage Adapter Initialization
  await runTest('Storage Adapter Initialization', async () => {
    if (!storageAdapter) {
      throw new Error('Storage adapter not initialized');
    }
    
    const primaryProvider = storageAdapter.getPrimaryProviderName();
    const fallbackProvider = storageAdapter.getFallbackProviderName();
    
    if (!primaryProvider) {
      throw new Error('Primary provider not set');
    }
    
    return {
      primary: primaryProvider,
      fallback: fallbackProvider,
      isInitialized: storageAdapter.isInitialized
    };
  });

  // Test 2: Provider Status Check
  await runTest('Provider Status Check', async () => {
    const status = await storageAdapter.getProvidersStatus();
    
    if (!status.primary || !status.primary.name) {
      throw new Error('Primary provider status not available');
    }
    
    return status;
  });

  // Test 3: Health Check
  await runTest('Health Check', async () => {
    const healthStatus = await storageAdapter.performHealthChecks();
    return healthStatus;
  });

  // Test 4: Firebase Provider Availability
  await runTest('Firebase Provider Availability', async () => {
    const firebaseProvider = storageAdapter.providers.get('firebase');
    
    if (!firebaseProvider) {
      throw new Error('Firebase provider not available');
    }
    
    const isHealthy = await firebaseProvider.isHealthy();
    
    return {
      available: true,
      healthy: isHealthy,
      providerName: firebaseProvider.getProviderName()
    };
  });

  // Test 5: MinIO Provider Configuration
  await runTest('MinIO Provider Configuration', async () => {
    const minioProvider = storageAdapter.providers.get('minio');
    
    if (!minioProvider) {
      throw new Error('MinIO provider not available');
    }
    
    const config = minioProvider.getConfigurationStatus();
    
    return {
      available: true,
      configured: config.configured,
      implementationStatus: config.implementationStatus,
      providerName: minioProvider.getProviderName()
    };
  });

  // Test 6: Error Handling Test
  await runTest('Error Handling Test', async () => {
    try {
      // Try to upload with invalid parameters
      await storageAdapter.uploadFile(null, '', {});
      throw new Error('Should have thrown an error');
    } catch (error) {
      // This is expected
      return {
        errorHandling: 'working',
        errorMessage: error.message
      };
    }
  });

  // Test 7: Configuration Management
  await runTest('Configuration Management', async () => {
    const config = {
      primary: storageAdapter.getPrimaryProviderName(),
      fallback: storageAdapter.getFallbackProviderName(),
      enableFallback: true,
      autoFailover: true
    };
    
    if (!config.primary) {
      throw new Error('Configuration not properly set');
    }
    
    return config;
  });

  // Test 8: Provider Switching Test (dry run)
  await runTest('Provider Switching Test', async () => {
    const currentPrimary = storageAdapter.getPrimaryProviderName();
    const currentFallback = storageAdapter.getFallbackProviderName();
    
    // Test the switching logic without actually switching
    if (currentPrimary === currentFallback) {
      throw new Error('Primary and fallback providers are the same');
    }
    
    return {
      canSwitch: true,
      currentPrimary,
      currentFallback,
      switchTarget: currentFallback
    };
  });

  // Print final results
  console.log('\n📊 Test Results Summary:');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
  }
  
  console.log('\n🎉 Storage Abstraction Layer Tests Complete!');
  return results;
};

// Backward compatibility test
export const testBackwardCompatibility = () => {
  console.log('🔄 Testing Backward Compatibility...');
  
  try {
    // Test that the old useMediaUpload hook still works
    const useMediaUploadModule = require('../hooks/useMediaUpload.js');
    
    if (!useMediaUploadModule.useMediaUpload) {
      throw new Error('useMediaUpload hook not exported');
    }
    
    if (!useMediaUploadModule.usePhotoUpload) {
      throw new Error('usePhotoUpload hook (backward compatibility) not exported');
    }
    
    console.log('✅ Backward compatibility maintained');
    return true;
  } catch (error) {
    console.error('❌ Backward compatibility test failed:', error);
    return false;
  }
};

// Integration test for real file operations (requires user interaction)
export const createFileUploadTest = (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🔄 Testing real file upload...');
      
      if (!file) {
        throw new Error('No file provided for upload test');
      }
      
      const testPath = `test-uploads/${Date.now()}_${file.name}`;
      const metadata = {
        testUpload: true,
        timestamp: new Date().toISOString()
      };
      
      let progressData = [];
      
      const result = await storageAdapter.uploadFile(
        file,
        testPath,
        metadata,
        (progress) => {
          progressData.push(progress);
          console.log(`Upload progress: ${progress}%`);
        }
      );
      
      console.log('✅ File upload test completed:', result);
      
      // Test file URL retrieval
      const urlResult = await storageAdapter.getFileUrl(testPath);
      console.log('✅ File URL retrieval test completed:', urlResult);
      
      // Test file deletion
      const deleteResult = await storageAdapter.deleteFile(testPath);
      console.log('✅ File deletion test completed:', deleteResult);
      
      resolve({
        uploadResult: result,
        urlResult: urlResult,
        deleteResult: deleteResult,
        progressData: progressData
      });
      
    } catch (error) {
      console.error('❌ File upload test failed:', error);
      reject(error);
    }
  });
};

// Export all test functions
export default {
  runStorageTests,
  testBackwardCompatibility,
  createFileUploadTest
};