// Uploads dist/ to S3 with sensible cache headers. Run through: npm run deploy
//
//   S3_BUCKET=my-bucket npm run deploy          (bash)
//   $env:S3_BUCKET="my-bucket"; npm run deploy  (PowerShell)
//   npm run deploy -- my-bucket                 (either)
//
// Optional: CLOUDFRONT_DISTRIBUTION_ID  clears the cached index.html after upload.
// Uses your normal AWS CLI credentials (AWS_PROFILE, aws configure, etc.).

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const bucket = process.argv[2] || process.env.S3_BUCKET
const distribution = process.env.CLOUDFRONT_DISTRIBUTION_ID

if (!bucket) {
  console.error('Missing bucket name. Set S3_BUCKET or run: npm run deploy -- <bucket-name>')
  process.exit(1)
}
if (!existsSync('dist/index.html')) {
  console.error('dist/ not found. Run: npm run build')
  process.exit(1)
}

const aws = (...args) => {
  console.log(`\n> aws ${args.join(' ')}`)
  execFileSync('aws', args, { stdio: 'inherit' })
}

const target = `s3://${bucket}`
const IMMUTABLE = 'public,max-age=31536000,immutable'
const REVALIDATE = 'no-cache'

// 1. New hashed files first, so the old page keeps working during the upload.
aws('s3', 'sync', 'dist/assets', `${target}/assets`, '--cache-control', IMMUTABLE)
// 2. Everything else (index.html, favicon) always revalidates.
aws('s3', 'sync', 'dist', target, '--exclude', 'assets/*', '--delete', '--cache-control', REVALIDATE)
// 3. Remove hashed files from older builds.
aws('s3', 'sync', 'dist/assets', `${target}/assets`, '--delete', '--cache-control', IMMUTABLE)

if (distribution) {
  aws('cloudfront', 'create-invalidation', '--distribution-id', distribution, '--paths', '/index.html', '/favicon.svg')
}

console.log('\nDeployed.')
