# Production Deployment Guide

## 🚀 Enterprise-Grade Deployment

This guide covers deploying the Unified Communication Hub to production with **Kubernetes, monitoring, security, and CI/CD**.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development with Docker](#local-development)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [CI/CD Pipeline Setup](#cicd-setup)
5. [Monitoring & Observability](#monitoring)
6. [Security Hardening](#security)
7. [Scaling & Performance](#scaling)
8. [Disaster Recovery](#disaster-recovery)

---

## Prerequisites

### Required Tools
- **Docker** 20.10+
- **Kubernetes** 1.25+ (AWS EKS, GKE, AKS, or local minikube)
- **kubectl** configured
- **Helm** 3.0+ (optional)
- **GitHub** account (for CI/CD)
- **Domain name** with DNS access

### Cloud Resources
- Kubernetes cluster (3+ nodes recommended)
- Load balancer / Ingress controller
- SSL certificates (Let's Encrypt recommended)
- Container registry (GitHub Container Registry included)

---

## Local Development with Docker

### 1. Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client && npm install && cd ..

# Install production middleware dependencies
npm install express-rate-limit helmet prom-client winston compression node-cron
```

### 2. Configure Environment

```bash
# Copy example environment file
copy .env.example .env

# Edit with your credentials
notepad .env
```

**Minimum production configuration:**
```env
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
OPENAI_API_KEY=sk-your-key-here
MATRIX_USER_ID=@your-bot:matrix.org
MATRIX_ACCESS_TOKEN=your-token-here
ALLOWED_ORIGINS=https://yourdomain.com
```

### 3. Build and Run with Docker Compose

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

**Services running:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- Redis: localhost:6379

### 4. Test the Deployment

```bash
# Health check
curl http://localhost:3001/api/health

# Metrics endpoint
curl http://localhost:3001/metrics

# Frontend health
curl http://localhost:8080/health
```

---

## Kubernetes Deployment

### 1. Prepare Container Images

**Option A: Build and Push to GitHub Container Registry**

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Build images
docker build -t ghcr.io/YOUR_USERNAME/chatappli/backend:latest -f Dockerfile.backend .
docker build -t ghcr.io/YOUR_USERNAME/chatappli/frontend:latest -f Dockerfile.frontend .

# Push images
docker push ghcr.io/YOUR_USERNAME/chatappli/backend:latest
docker push ghcr.io/YOUR_USERNAME/chatappli/frontend:latest
```

**Option B: Use CI/CD** (recommended - see below)

### 2. Configure Kubernetes Secrets

```bash
# Create namespace
kubectl apply -f kubernetes/namespace.yaml

# Create registry credentials
kubectl create secret docker-registry registry-credentials \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  --docker-email=your@email.com \
  --namespace=commhub-prod

# Create application secrets
kubectl create secret generic backend-secrets \
  --from-literal=MATRIX_USER_ID="@your-bot:matrix.org" \
  --from-literal=MATRIX_ACCESS_TOKEN="your_token" \
  --from-literal=OPENAI_API_KEY="sk-your-key" \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
  --namespace=commhub-prod
```

### 3. Deploy Applications

```bash
# Apply ConfigMaps
kubectl apply -f kubernetes/configmap.yaml

# Deploy backend
kubectl apply -f kubernetes/backend-deployment.yaml

# Deploy frontend
kubectl apply -f kubernetes/frontend-deployment.yaml

# Setup Ingress
kubectl apply -f kubernetes/ingress.yaml
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n commhub-prod

# Check services
kubectl get svc -n commhub-prod

# Check ingress
kubectl get ingress -n commhub-prod

# View logs
kubectl logs -f deployment/backend -n commhub-prod
```

### 5. Setup SSL with cert-manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create Let's Encrypt issuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your@email.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

---

## CI/CD Setup

### GitHub Actions Configuration

**Already configured in `.github/workflows/ci-cd.yml`**

### Required GitHub Secrets

Navigate to **Settings → Secrets and variables → Actions**:

1. **KUBE_CONFIG**: Your base64-encoded kubeconfig
   ```bash
   cat ~/.kube/config | base64
   ```

2. **GitHub Token**: Automatically provided by GitHub Actions

### Enable GitHub Container Registry

1. **Settings → Packages** - Enable Container Registry
2. **Personal Access Token**: Create with `write:packages` scope

### Trigger Deployment

```bash
# Push to main branch triggers full CI/CD
git add .
git commit -m "Deploy to production"
git push origin main
```

**Pipeline stages:**
1. Lint & test backend
2. Lint & test frontend
3. Build Docker images
4. Push to registry
5. Deploy to Kubernetes
6. Security scan

---

## Monitoring & Observability

### 1. Prometheus Metrics

**Metrics endpoint:** `http://backend:3001/metrics`

**Available metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `messages_processed_total` - Messages by platform/priority
- `ai_operations_total` - AI operations count
- `ai_operation_duration_seconds` - AI operation latency
- Node.js process metrics (CPU, memory, etc.)

### 2. Install Prometheus

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Port forward to access
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

### 3. Install Grafana

```bash
# Access Grafana (installed with Prometheus stack)
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Get admin password
kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```

**Import dashboards:**
- Node.js Application Metrics (ID: 11159)
- Kubernetes Cluster Monitoring (ID: 7249)

### 4. Centralized Logging (ELK Stack)

```bash
# Install Elasticsearch
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch --namespace logging --create-namespace

# Install Kibana
helm install kibana elastic/kibana --namespace logging

# Configure log shipping from Winston
# Logs are already configured in src/server/middleware/logger.ts
```

---

## Security Hardening

### Production Security Checklist

- [x] **Rate limiting** - Configured per endpoint
- [x] **Helmet.js** - Security headers enabled
- [x] **CORS** - Strict origin validation
- [x] **JWT tokens** - 7-day expiry
- [x] **Input validation** - XSS protection
- [x] **HTTPS/TLS** - cert-manager + Let's Encrypt
- [x] **Non-root containers** - All Dockerfiles use nodejs user
- [x] **Secrets management** - Kubernetes Secrets
- [x] **Network policies** - K8s NetworkPolicy (add if needed)
- [x] **Security scanning** - Trivy in CI/CD
- [x] **Audit logging** - Winston production logs

### Additional Security Measures

**1. Enable Network Policies**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
  namespace: commhub-prod
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 3001
```

**2. Implement Pod Security Standards**

```bash
kubectl label namespace commhub-prod \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

**3. Enable API Rate Limiting**

Already configured in `src/server/middleware/rateLimiter.ts`:
- API: 100 req/15min
- Auth: 5 attempts/15min
- AI: 20 req/hour

---

## Scaling & Performance

### Horizontal Pod Autoscaling

**Already configured** in Kubernetes manifests:

- Backend: 3-10 pods (CPU 70%, Memory 80%)
- Frontend: 2-5 pods (CPU 70%)

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n commhub-prod

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n commhub-prod
```

### Performance Optimization

**1. Enable Redis Caching** (included in docker-compose)

```typescript
// Add to src/server/index.ts
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache daily summaries
const cacheKey = `summary:${date}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

**2. Database Optimization**

```bash
# For production, migrate to PostgreSQL
# Update DATABASE_PATH to postgres://...
```

**3. CDN for Static Assets**

Configure CloudFlare or AWS CloudFront for frontend assets.

---

## Disaster Recovery

### Backup Strategy

**1. Database Backups**

```bash
# Create backup job
kubectl create job backup-$(date +%Y%m%d) \
  --from=cronjob/database-backup \
  --namespace=commhub-prod
```

**2. Configuration Backups**

```bash
# Backup all configurations
kubectl get all,configmap,secret,ingress -n commhub-prod -o yaml > backup-$(date +%Y%m%d).yaml
```

### Recovery Procedures

**1. Restore from backup**

```bash
kubectl apply -f backup-YYYYMMDD.yaml
```

**2. Rollback deployment**

```bash
kubectl rollout undo deployment/backend -n commhub-prod
kubectl rollout undo deployment/frontend -n commhub-prod
```

---

## Cost Optimization

### Resource Recommendations

**Startup (< 1K users):**
- 2 backend pods (0.5 CPU, 512MB each)
- 1 frontend pod (0.2 CPU, 256MB)
- **Cost: ~$50-100/month**

**Growth (1K-10K users):**
- 3-5 backend pods
- 2-3 frontend pods
- PostgreSQL managed DB
- **Cost: ~$200-500/month**

**Scale (10K+ users):**
- 5-10 backend pods with HPA
- 3-5 frontend pods
- Multi-region deployment
- **Cost: $1K-5K/month**

---

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n commhub-prod
kubectl logs <pod-name> -n commhub-prod
```

**Ingress not working:**
```bash
kubectl describe ingress commhub-ingress -n commhub-prod
# Check DNS points to load balancer IP
```

**Database connection issues:**
```bash
# Check PVC
kubectl get pvc -n commhub-prod
# Check volume mounts
kubectl describe pod backend-xxx -n commhub-prod
```

---

## Production Checklist

Before going live:

- [ ] SSL certificates configured
- [ ] DNS records pointing to load balancer
- [ ] Secrets properly configured
- [ ] Monitoring dashboards setup
- [ ] Backup strategy implemented
- [ ] Rate limits tested
- [ ] Load testing completed (use k6 or Apache Bench)
- [ ] Security scan passed
- [ ] Documentation updated
- [ ] Team trained on operations

---

## Support & Maintenance

### Regular Tasks

**Daily:**
- Monitor error rates in Grafana
- Check application logs for issues

**Weekly:**
- Review resource usage
- Check for security updates
- Backup verification

**Monthly:**
- Cost optimization review
- Performance tuning
- Dependency updates

### Monitoring Dashboards

- **Grafana**: http://grafana.yourdomain.com
- **Prometheus**: http://prometheus.yourdomain.com
- **Kibana**: http://kibana.yourdomain.com

---

## Next Steps

1. **Load Testing**: Use k6 to test under load
2. **Multi-Region**: Deploy to multiple regions for HA
3. **Advanced AI**: Fine-tune models for your domain
4. **Mobile Apps**: React Native apps for iOS/Android
5. **Enterprise Features**: SSO, SAML, advanced analytics

---

**You now have a production-grade, venture-ready platform!** 🚀

For issues or questions, check:
- **GitHub Issues**: Report bugs
- **Documentation**: Complete guides in docs/
- **Community**: Join our Discord/Slack

**Built with ❤️ for Startupathon 2026**
