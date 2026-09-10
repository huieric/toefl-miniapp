// Verify all server modules can be loaded
const fs = require('fs');
const path = require('path');

let ok = 0, fail = 0;
let errors = [];

// Test routes
const routesDir = 'D:/TapTap游戏赛道调研/toefl-miniapp/server/src/routes';
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

for (const f of routeFiles) {
  try {
    require(path.join(routesDir, f));
    ok++;
  } catch (e) {
    fail++;
    errors.push('routes/' + f + ': ' + e.message.split('\n')[0]);
  }
}

// Test services
const servicesDir = 'D:/TapTap游戏赛道调研/toefl-miniapp/server/src/services';
const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));

for (const f of serviceFiles) {
  try {
    require(path.join(servicesDir, f));
    ok++;
  } catch (e) {
    fail++;
    errors.push('services/' + f + ': ' + e.message.split('\n')[0]);
  }
}

// Test middlewares
const middlewaresDir = 'D:/TapTap游戏赛道调研/toefl-miniapp/server/src/middleware';
const middlewareFiles = fs.readdirSync(middlewaresDir).filter(f => f.endsWith('.js'));

for (const f of middlewareFiles) {
  try {
    require(path.join(middlewaresDir, f));
    ok++;
  } catch (e) {
    fail++;
    errors.push('middleware/' + f + ': ' + e.message.split('\n')[0]);
  }
}

// Test seed data
try {
  require('D:/TapTap游戏赛道调研/toefl-miniapp/server/src/data/default-passages');
  ok++;
  console.log('  OK data/default-passages');
} catch (e) {
  fail++;
  errors.push('data/default-passages: ' + e.message.split('\n')[0]);
}

try {
  require('D:/TapTap游戏赛道调研/toefl-miniapp/server/src/data/seed-defaults');
  ok++;
} catch (e) {
  fail++;
  errors.push('data/seed-defaults: ' + e.message.split('\n')[0]);
}

// Config
try {
  require('D:/TapTap游戏赛道调研/toefl-miniapp/server/src/config');
  ok++;
} catch (e) {
  fail++;
  errors.push('config: ' + e.message.split('\n')[0]);
}

console.log('\n========================================');
console.log('Module Import Verification');
console.log('========================================');
console.log('Passed: ' + ok);
console.log('Failed: ' + fail);
if (errors.length) {
  console.log('\nErrors:');
  errors.forEach(e => console.log('  - ' + e));
}
if (fail > 0) process.exit(1);
