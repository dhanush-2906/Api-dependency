import React from 'react';
import { Server, AppWindow, Database, Globe, Network, Zap, AlertOctagon, Flame } from 'lucide-react';

export default function MetricCards({ metrics, onSelectComponent }) {
  if (!metrics) return null;

  return (
    <section className="metrics-section">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Services / APIs</span>
            <Server size={14} color="var(--accent-service)" />
          </div>
          <div className="metric-card-value">{metrics.totalServices}</div>
          <div className="metric-card-sub">Core Microservices</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Applications</span>
            <AppWindow size={14} color="var(--accent-app)" />
          </div>
          <div className="metric-card-value">{metrics.totalApplications}</div>
          <div className="metric-card-sub">Client Frontends &amp; UIs</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Databases</span>
            <Database size={14} color="var(--accent-db)" />
          </div>
          <div className="metric-card-value">{metrics.totalDatabases}</div>
          <div className="metric-card-sub">Data Stores</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">External Systems</span>
            <Globe size={14} color="var(--accent-external)" />
          </div>
          <div className="metric-card-value">{metrics.totalExternalSystems}</div>
          <div className="metric-card-sub">3rd Party Gateways</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Total Components</span>
            <Network size={14} color="#94a3b8" />
          </div>
          <div className="metric-card-value">{metrics.totalComponents}</div>
          <div className="metric-card-sub">{metrics.totalDependencies} Canonical Edges</div>
        </div>

        {metrics.mostConnectedService && (
          <div 
            className="metric-card interactive" 
            onClick={() => onSelectComponent(metrics.mostConnectedService.id)}
            title="Click to focus on most connected service"
          >
            <div className="metric-card-header">
              <span className="metric-card-title">Most Connected</span>
              <Zap size={14} color="#f59e0b" />
            </div>
            <div className="metric-card-value" style={{ fontSize: '0.95rem' }}>
              {metrics.mostConnectedService.name}
            </div>
            <div className="metric-card-sub">
              {metrics.mostConnectedService.connections} In/Out Connections
            </div>
          </div>
        )}

        {metrics.criticalServiceCandidate && (
          <div 
            className="metric-card interactive" 
            onClick={() => onSelectComponent(metrics.criticalServiceCandidate.id)}
            title="Click to focus on critical service candidate"
          >
            <div className="metric-card-header">
              <span className="metric-card-title">Critical Candidate</span>
              <AlertOctagon size={14} color="#ef4444" />
            </div>
            <div className="metric-card-value" style={{ fontSize: '0.95rem' }}>
              {metrics.criticalServiceCandidate.name}
            </div>
            <div className="metric-card-sub">
              Score: {metrics.criticalServiceCandidate.criticalityScore} Downstream
            </div>
          </div>
        )}

        {metrics.largestBlastRadiusCandidate && (
          <div 
            className="metric-card interactive" 
            onClick={() => onSelectComponent(metrics.largestBlastRadiusCandidate.id)}
            title="Click to focus on largest blast radius candidate"
          >
            <div className="metric-card-header">
              <span className="metric-card-title">Largest Blast Radius</span>
              <Flame size={14} color="#f97316" />
            </div>
            <div className="metric-card-value" style={{ fontSize: '0.95rem' }}>
              {metrics.largestBlastRadiusCandidate.name}
            </div>
            <div className="metric-card-sub">
              {metrics.largestBlastRadiusCandidate.blastRadiusCount} Max Reachable
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
