import React from 'react';
import { 
  Server, 
  AppWindow, 
  Database, 
  Globe, 
  Zap, 
  AlertOctagon, 
  Flame,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function MetricCards({ metrics, onSelectComponent }) {
  if (!metrics) return null;

  return (
    <div className="executive-summary-strip">
      <div className="metric-strip-left">
        <div className="summary-stat-group">
          <span className="summary-stat-value">{metrics.totalComponents}</span>
          <span className="summary-stat-label">Components</span>
        </div>

        <div className="summary-stat-group">
          <span className="summary-stat-value">{metrics.totalDependencies}</span>
          <span className="summary-stat-label">Canonical Edges</span>
        </div>

        <div className="stat-divider"></div>

        <div className="component-pill-breakdown">
          <div className="comp-badge-mini service" title={`${metrics.totalServices} Microservices / APIs`}>
            <Server size={11} />
            <span>{metrics.totalServices} APIs</span>
          </div>

          <div className="comp-badge-mini app" title={`${metrics.totalApplications} Client Applications / Frontends`}>
            <AppWindow size={11} />
            <span>{metrics.totalApplications} Apps</span>
          </div>

          <div className="comp-badge-mini db" title={`${metrics.totalDatabases} Databases & Data Stores`}>
            <Database size={11} />
            <span>{metrics.totalDatabases} DBs</span>
          </div>

          <div className="comp-badge-mini external" title={`${metrics.totalExternalSystems} Third-party External Gateways`}>
            <Globe size={11} />
            <span>{metrics.totalExternalSystems} Gateway</span>
          </div>
        </div>
      </div>

      <div className="metric-strip-right">
        {metrics.mostConnectedService && (
          <div 
            className="actionable-candidate-card"
            onClick={() => onSelectComponent(metrics.mostConnectedService.id)}
            title="Click to focus on the highest connectivity service in the topology"
          >
            <div className="candidate-icon">
              <Zap size={13} color="#f59e0b" />
            </div>
            <div className="candidate-text">
              <span className="candidate-title">Most Connected</span>
              <span className="candidate-name">{metrics.mostConnectedService.name}</span>
            </div>
            <span className="candidate-score-pill" style={{ color: '#f59e0b' }}>
              {metrics.mostConnectedService.connections} links
            </span>
          </div>
        )}

        {metrics.criticalServiceCandidate && (
          <div 
            className="actionable-candidate-card"
            onClick={() => onSelectComponent(metrics.criticalServiceCandidate.id)}
            title="Click to focus on the highest downstream criticality candidate"
          >
            <div className="candidate-icon">
              <AlertOctagon size={13} color="#ef4444" />
            </div>
            <div className="candidate-text">
              <span className="candidate-title">Critical Candidate</span>
              <span className="candidate-name">{metrics.criticalServiceCandidate.name}</span>
            </div>
            <span className="candidate-score-pill" style={{ color: '#ef4444' }}>
              Score: {metrics.criticalServiceCandidate.criticalityScore}
            </span>
          </div>
        )}

        {metrics.largestBlastRadiusCandidate && (
          <div 
            className="actionable-candidate-card"
            onClick={() => onSelectComponent(metrics.largestBlastRadiusCandidate.id)}
            title="Click to focus on the component with largest potential outage blast radius"
          >
            <div className="candidate-icon">
              <Flame size={13} color="#f97316" />
            </div>
            <div className="candidate-text">
              <span className="candidate-title">Max Blast Radius</span>
              <span className="candidate-name">{metrics.largestBlastRadiusCandidate.name}</span>
            </div>
            <span className="candidate-score-pill" style={{ color: '#f97316' }}>
              {metrics.largestBlastRadiusCandidate.blastRadiusCount} systems
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
