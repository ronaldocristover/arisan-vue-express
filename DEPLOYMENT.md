# Deployment Guide

## GitHub Actions CI/CD with DigitalOcean Container Registry

This guide covers the setup for automated Docker builds and deployment using GitHub Actions and DigitalOcean Container Registry.

### Prerequisites

1. **DigitalOcean Account** with Container Registry enabled
2. **GitHub Repository** with the Arisan App code
3. **Docker** installed locally (for testing)

### Required Secrets in GitHub

Set up the following repository secrets in GitHub (`Settings > Secrets and variables > Actions`):

1. `DIGITALOCEAN_ACCESS_TOKEN` - Your DigitalOcean API token
2. `DIGITALOCEAN_REGISTRY_NAMESPACE` - Your DigitalOcean Container Registry namespace
3. `DATABASE_URL` - Production database connection string
4. `JWT_SECRET` - JWT secret for production
5. `AWS_ACCESS_KEY_ID` - AWS access key (if using S3)
6. `AWS_SECRET_ACCESS_KEY` - AWS secret key (if using S3)
7. `AWS_REGION` - AWS region (if using S3)
8. `AWS_S3_BUCKET_NAME` - S3 bucket name (if using S3)
9. `AWS_ENDPOINT` - Custom S3 endpoint (if using DigitalOcean Spaces)
10. `AWS_PUBLIC_URL` - Public URL for S3 files (if applicable)

### Setup Steps

#### 1. Create DigitalOcean Container Registry

```bash
# Install doctl
curl -sL https://github.com/digitalocean/doctl/releases/download/v1.100.0/doctl-1.100.0-linux-amd64.tar.gz | tar xz
sudo mv doctl /usr/local/bin

# Authenticate with DigitalOcean
doctl auth init

# Create container registry
doctl registry create arisan-registry

# Get your registry namespace
doctl registry get
```

#### 2. Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to `Settings > Secrets and variables > Actions`
3. Click `New repository secret` and add each required secret from the list above

#### 3. Update .do/app.yaml

Edit `.do/app.yaml` to match your specific configuration:

```yaml
# Update the GitHub repository name
github:
  repo: your-username/arisan-app  # Change this
  branch: main

# Update your domain
domains:
- domain: your-domain.com  # Change this
  type: PRIMARY
```

#### 4. Push to Trigger Workflow

The workflow will automatically trigger on pushes to `main` or `develop` branches, and on pull requests targeting `main`.

### Workflow Features

#### Build and Push (main/develop branches)
- Builds Docker images for backend and frontend
- Pushes to DigitalOcean Container Registry
- Tags images with branch name and commit SHA
- Caches layers for faster builds

#### Test Builds (Pull Requests)
- Builds images without pushing
- Runs basic container health checks
- Validates Dockerfiles work correctly

#### Security Scans
- Scans images for vulnerabilities
- Provides security reports
- Runs on every push

#### Production Deployment (main branch only)
- Deploys to DigitalOcean App Platform
- Updates app specification with new image tags
- Requires manual approval via GitHub environments

### Local Testing

#### Test Docker Build Locally

```bash
# Build backend
docker build -t arisan-backend:test ./backend

# Build frontend
docker build -t arisan-frontend:test ./frontend

# Test containers
docker-compose up -d
```

#### Test DigitalOcean Registry Push

```bash
# Login to registry
doctl registry login

# Tag and push backend
docker tag arisan-backend:test registry.digitalocean.com/your-namespace/arisan-app-backend:test
docker push registry.digitalocean.com/your-namespace/arisan-app-backend:test

# Tag and push frontend
docker tag arisan-frontend:test registry.digitalocean.com/your-namespace/arisan-app-frontend:test
docker push registry.digitalocean.com/your-namespace/arisan-app-frontend:test
```

### Environment-Specific Configurations

#### Development
- Triggered on pushes to `develop` branch
- Images tagged as `develop-<commit-sha>`
- No automatic deployment

#### Production
- Triggered on pushes to `main` branch
- Images tagged as `main-<commit-sha>` and `latest`
- Automatic deployment to DigitalOcean App Platform
- Security vulnerability scanning

### Monitoring and Logs

#### GitHub Actions
- Monitor build status in `Actions` tab
- Check logs for any build or deployment issues

#### DigitalOcean
- Monitor app health in DigitalOcean dashboard
- Check container registry usage and costs
- Review security scan results

### Troubleshooting

#### Common Issues

1. **Authentication Failed**
   - Check `DIGITALOCEAN_ACCESS_TOKEN` secret
   - Ensure token has registry permissions

2. **Build Fails**
   - Check Dockerfile syntax
   - Verify all required files are included
   - Review build logs in GitHub Actions

3. **Push Fails**
   - Verify registry namespace is correct
   - Check image naming conventions
   - Ensure sufficient registry storage

4. **Deployment Fails**
   - Check `.do/app.yaml` configuration
   - Verify all environment variables are set
   - Review deployment logs in DigitalOcean

#### Debug Commands

```bash
# Check registry authentication
doctl registry get

# List registry repositories
doctl registry repository list

# List image tags
doctl registry repository list-tags your-namespace/arisan-app-backend

# Check app status
doctl apps list
doctl apps get your-app-id
```

### Security Best Practices

1. **Secrets Management**
   - Never commit secrets to Git
   - Use GitHub secrets for sensitive data
   - Rotate tokens regularly

2. **Image Security**
   - Regularly update base images
   - Review security scan reports
   - Use minimal base images where possible

3. **Access Control**
   - Limit who can trigger deployments
   - Use GitHub environments for approval
   - Monitor deployment activity

### Cost Optimization

1. **Registry Storage**
   - Regularly clean old images
   - Use efficient Docker images
   - Monitor storage usage

2. **App Platform**
   - Use appropriate instance sizes
   - Scale horizontally when needed
   - Monitor resource usage

### Rollback Procedure

If a deployment fails:

1. **Manual Rollback**
   ```bash
   # Deploy previous image tag
   doctl apps create-deployment --spec .do/app.yaml --image-tag previous-version
   ```

2. **GitHub Rollback**
   - Revert the problematic commit
   - Push to trigger automatic rollback
   - Monitor rollback status

### Maintenance

- Regularly review and update workflows
- Monitor security scan results
- Clean up old images from registry
- Update dependencies and base images
- Backup database and configurations