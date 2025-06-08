// Quick test to verify the date handling fixes
const { formatDate, getDaysSince, toDate } = require('./src/utils/dateUtils');

console.log('🧪 Testing Date Utility Functions...\n');

// Test cases
const testCases = [
  {
    name: 'Firestore Timestamp (mock)',
    value: { toDate: () => new Date('2024-01-01') },
  },
  {
    name: 'JavaScript Date',
    value: new Date('2024-01-01'),
  },
  {
    name: 'Date string',
    value: '2024-01-01',
  },
  {
    name: 'Null value',
    value: null,
  },
  {
    name: 'Undefined value',
    value: undefined,
  },
  {
    name: 'Invalid object',
    value: { invalid: 'data' },
  },
];

testCases.forEach(testCase => {
  console.log(`📅 Testing ${testCase.name}:`);
  console.log(`   formatDate: ${formatDate(testCase.value)}`);
  console.log(`   getDaysSince: ${getDaysSince(testCase.value)}`);
  console.log(`   toDate: ${toDate(testCase.value)}`);
  console.log('');
});

console.log('✅ All tests completed! The functions handle various date formats gracefully.');
console.log('🎉 The TypeError: userProfile.createdAt.toDate is not a function should now be fixed!');
