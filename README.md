# Evening Gym Tracker

React + Vite app that walks through the 4-day evening workout set by set, with a stopwatch
for each activity, a 1:30 rest countdown, and a ringing alarm before the next one.

## Run locally
```
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for the plan and the timer flow
```

## Change the workout
Everything (exercises, sets, reps, form cues, cardio) is in `src/data/plan.js`.
Rest lengths are set in the app (lifting 1:30, warm-up 0:30) and remembered per browser.

## Build
```
npm run build      # outputs dist/
```
`dist/` is plain static files (HTML, JS, CSS). It uses relative paths, so it works at the
bucket root, in a sub-folder, or behind CloudFront.

## Host on S3

### Recommended: private bucket + CloudFront (HTTPS)
The "keep screen awake" feature and Add to Home Screen need HTTPS. An S3 website endpoint is
HTTP only, so put CloudFront in front.

1. S3 > Create bucket. Leave "Block all public access" ON.
2. CloudFront > Create distribution. Origin: the bucket. Origin access: create an
   Origin Access Control (OAC). Default root object: `index.html`.
3. CloudFront shows a bucket policy to copy. Paste it into the bucket's Permissions > Bucket policy.
4. Upload the build (below). Open the `https://xxxx.cloudfront.net` address.

### Simple: S3 static website (HTTP only)
1. Create the bucket, then Properties > Static website hosting > Enable, index document `index.html`.
2. Permissions > turn off "Block all public access", then add this bucket policy
   (replace `YOUR-BUCKET`):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR-BUCKET/*"
  }]
}
```
3. Upload the build (below). Use the website endpoint shown under Static website hosting.

### Upload the build

**Without Node or the AWS CLI:** S3 console > your bucket > Upload > drag in the
*contents* of `dist/` (the `assets` folder and `index.html`, not the `dist` folder itself).

**With the AWS CLI** (`aws configure` done once):
```
# PowerShell
$env:S3_BUCKET="your-bucket-name"
$env:CLOUDFRONT_DISTRIBUTION_ID="E123ABC456"   # optional
npm run deploy

# or
npm run deploy -- your-bucket-name
```
The script uploads `assets/` (hashed filenames) with a 1-year cache, uploads `index.html`
with `no-cache` so updates show up straight away, removes old files, and clears
CloudFront's cached `index.html` when a distribution id is set.

## Notes
- Progress (current step) and settings are saved in the browser's localStorage. Progress
  resets each calendar day. Each browser/device keeps its own.
- Sound needs one tap first (browser rule); pressing Start does that.
- Fonts load from Google Fonts. Without a connection the app falls back to system fonts.
