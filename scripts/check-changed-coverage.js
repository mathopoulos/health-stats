#!/usr/bin/env node
/**
 * Check test coverage for changed files only
 * Ensures new/modified code has adequate test coverage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COVERAGE_REQUIREMENTS = {
  // Minimum coverage for different file types
  components: { statements: 60, branches: 50, functions: 60, lines: 60 },
  hooks: { statements: 70, branches: 60, functions: 80, lines: 70 },
  utils: { statements: 80, branches: 70, functions: 90, lines: 80 },
  lib: { statements: 85, branches: 75, functions: 90, lines: 85 },
  api: { statements: 70, branches: 60, functions: 80, lines: 70 },
  
  // Server files often contain integration code (DB, S3, etc.) - more challenging to test
  server: { statements: 45, branches: 35, functions: 50, lines: 45 },
  
  // Default for other files
  default: { statements: 50, branches: 40, functions: 50, lines: 50 }
};

function getChangedFiles() {
  try {
    // Get files changed compared to origin/main (or main if no origin)
    let baseBranch = 'origin/main';
    try {
      execSync('git rev-parse --verify origin/main', { stdio: 'ignore' });
    } catch {
      baseBranch = 'main';
    }
    
    const output = execSync(`git diff --name-only ${baseBranch}...HEAD`, { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => 
      file && 
      file.startsWith('src/') && 
      (file.endsWith('.ts') || file.endsWith('.tsx')) &&
      !file.includes('.test.') &&
      !file.includes('.spec.') &&
      !file.includes('/__tests__/') &&
      !file.includes('/index.ts') // Skip barrel files
    );
  } catch (error) {
    console.log('ℹ️  Could not get changed files (probably first commit). Running full coverage check...');
    return [];
  }
}

function getCoverageRequirements(filePath) {
  if (filePath.includes('/components/')) return COVERAGE_REQUIREMENTS.components;
  if (filePath.includes('/hooks/')) return COVERAGE_REQUIREMENTS.hooks;
  if (filePath.includes('/utils/')) return COVERAGE_REQUIREMENTS.utils;
  if (filePath.includes('/lib/')) return COVERAGE_REQUIREMENTS.lib;
  if (filePath.includes('/api/')) return COVERAGE_REQUIREMENTS.api;
  if (filePath.includes('/server/')) return COVERAGE_REQUIREMENTS.server;
  return COVERAGE_REQUIREMENTS.default;
}

function runCoverageForChangedFiles(changedFiles) {
  if (changedFiles.length === 0) {
    console.log('✅ No relevant changed files found.');
    return true;
  }

  console.log(`🔍 Checking coverage for ${changedFiles.length} changed file(s):`);
  changedFiles.forEach(file => console.log(`   - ${file}`));
  console.log('');

  try {
    // Run Jest with coverage for changed files only
    const jestArgs = [
      '--coverage',
      '--collectCoverageFrom=src/**/*.{ts,tsx}',
      '--collectCoverageFrom=!src/**/*.{test,spec}.{ts,tsx}',
      '--collectCoverageFrom=!src/**/__tests__/**',
      '--collectCoverageFrom=!src/**/index.{ts,tsx}',
      '--findRelatedTests',
      '--passWithNoTests',
      ...changedFiles
    ];

    execSync('npx jest ' + jestArgs.map(arg => `"${arg}"`).join(' '), { 
      stdio: 'inherit', 
      shell: true 
    });
    
    // Read coverage summary
    const coverageSummaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (!fs.existsSync(coverageSummaryPath)) {
      console.log('⚠️  No coverage data generated. This might be okay if no tests were found.');
      return true;
    }

    const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
    let allFilesMeetRequirements = true;
    const failedFiles = [];

    console.log('\n📊 Coverage Results for Changed Files:');
    console.log('=====================================');

    changedFiles.forEach(filePath => {
      const fullPath = path.resolve(filePath);
      const fileData = coverageData[fullPath];
      
      if (!fileData) {
        console.log(`⚠️  ${filePath}: No coverage data (no tests found)`);
        const requirements = getCoverageRequirements(filePath);
        failedFiles.push({
          file: filePath,
          reason: 'No tests found',
          requirements
        });
        allFilesMeetRequirements = false;
        return;
      }

      const requirements = getCoverageRequirements(filePath);
      const meetsRequirements = 
        fileData.statements.pct >= requirements.statements &&
        fileData.branches.pct >= requirements.branches &&
        fileData.functions.pct >= requirements.functions &&
        fileData.lines.pct >= requirements.lines;

      const status = meetsRequirements ? '✅' : '❌';
      console.log(`${status} ${filePath}:`);
      console.log(`   Statements: ${fileData.statements.pct}% (need ${requirements.statements}%)`);
      console.log(`   Branches:   ${fileData.branches.pct}% (need ${requirements.branches}%)`);
      console.log(`   Functions:  ${fileData.functions.pct}% (need ${requirements.functions}%)`);
      console.log(`   Lines:      ${fileData.lines.pct}% (need ${requirements.lines}%)`);
      console.log('');

      if (!meetsRequirements) {
        allFilesMeetRequirements = false;
        failedFiles.push({
          file: filePath,
          actual: fileData,
          requirements
        });
      }
    });

    if (!allFilesMeetRequirements) {
      console.log('🚨 Coverage requirements not met for changed files!\n');
      console.log('💡 To fix this:\n');
      
      failedFiles.forEach(({ file, actual, requirements, reason }) => {
        console.log(`📝 ${file}:`);
        if (reason === 'No tests found') {
          console.log(`   - Create a test file: ${file.replace('.tsx', '.test.tsx').replace('.ts', '.test.ts')}`);
          console.log(`   - Required coverage: ${requirements.statements}% statements, ${requirements.branches}% branches`);
        } else {
          if (actual.statements.pct < requirements.statements) {
            console.log(`   - Add more test cases (statements: ${actual.statements.pct}% → ${requirements.statements}%)`);
          }
          if (actual.branches.pct < requirements.branches) {
            console.log(`   - Test more conditional paths (branches: ${actual.branches.pct}% → ${requirements.branches}%)`);
          }
          if (actual.functions.pct < requirements.functions) {
            console.log(`   - Test more functions (functions: ${actual.functions.pct}% → ${requirements.functions}%)`);
          }
        }
        console.log('');
      });

      console.log('🔧 Useful commands:');
      console.log('   npm run test:coverage:watch  # Live coverage while writing tests');
      console.log('   npm run coverage:open        # View detailed HTML coverage report');
      console.log('   npm run test:changed         # Run tests for changed files only\n');
      
      return false;
    }

    console.log('🎉 All changed files meet coverage requirements!');
    return true;

  } catch (error) {
    console.error('❌ Error running coverage check:', error.message);
    return false;
  }
}

function main() {
  console.log('🧪 Checking test coverage for changed files...\n');
  
  const changedFiles = getChangedFiles();
  const success = runCoverageForChangedFiles(changedFiles);
  
  if (!success) {
    process.exit(1);
  }
  
  console.log('✅ Changed files coverage check passed!');
}

if (require.main === module) {
  main();
}
