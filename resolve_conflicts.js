import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROTECTED_FOLDERS = [
  '.github/workflows/',
  'filters/filter_15_DnsFilter',
  'filters/filter_24_QuickFixes',
  'filters/filter_12_Safari',
];

const PROTECTED_FILENAMES = [
  '12_optimized.txt',
  '12.txt',
  '15_optimized.txt',
  '15.txt',
  '24_optimized.txt',
  '24.txt',
];

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (e) {
    return '';
  }
}

async function main() {
  const conflictedFiles = run('git diff --name-only --diff-filter=U').split('\n').filter(Boolean);

  if (conflictedFiles.length === 0) {
    console.log('No merge conflicts found.');
    return;
  }

  console.log(`Found ${conflictedFiles.length} conflicted files.`);

  for (const file of conflictedFiles) {
    const fileName = path.basename(file);
    const isInProtectedFolder = PROTECTED_FOLDERS.some(folder => file.startsWith(folder));
    const isProtectedFile = PROTECTED_FILENAMES.includes(fileName);

    if (isInProtectedFolder || isProtectedFile) {
      console.log(`Accepting CURRENT changes for: ${file}`);
      run(`git checkout --ours "${file}"`);
      run(`git add "${file}"`);
    } else {
      console.log(`Accepting INCOMING changes for: ${file}`);
      run(`git checkout --theirs "${file}"`);
      run(`git add "${file}"`);
    }
  }

  console.log('Conflict resolution complete.');
}

main().catch(console.error);
