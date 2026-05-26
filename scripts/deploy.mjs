import { spawnSync } from 'node:child_process';

const provider = process.argv[2];

const commands = {
  vercel: ['npx', ['vercel', '--prod']],
  netlify: ['npx', ['netlify', 'deploy', '--prod', '--dir=dist']],
  cloudflare: ['npx', ['wrangler', 'pages', 'deploy', 'dist']],
  railway: ['npx', ['railway', 'up']],
};

if (!provider || !commands[provider]) {
  console.error('Usage: node scripts/deploy.mjs <vercel|netlify|cloudflare|railway>');
  process.exit(1);
}

const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

const [command, args] = commands[provider];
const deploy = spawnSync(command, args, { stdio: 'inherit', shell: true });
process.exit(deploy.status ?? 0);
