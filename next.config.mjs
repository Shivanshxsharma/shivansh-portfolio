import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // lets a verification build run beside the dev server without sharing .next
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // a stray lockfile in the home folder confuses workspace-root detection
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
};

export default nextConfig;
