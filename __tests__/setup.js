// Test setup file
require('dotenv').config({ path: './.env.test' });

// Mock console.error to avoid noise in test output
console.error = jest.fn();