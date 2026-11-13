# Gym React frontend — GitHub Actions + S3

The repository root is the Vite + React source of the Evening Gym Tracker (see `README.md`).
Two GitHub Actions workflows build and check it, then publish it to S3.

## Repository layout

- `src/`, `public/`, `index.html`, `vite.config.js`: React source (build output goes to `dist/`, git-ignored)
- `scripts/deploy.mjs`: uploads `dist/` to S3 with cache headers (used by the deploy workflow and `npm run deploy`)
- `.github/workflows/lint-pr.yml`: on pull requests to `main`, runs `npm ci`, unit tests, the build, HTMLHint, Stylelint on `src/**/*.css` and ESLint on the built bundles
- `.github/workflows/deploy-s3.yml`: on pushes to `main`, runs `npm ci`, tests and the build, then deploys `dist/` to S3 via `scripts/deploy.mjs`
- `.htmlhintrc`, `.stylelintrc.json`: lint configuration

## GitHub repository variables

Create these under Settings → Secrets and variables → Actions → Variables:

- `AWS_ROLE_ARN` = `arn:aws:iam::944296703570:role/GitHubGymDeployRole`
- `AWS_REGION` = `us-east-1`
- `S3_BUCKET_NAME` = `gym-bucket-s3-944296703570-us-east-1-an`

The deployment workflow uses GitHub OIDC. Do not add long-lived AWS access keys.

## Important notes

1. Both workflows only run when app source, dependencies, build config or the workflow itself changes.
2. ESLint runs against the built bundles with `no-debugger` only; minified vendor code makes structural rules such as `no-unreachable` report false positives. For source-level linting, add an `eslint.config.js` with React/JSX support and lint `src/`.
3. The deploy removes objects in the bucket that are not in the new build. Use it only while the bucket is dedicated to this frontend.
4. The workflow expects the IAM role trust policy to allow this repository's `main` branch and the role's S3 policy to allow the required bucket operations.
