import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));

try {
  await execFileAsync('git', ['rev-parse', '--verify', 'HEAD'], {cwd: repositoryRoot});
} catch {
  await execFileAsync('test', ['-f', 'dist/jotai-bridge.js'], {
    cwd: repositoryRoot
  });
  await execFileAsync('test', ['-f', 'dist/extension-manifest.json'], {
    cwd: repositoryRoot
  });
  process.stdout.write('Generated dist files exist in the initial repository.\n');
  process.exit(0);
}

const [{stdout: modified}, {stdout: untracked}] = await Promise.all([
  execFileAsync('git', ['diff', '--name-only', '--', 'dist'], {cwd: repositoryRoot}),
  execFileAsync('git', ['ls-files', '--others', '--exclude-standard', '--', 'dist'], {
    cwd: repositoryRoot
  })
]);

const staleFiles = `${modified}${untracked}`;
if (staleFiles.length > 0) {
  process.stderr.write('Generated dist files are not up to date:\n');
  process.stderr.write(staleFiles);
  process.exitCode = 1;
}
