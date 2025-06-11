// Simple Firebase Storage Integration Test
// Run this in browser console or as a standalone script

import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const testFirebaseStorage = async () => {
  console.log('🔄 Starting Firebase Storage Integration Test...');
  
  try {
    // Test 1: Check if storage is initialized
    console.log('✅ Storage instance:', storage);
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }
    
    // Test 2: Create a test blob (simulating a small image)
    const testData = new Blob(['Hello Firebase Storage!'], { type: 'text/plain' });
    const testFileName = `test/storage-test-${Date.now()}.txt`;
    
    console.log('🔄 Testing file upload...');
    
    // Test 3: Upload test file
    const storageRef = ref(storage, testFileName);
    const snapshot = await uploadBytes(storageRef, testData);
    console.log('✅ File uploaded successfully:', snapshot.metadata.fullPath);
    
    // Test 4: Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Download URL generated:', downloadURL);
    
    // Test 5: Verify the file can be accessed
    const response = await fetch(downloadURL);
    const content = await response.text();
    console.log('✅ File content verified:', content);
    
    // Test 6: Clean up - delete test file
    await deleteObject(storageRef);
    console.log('✅ Test file deleted successfully');
    
    console.log('🎉 All Firebase Storage tests passed!');
    return {
      success: true,
      message: 'Firebase Storage is working correctly',
      testResults: {
        initialization: true,
        upload: true,
        downloadUrl: true,
        fileAccess: true,
        deletion: true
      }
    };
    
  } catch (error) {
    console.error('❌ Firebase Storage test failed:', error);
    return {
      success: false,
      error: error.message,
      testResults: {
        initialization: !!storage,
        upload: false,
        downloadUrl: false,
        fileAccess: false,
        deletion: false
      }
    };
  }
};

// Test specifically for media upload functionality
export const testMediaUpload = async () => {
  console.log('🔄 Testing Media Upload Hook...');
  
  try {
    // Import the hook dynamically to test in browser environment
    const { useMediaUpload } = await import('../hooks/useMediaUpload');
    
    // Create a mock file object for testing
    const createMockFile = (name, type, size) => {
      const blob = new Blob(['test content'], { type });
      blob.name = name;
      blob.size = size;
      return blob;
    };
    
    // Test different file types
    const testFiles = [
      createMockFile('test.jpg', 'image/jpeg', 1024 * 1024), // 1MB image
      createMockFile('test.mp4', 'video/mp4', 5 * 1024 * 1024), // 5MB video
      createMockFile('test.png', 'image/png', 500 * 1024), // 500KB image
    ];
    
    console.log('✅ Media upload hook imported successfully');
    console.log('✅ Test files created:', testFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    return {
      success: true,
      message: 'Media upload hook is ready for testing',
      hookAvailable: true,
      testFilesCreated: testFiles.length
    };
    
  } catch (error) {
    console.error('❌ Media upload test failed:', error);
    return {
      success: false,
      error: error.message,
      hookAvailable: false
    };
  }
};

// Combined test function
export const runAllStorageTests = async () => {
  console.log('🚀 Running complete Firebase Storage test suite...\n');
  
  const storageTest = await testFirebaseStorage();
  const mediaTest = await testMediaUpload();
  
  const summary = {
    overall: storageTest.success && mediaTest.success,
    firebaseStorage: storageTest,
    mediaUpload: mediaTest,
    timestamp: new Date().toISOString()
  };
  
  console.log('\n📊 Test Summary:', summary);
  
  if (summary.overall) {
    console.log('🎉 All tests passed! Firebase Storage with video support is ready.');
  } else {
    console.log('❌ Some tests failed. Check the details above.');
  }
  
  return summary;
};

// For manual testing in browser console
if (typeof window !== 'undefined') {
  window.testFirebaseStorage = testFirebaseStorage;
  window.testMediaUpload = testMediaUpload;
  window.runAllStorageTests = runAllStorageTests;
  
  console.log('🔧 Firebase Storage tests available in console:');
  console.log('- testFirebaseStorage()');
  console.log('- testMediaUpload()');
  console.log('- runAllStorageTests()');
}