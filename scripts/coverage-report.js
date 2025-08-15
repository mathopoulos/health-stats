#!/usr/bin/env node
/**
 * Coverage monitoring and reporting script
 * Helps track test coverage progress and identify files that need tests
 */

const fs = require('fs');
const path = require('path');

function generateCoverageReport() {
  const coverageSummaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coverageSummaryPath)) {
    console.log('❌ No coverage data found. Run "npm run test:coverage" first.');
    process.exit(1);
  }

  const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
  const total = coverageData.total;

  console.log('📊 Test Coverage Report');
  console.log('=======================\n');

  // Overall Coverage
  console.log('📈 Overall Coverage:');
  console.log(`   Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
  console.log(`   Branches:   ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
  console.log(`   Functions:  ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
  console.log(`   Lines:      ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})\n`);

  // Coverage Status
  const statements = total.statements.pct;
  const branches = total.branches.pct;
  const functions = total.functions.pct;
  const lines = total.lines.pct;

  if (statements >= 80 && branches >= 70 && functions >= 75 && lines >= 80) {
    console.log('✅ Excellent coverage! Keep it up!');
  } else if (statements >= 60 && branches >= 50 && functions >= 60 && lines >= 60) {
    console.log('👍 Good coverage. Room for improvement in some areas.');
  } else if (statements >= 40 && branches >= 30 && functions >= 40 && lines >= 40) {
    console.log('⚠️  Moderate coverage. Consider adding more tests.');
  } else {
    console.log('🚨 Low coverage. Focus on adding tests for critical paths.');
  }

  // Find files with no coverage
  console.log('\n🔍 Files needing tests:');
  let uncoveredFiles = [];
  
  Object.entries(coverageData).forEach(([filePath, data]) => {
    if (filePath === 'total') return;
    
    if (data.statements.pct === 0) {
      uncoveredFiles.push(filePath.replace(process.cwd() + '/', ''));
    }
  });

  if (uncoveredFiles.length > 0) {
    // Group by feature/directory
    const groupedFiles = uncoveredFiles.reduce((groups, file) => {
      const dir = path.dirname(file).split('/')[1] || 'root'; // Get first directory after src/
      if (!groups[dir]) groups[dir] = [];
      groups[dir].push(file);
      return groups;
    }, {});

    Object.entries(groupedFiles).forEach(([dir, files]) => {
      console.log(`\n   📁 ${dir}:`);
      files.slice(0, 5).forEach(file => {
        console.log(`      - ${file}`);
      });
      if (files.length > 5) {
        console.log(`      ... and ${files.length - 5} more files`);
      }
    });
  } else {
    console.log('   🎉 All files have some test coverage!');
  }

  console.log('\n💡 Tips:');
  console.log('   - Focus on testing utility functions in src/lib/ first');
  console.log('   - Add tests for critical user flows in dashboard components');
  console.log('   - Use "npm run test:coverage:watch" while developing');
  console.log('   - View detailed coverage: open coverage/lcov-report/index.html\n');
}

try {
  generateCoverageReport();
} catch (error) {
  console.error('❌ Error generating coverage report:', error.message);
  process.exit(1);
}
