import * as fs from 'fs'
import * as path from 'path'

describe('Docker & Kubernetes Deployment Architecture Suite', () => {
  const rootDir = path.resolve(__dirname, '../../../')

  test('Dockerfile - should use multi-stage builds and operate as a non-privileged user', () => {
    const dockerfilePath = path.join(rootDir, 'Dockerfile')
    expect(fs.existsSync(dockerfilePath)).toBe(true)

    const content = fs.readFileSync(dockerfilePath, 'utf8')

    // Verify multi-stage targets
    expect(content).toContain('AS builder')
    expect(content).toContain('AS runner')

    // Verify non-privileged user (OWASP ASVS compliance)
    expect(content).toContain('USER nextjs')
    expect(content).toContain('EXPOSE 3000')
  })

  test('docker-compose.yml - should configure Postgres and Redis services with healthchecks', () => {
    const composePath = path.join(rootDir, 'docker-compose.yml')
    expect(fs.existsSync(composePath)).toBe(true)

    const content = fs.readFileSync(composePath, 'utf8')

    expect(content).toContain('postgres:')
    expect(content).toContain('redis:')
    expect(content).toContain('app:')
    expect(content).toContain('healthcheck:')
  })

  test('k8s-deployment.yaml - should configure replica counts, HPA, and readiness/liveness checks', () => {
    const k8sPath = path.join(rootDir, 'k8s/k8s-deployment.yaml')
    expect(fs.existsSync(k8sPath)).toBe(true)

    const content = fs.readFileSync(k8sPath, 'utf8')

    // Verify replication targets and service selectors
    expect(content).toContain('kind: Deployment')
    expect(content).toContain('replicas: 3')

    // Verify HPA
    expect(content).toContain('kind: HorizontalPodAutoscaler')
    expect(content).toContain('targetCPUUtilizationPercentage: 75')

    // Verify SRE health probes
    expect(content).toContain('readinessProbe:')
    expect(content).toContain('livenessProbe:')
    expect(content).toContain('/api/health/ready')
    expect(content).toContain('/api/health/live')
  })
})
