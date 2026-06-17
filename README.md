# cinematography-portfolio

Portfolio website built with React (Vite SPA). Hosting infrastructure — S3, CloudFront,
API Gateway, Lambda, DynamoDB, and Cognito — is provisioned on AWS with Terraform.

## Layout

```
frontend/          React + Vite single-page app
infra/terraform/   AWS infrastructure (Terraform); Lambda sources live in api/
infra/deploy/      Python helper that syncs the built frontend to S3 + invalidates CloudFront
scripts/           build.sh (build frontend), deploy.sh (deploy frontend), format.sh (format frontend + backend)
```

Terraform state is stored remotely in S3 (`s3://dkavalchek-terraform`), so Terraform can be
run from any machine with AWS credentials.

## Deploying

Pushes to `main` deploy automatically via GitHub Actions:

- **`deploy-frontend.yaml`** — builds the frontend and uploads it on every push to `main`.
- **`deploy-backend.yaml`** — runs `terraform apply`, but only when files under `infra/terraform/**` change.

Pull requests are gated by **`validate.yaml`** (Prettier, `terraform fmt -check`, frontend build, `terraform validate`).

### Manual deploy

Requires the AWS CLI configured with credentials, plus Node, [uv](https://docs.astral.sh/uv/),
and Terraform installed. All scripts can be run from any directory.

**Frontend:**

```bash
./scripts/build.sh     # tsc + vite build -> frontend/dist
./scripts/deploy.sh    # upload dist to S3 and invalidate the CloudFront cache
```

The build reads `VITE_API_URL`, `VITE_COGNITO_USER_POOL_ID`, and
`VITE_COGNITO_USER_POOL_CLIENT_ID` from `frontend/.env` (see Terraform outputs for the values).

**Backend (infrastructure):**

First-time setup on a new machine or fresh checkout — run `init` once to configure the
S3 backend and download providers. State lives remotely in S3, so there is nothing to
create locally; `init` just connects this working directory to the existing state:

```bash
terraform -chdir=infra/terraform init
```

`init` is a per-checkout step (the `.terraform/` directory it creates is git-ignored), and
needs to be re-run only when the backend or provider configuration changes. Once initialized:

```bash
terraform -chdir=infra/terraform plan    # review changes
terraform -chdir=infra/terraform apply   # provision
```

If `init` reports a backend configuration mismatch, re-run it with `-reconfigure`.

## Local development

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

## Formatting

```bash
./scripts/format.sh
```
