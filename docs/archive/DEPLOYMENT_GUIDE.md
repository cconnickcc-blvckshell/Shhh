# Shhh — Deployment Guide

> **Purpose:** How to deploy the Shhh backend, admin dashboard, and infrastructure.  
> **Audience:** DevOps, platform engineers.

---

## 1. Overview

| Component | Stack | Deployment |
|-----------|-------|-------------|
| Backend API | Node.js, Express, TypeScript | ECS (Docker) |
| Admin Dashboard | React, Vite | Static SPA (S3/CloudFront or served by backend) |
| Mobile | Expo, React Native | EAS Build → App Store / Play Store |
| Infrastructure | Terraform | AWS (VPC, ALB, ECS, RDS, ElastiCache) |

---

## 2. Prerequisites

- AWS account with appropriate permissions
- Terraform >= 1.5
- S3 bucket for Terraform state (`shhh-terraform-state`)
- Node.js 22 for local builds
- EAS CLI for mobile builds (`npm i -g eas-cli`)

---

## 3. Terraform

### Structure

| File | Purpose |
|------|---------|
| `main.tf` | Providers, backend (S3 state) |
| `vpc.tf` | VPC, subnets |
| `database.tf` | RDS (PostgreSQL + PostGIS) |
| `ecs.tf` | ECS cluster, task definition, service |
| `alb.tf` | Application Load Balancer |
| `variables.tf` | Input variables |
| `outputs.tf` | Outputs (endpoints, etc.) |

### Backend State

Terraform state is stored in S3:

```
bucket: shhh-terraform-state
key:    infrastructure/terraform.tfstate
region: us-east-1
```

Create the bucket and enable versioning before first run.

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `environment` | production | Deployment environment |
| `aws_region` | us-east-1 | Primary region |
| `domain_name` | shhh.app | Domain for ALB |
| `db_instance_class` | db.r6g.large | RDS instance |
| `redis_node_type` | cache.r6g.large | ElastiCache |
| `ecs_cpu` | 1024 | ECS task CPU |
| `ecs_memory` | 2048 | ECS task memory (MB) |
| `min_capacity` | 2 | Min ECS tasks |
| `max_capacity` | 20 | Max ECS tasks |

### Apply

```bash
cd terraform
terraform init
terraform plan -var-file=production.tfvars  # if using var file
terraform apply -var-file=production.tfvars
```

---

## 4. Backend Deployment (ECS)

### Build

```bash
cd backend
npm ci
npm run build
docker build -t shhh-backend:latest .
```

### Environment Variables (Production)

Set in ECS task definition or secrets manager:

- `DATABASE_URL` — RDS connection string
- `REDIS_URL` — ElastiCache connection string
- `MONGODB_URL` — DocumentDB or MongoDB Atlas (with `authSource=admin`)
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — Strong random strings
- `PHONE_HASH_PEPPER` — HMAC secret for phone hashing
- `NODE_ENV=production`
- `TWILIO_*` — For OTP in production
- `STRIPE_*` — For billing

### Migrations

**No automated migration in deploy pipeline.** Run manually after deploy:

```bash
DATABASE_URL=<prod_url> npm run migrate
```

Or add a migration step to your CI/CD (e.g. run before ECS service update).

---

## 5. Admin Dashboard Deployment

### Build

```bash
cd admin-dashboard
npm ci
npm run build
```

Output in `dist/`. Options:

1. **S3 + CloudFront:** Upload `dist/` to S3, serve via CloudFront. Configure `API_BASE` in build (e.g. `https://api.shhh.app`).
2. **Backend static:** Serve from Express `express.static('admin-dist')` if bundled with backend.
3. **Separate host:** Deploy to Vercel, Netlify, etc. Set `VITE_API_URL` or equivalent at build time.

---

## 6. CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

- **Triggers:** Push/PR to `main`
- **Jobs:** Backend lint, typecheck, test, build; Admin tsc, vite build
- **Tests:** Require Postgres, Redis, MongoDB services (configured in workflow)

### Branch Policy

CI runs on `main`. Development branches (e.g. `cursor/*`) do not trigger CI unless workflow is updated.

---

## 7. Staging vs Production

- Use Terraform `environment` variable or workspaces to separate staging/prod.
- Staging: Smaller instance sizes, single AZ if acceptable.
- Production: Multi-AZ RDS, ElastiCache cluster, min 2 ECS tasks.

---

## 8. Rollback

1. **ECS:** Revert task definition to previous revision. No automatic rollback.
2. **Database:** Migrations are forward-only. Restore from snapshot if critical.
3. **Terraform:** `terraform apply` with previous state if infra change caused issue.

---

## 9. Monitoring (Gaps)

- No Prometheus/metrics in codebase.
- No distributed tracing.
- Pino logs only. Consider CloudWatch Logs, Datadog, or similar for production.
