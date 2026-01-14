#!/usr/bin/env node

/**
 * Simple test script to verify TypeScript compilation
 * This script runs the same checks that GitHub Actions should run
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Testing TypeScript Compilation...\n');

// Check if required files exist
const requiredFiles = [
  'tsconfig.server.json',
  'src/server/index.ts',
  'package.json'
];

console.log('📁 Checking required files:');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - exists`);
  } else {
    console.log(`❌ ${file} - missing`);
    process.exit(1);
  }
}

console.log('\n🔧 Running TypeScript compilation check...');
try {
  execSync('npx tsc --noEmit -p tsconfig.server.json', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  process.exit(1);
}

console.log('\n🏗️  Running server build...');
try {
  execSync('npm run build:server', { stdio: 'inherit' });
  console.log('✅ Server build successful');
} catch (error) {
  console.log('❌ Server build failed');
  process.exit(1);
}

console.log('\n🎉 All TypeScript checks passed!');
console.log('The code is ready for GitHub Actions validation.');