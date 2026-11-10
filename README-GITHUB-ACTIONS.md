# Gym React frontend — GitHub Actions + S3

This package contains the production-built React frontend in `site/` and two GitHub Actions workflows.

## Repository layout

- `site/`: production build files to publish to S3
- `.github/workflows/deploy-s3.yml`: deploys `site/` to S3 on pushes to `main`
- `.github/workflows/lint-pr.yml`: runs HTML, CSS, and JavaScript checks on pull requests targeting `main`
- `.htmlhintrc`, `.stylelintrc.json`: lint configuration

## GitHub repository variables

Create these under Settings → Secrets and variables → Actions → Variables:

- `AWS_ROLE_ARN` = `arn:aws:iam::944296703570:role/GitHubGymDeployRole`
- `AWS_REGION` = `us-east-1`
- `S3_BUCKET_NAME` = `gym-bucket-s3-944296703570-us-east-1-an`

The deployment workflow uses GitHub OIDC. Do not add long-lived AWS access keys.

## Important notes

1. The uploaded archive was a production build, not the React source project. The deployment workflow therefore syncs the existing build directly; it does not run `npm install` or `npm run build`.
2. The PR workflow checks the built HTML/CSS/JS assets. For full source-level linting, add the original React source, `package.json`, and its lockfile, then configure ESLint/TypeScript linting against `src/`.
3. `aws s3 sync --delete` removes destination objects that are absent from `site/`. Use this only while the bucket is dedicated to this frontend.
4. The workflow expects the IAM role trust policy to allow this repository's `main` branch and the role's S3 policy to allow the required bucket operations.
