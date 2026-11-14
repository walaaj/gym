# Evening Gym Tracker

React + Vite workout tracker with Cognito sign-in. The app saves each user's daily workout progress and preferences through API Gateway, Lambda and DynamoDB.

## Run locally

Requires Node.js 20.19+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run build
```

Copy `.env.example` to `.env.local` and adjust values if needed. Do not commit `.env.local`.

## Sign-in (Amazon Cognito)

| Setting | Value |
|---|---|
| Region | `us-east-1` |
| User Pool ID | `us-east-1_OD7v6dkC1` |
| App client ID | `4bidos6cf9frbp2si5f9jptfp1` |
| Issuer | `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_OD7v6dkC1` |
| Local callback / sign-out URL | `http://localhost:5173/` |
| Flow and scopes | Authorization code, `openid email` |

The app uses Cognito's hosted sign-in and registration flow. Tokens are kept in `sessionStorage`; no client secret belongs in browser code.

Set the production callback URL to the site's HTTPS URL in the Cognito app client. An S3 static website endpoint is HTTP-only, so Cognito production sign-in requires HTTPS (for example, CloudFront in front of the S3 bucket).

## Backend API

Default API Gateway URL:

`https://7ikru6j381.execute-api.us-east-1.amazonaws.com`

Override it with `VITE_API_BASE_URL`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/progress` | Load the signed-in user's progress for the current Beirut calendar date |
| `PUT` | `/progress` | Save the current plan, version, step and completed steps |
| `GET` | `/settings` | Load the signed-in user's workout preferences |
| `PUT` | `/settings` | Save workout preferences |

Every API request sends the Cognito **access token** as a Bearer token. API Gateway's JWT authorizer validates it. The Lambda uses the verified token `sub` claim as the user key; the browser does not send a user ID.

Progress payload:

```json
{
  "planId": "fri",
  "planVersion": "1",
  "currentStep": 12,
  "completedSteps": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
}
```

Settings payload:

```json
{
  "settings": {
    "restSec": 90,
    "warmRest": 30,
    "sound": true
  }
}
```

The backend stores one progress item per user per date, using `Asia/Beirut` for the date boundary. Preferences are stored separately per user. The frontend silently renews an expired access token once and retries a request after a 401. If renewal fails, it asks the user to sign in again.

The current backend has no workout-history, notes, or delete-workout endpoints. The frontend therefore focuses on today's saved progress and account-level settings; the former `/workouts` history panel is not displayed.

## Where to change the workout

Workout plans, exercises, sets, reps and cues are in `src/data/plan.js`. The app uses the weekday key (`mon`, `tue`, etc.) as the `planId`. Increment `PLAN_VERSION` in `src/hooks/useWorkoutSync.js` when you make a change that should invalidate or distinguish saved progress for an updated plan.

## Deployment

The existing frontend GitHub Actions workflow builds the Vite app and deploys `dist/` to the S3 static website bucket. Set these GitHub repository variables under **Settings → Secrets and variables → Actions → Variables**:

| Variable | Value |
|---|---|
| `AWS_ROLE_ARN` | `arn:aws:iam::944296703570:role/GitHubGymDeployRole` |
| `AWS_REGION` | `us-east-1` |
| `S3_BUCKET_NAME` | `gym-bucket-s3-944296703570-us-east-1-an` |
| `COGNITO_REDIRECT_URI` | The production HTTPS URL |
| `API_BASE_URL` | `https://7ikru6j381.execute-api.us-east-1.amazonaws.com` |

The frontend deployment role should only need the permissions required to publish the static site to its S3 bucket. It does not need Lambda or DynamoDB permissions.
