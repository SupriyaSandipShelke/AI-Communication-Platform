#!/bin/bash

# Proof script that runs exact same commands as GitHub Actions
# This proves that all TypeScript errors are resolved

echo "🔍 Proving TypeScript compilation works..."
echo "Date: $(date)"
echo "Directory: $(pwd)"
echo ""

echo "1. Installing dependencies..."
npm ci
echo "✅ Dependencies installed"
echo ""

echo "2. Running TypeScript compilation check..."
npx tsc --noEmit -p tsconfig.server.json
if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation: SUCCESS"
else
    echo "❌ TypeScript compilation: FAILED"
    exit 1
fi
echo ""

echo "3. Building server..."
npm run build:server
if [ $? -eq 0 ]; then
    echo "✅ Server build: SUCCESS"
else
    echo "❌ Server build: FAILED"
    exit 1
fi
echo ""

echo "4. Installing client dependencies..."
cd client
npm ci
echo "✅ Client dependencies installed"
echo ""

echo "5. Building client..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Client build: SUCCESS"
else
    echo "❌ Client build: FAILED"
    exit 1
fi
echo ""

echo "🎉 ALL CHECKS PASSED!"
echo "✅ TypeScript Compilation: SUCCESS"
echo "✅ Server Build: SUCCESS"
echo "✅ Client Build: SUCCESS"
echo ""
echo "This proves that all TypeScript errors are resolved!"
echo "GitHub Actions should pass with the same commands."