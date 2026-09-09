/**
 * AI Execution Service
 * Dispatches structured intents to deterministic backend graph & impact engines.
 * Separates instantaneous READ operations from MUTATION previews requiring user confirmation.
 */

const datasetService = require('../dataset.service');
const impactService = require('../impact.service');
const metricsService = require('../metrics.service');
const { findPathsBetween } = require('../../graph/pathFinder');
const { toComponentId } = require('../../models/Component');
const aiEntityService = require('./ai.entity.service');
const { INTENTS } = require('./ai.intent.service');

class AiExecutionService {
  /**
   * Dispatches an intent to the appropriate analysis or mutation preview handler.
   * @param {object} intent 
   * @param {object} context 
   * @returns {Promise<object>} structured execution result
   */
  async processIntent(intent, context) {
    const graph = datasetService.getGraph();
    const selectedId = context.selectedComponent?.id || null;

    switch (intent.operation) {
      // ─── 1. ARCHITECTURE SUMMARY ──────────────────────────────────────────
      case INTENTS.SUMMARIZE_ARCHITECTURE: {
        const metrics = metricsService.getMetrics();
        const components = graph.getAllComponents();
        return {
          type: 'READ',
          operation: INTENTS.SUMMARIZE_ARCHITECTURE,
          data: {
            totalComponents: components.length,
            totalEdges: graph.edges.length,
            metrics,
            components: components.map(c => ({ id: c.id, name: c.name, type: c.type }))
          }
        };
      }

      // ─── 2. OUTAGE / FAILURE SIMULATION ──────────────────────────────────
      case INTENTS.ANALYZE_FAILURE: {
        const targetQueries = intent.targets || (intent.target ? [intent.target] : [selectedId]);
        if (!targetQueries || targetQueries.length === 0 || !targetQueries[0]) {
          return {
            type: 'ERROR',
            error: 'Please specify which service or component to simulate failure for.'
          };
        }

        const resolvedComponents = [];
        for (const query of targetQueries) {
          const res = aiEntityService.resolveComponent(query, selectedId);
          if (res.error) {
            return { type: 'ERROR', error: res.error, ambiguous: res.ambiguous };
          }
          resolvedComponents.push(res.match);
        }

        // Run deterministic failure simulation on each resolved component
        const results = resolvedComponents.map(comp => impactService.simulateFailure(comp.id));

        // If multi-component failure, compute combined blast radius
        const allImpactedIds = new Set();
        const combinedAffectedApps = new Map();
        const combinedAffectedServices = new Map();

        results.forEach(res => {
          res.allImpacted.forEach(item => allImpactedIds.add(item.component.id));
          res.affectedApplications.forEach(app => combinedAffectedApps.set(app.id, app));
          res.affectedServices.forEach(srv => combinedAffectedServices.set(srv.id, srv));
        });

        const totalNodes = graph.getAllComponents().length;
        const blastPercent = totalNodes > 1 ? Math.round((allImpactedIds.size / (totalNodes - results.length)) * 100) : 0;

        return {
          type: 'READ',
          operation: INTENTS.ANALYZE_FAILURE,
          data: {
            simulatedComponents: resolvedComponents.map(c => c.toJSON()),
            isMultiFailure: resolvedComponents.length > 1,
            singleResult: results.length === 1 ? results[0] : null,
            combined: {
              totalAffected: allImpactedIds.size,
              affectedApplications: Array.from(combinedAffectedApps.values()),
              affectedServices: Array.from(combinedAffectedServices.values()),
              blastRadiusPercent: blastPercent,
              results
            }
          }
        };
      }

      // ─── 3. CHANGE IMPACT ANALYSIS ────────────────────────────────────────
      case INTENTS.ANALYZE_CHANGE_IMPACT: {
        const targetQuery = intent.target || selectedId;
        if (!targetQuery) {
          return {
            type: 'ERROR',
            error: 'Please specify which component to analyze for change impact.'
          };
        }

        const res = aiEntityService.resolveComponent(targetQuery, selectedId);
        if (res.error) {
          return { type: 'ERROR', error: res.error, ambiguous: res.ambiguous };
        }

        const impact = impactService.analyzeChangeImpact(res.match.id);
        return {
          type: 'READ',
          operation: INTENTS.ANALYZE_CHANGE_IMPACT,
          data: {
            targetComponent: res.match.toJSON(),
            impact
          }
        };
      }

      // ─── 4. PATH EXPLANATION ("Why is X affected by Y?") ───────────────────
      case INTENTS.EXPLAIN_PATH: {
        if (!intent.target) {
          return {
            type: 'ERROR',
            error: 'Please specify which downstream component you want explained.'
          };
        }

        const targetRes = aiEntityService.resolveComponent(intent.target, selectedId);
        if (targetRes.error) {
          return { type: 'ERROR', error: targetRes.error, ambiguous: targetRes.ambiguous };
        }

        let sourceRes = null;
        if (intent.source) {
          sourceRes = aiEntityService.resolveComponent(intent.source, selectedId);
          if (sourceRes.error) {
            return { type: 'ERROR', error: sourceRes.error, ambiguous: sourceRes.ambiguous };
          }
        }

        const targetComp = targetRes.match;
        const sourceComp = sourceRes ? sourceRes.match : null;

        // If source specified, find direct and transitive paths from source -> target
        if (sourceComp) {
          const rawPaths = findPathsBetween(graph, sourceComp.id, targetComp.id, 5);
          const paths = rawPaths.map(pathIds => pathIds.map(id => {
            const c = graph.getComponent(id);
            return c ? c.name : id;
          }));

          return {
            type: 'READ',
            operation: INTENTS.EXPLAIN_PATH,
            data: {
              source: sourceComp.toJSON(),
              target: targetComp.toJSON(),
              hasPath: paths.length > 0,
              paths,
              isAffected: paths.length > 0
            }
          };
        }

        // If no source specified, find all upstream providers that reach target
        const directUpstream = graph.getDirectUpstream(targetComp.id).map(c => c.toJSON());
        return {
          type: 'READ',
          operation: INTENTS.EXPLAIN_PATH,
          data: {
            target: targetComp.toJSON(),
            directUpstream,
            hasPath: directUpstream.length > 0
          }
        };
      }

      // ─── 5. RISKS & SINGLE POINTS OF FAILURE ──────────────────────────────
      case INTENTS.GET_RISKS: {
        const metrics = metricsService.getMetrics();
        const components = graph.getAllComponents();

        // Identify Top Single Points of Failure (highest downstream reach)
        const spofCandidates = metrics.componentScores
          .filter(c => c.type === 'SERVICE')
          .sort((a, b) => b.criticalityScore - a.criticalityScore)
          .slice(0, 3);

        // Identify Highly Coupled Services (highest total connectivity)
        const highlyCoupled = metrics.componentScores
          .sort((a, b) => b.totalConnectivity - a.totalConnectivity)
          .slice(0, 3);

        return {
          type: 'READ',
          operation: INTENTS.GET_RISKS,
          data: {
            metrics,
            spofCandidates,
            highlyCoupled,
            criticalService: metrics.criticalServiceCandidate,
            largestBlastRadius: metrics.largestBlastRadiusCandidate
          }
        };
      }

      // ─── 6. RECOMMENDATIONS ────────────────────────────────────────────────
      case INTENTS.GET_RECOMMENDATIONS: {
        const targetQuery = intent.target || selectedId;
        let targetComp = null;
        if (targetQuery) {
          const res = aiEntityService.resolveComponent(targetQuery, selectedId);
          if (res.match) targetComp = res.match;
        }

        const metrics = metricsService.getMetrics();
        return {
          type: 'READ',
          operation: INTENTS.GET_RECOMMENDATIONS,
          data: {
            targetComponent: targetComp ? targetComp.toJSON() : null,
            metrics,
            criticalService: metrics.criticalServiceCandidate
          }
        };
      }

      // ─── 7. CREATE COMPONENT (MUTATION PREVIEW) ───────────────────────────
      case INTENTS.CREATE_COMPONENT: {
        const compData = intent.component || {};
        if (!compData.name || !compData.name.trim()) {
          return {
            type: 'PROMPT_MISSING_INFO',
            missingField: 'name',
            message: 'What should be the name of the new component?'
          };
        }

        const id = toComponentId(compData.name);
        if (graph.hasComponent(id)) {
          return {
            type: 'ERROR',
            error: `A component named '${compData.name}' already exists in the ecosystem.`
          };
        }

        // Validate dependencies and consumers
        const { resolved: resolvedDeps, unresolved: unresDeps } = aiEntityService.resolveMultiple(compData.dependencies || []);
        const { resolved: resolvedConsumers, unresolved: unresConsumers } = aiEntityService.resolveMultiple(compData.consumers || []);

        const validTypes = ['SERVICE', 'APPLICATION', 'DATABASE', 'EXTERNAL'];
        let compType = (compData.type || 'SERVICE').toUpperCase();
        if (compType === 'API') compType = 'SERVICE';
        if (!validTypes.includes(compType)) compType = 'SERVICE';

        const proposedPayload = {
          name: compData.name.trim(),
          type: compType,
          dependencies: resolvedDeps.map(d => d.name).concat(unresDeps),
          consumers: resolvedConsumers.map(c => c.name).concat(unresConsumers)
        };

        return {
          type: 'MUTATION_PREVIEW',
          operation: INTENTS.CREATE_COMPONENT,
          requiresConfirmation: true,
          proposedChange: {
            action: 'CREATE',
            title: `Create Component: ${proposedPayload.name}`,
            component: proposedPayload,
            details: {
              name: proposedPayload.name,
              type: proposedPayload.type,
              dependencies: proposedPayload.dependencies,
              consumers: proposedPayload.consumers,
              newEdgesCount: proposedPayload.dependencies.length + proposedPayload.consumers.length
            }
          },
          payload: proposedPayload
        };
      }

      // ─── 8. DELETE COMPONENT (MUTATION PREVIEW) ───────────────────────────
      case INTENTS.DELETE_COMPONENT: {
        const targetQuery = intent.target || selectedId;
        if (!targetQuery) {
          return {
            type: 'ERROR',
            error: 'Please specify which component to delete.'
          };
        }

        const res = aiEntityService.resolveComponent(targetQuery, selectedId);
        if (res.error) {
          return { type: 'ERROR', error: res.error, ambiguous: res.ambiguous };
        }

        const comp = res.match;
        const directUpstream = graph.getDirectUpstream(comp.id);
        const directDownstream = graph.getDirectDownstream(comp.id);
        const failureImpact = impactService.simulateFailure(comp.id);

        let riskLevel = 'LOW';
        if (failureImpact.metrics.totalAffected >= 5) riskLevel = 'CRITICAL';
        else if (failureImpact.metrics.totalAffected >= 2) riskLevel = 'HIGH';
        else if (failureImpact.metrics.totalAffected >= 1) riskLevel = 'MODERATE';

        return {
          type: 'MUTATION_PREVIEW',
          operation: INTENTS.DELETE_COMPONENT,
          requiresConfirmation: true,
          isDestructive: true,
          proposedChange: {
            action: 'DELETE',
            title: `Delete Component: ${comp.name}`,
            riskLevel,
            component: comp.toJSON(),
            severedConnectionsCount: directUpstream.length + directDownstream.length,
            directUpstream: directUpstream.map(u => u.name),
            directDownstream: directDownstream.map(d => d.name),
            affectedDownstreamCount: failureImpact.metrics.totalAffected,
            affectedApplications: failureImpact.affectedApplications.map(a => a.name)
          },
          payload: { id: comp.id, name: comp.name }
        };
      }

      // ─── 9. ADD / REMOVE DEPENDENCY (MUTATION PREVIEWS) ───────────────────
      case INTENTS.ADD_DEPENDENCY: {
        const consumerRes = aiEntityService.resolveComponent(intent.consumer, selectedId);
        const providerRes = aiEntityService.resolveComponent(intent.provider, selectedId);

        if (consumerRes.error) return { type: 'ERROR', error: `Consumer: ${consumerRes.error}` };
        if (providerRes.error) return { type: 'ERROR', error: `Provider: ${providerRes.error}` };

        const consumer = consumerRes.match;
        const provider = providerRes.match;

        if (consumer.id === provider.id) {
          return { type: 'ERROR', error: 'A component cannot depend on itself.' };
        }

        // Get current dependencies of consumer
        const currentDeps = graph.getDirectUpstream(consumer.id).map(u => u.name);
        if (currentDeps.includes(provider.name)) {
          return { type: 'ERROR', error: `'${consumer.name}' already depends on '${provider.name}'.` };
        }

        const newDeps = [...currentDeps, provider.name];
        const currentConsumers = graph.getDirectDownstream(consumer.id).map(d => d.name);

        return {
          type: 'MUTATION_PREVIEW',
          operation: INTENTS.UPDATE_COMPONENT,
          requiresConfirmation: true,
          proposedChange: {
            action: 'ADD_DEPENDENCY',
            title: `Add Dependency: ${consumer.name} → depends on ${provider.name}`,
            consumerName: consumer.name,
            providerName: provider.name,
            canonicalEdge: `${provider.name} → ${consumer.name}`
          },
          payload: {
            id: consumer.id,
            data: { dependencies: newDeps, consumers: currentConsumers }
          }
        };
      }

      case INTENTS.REMOVE_DEPENDENCY: {
        const resA = aiEntityService.resolveComponent(intent.compA, selectedId);
        const resB = aiEntityService.resolveComponent(intent.compB, selectedId);

        if (resA.error || resB.error) {
          return { type: 'ERROR', error: resA.error || resB.error };
        }

        // Check which one depends on the other
        const aUpstream = graph.getDirectUpstream(resA.match.id).map(u => u.id);
        const bUpstream = graph.getDirectUpstream(resB.match.id).map(u => u.id);

        let consumer = null;
        let provider = null;

        if (aUpstream.includes(resB.match.id)) {
          consumer = resA.match;
          provider = resB.match;
        } else if (bUpstream.includes(resA.match.id)) {
          consumer = resB.match;
          provider = resA.match;
        } else {
          return { type: 'ERROR', error: `No active dependency exists between '${resA.match.name}' and '${resB.match.name}'.` };
        }

        const newDeps = graph.getDirectUpstream(consumer.id).filter(u => u.id !== provider.id).map(u => u.name);
        const currentConsumers = graph.getDirectDownstream(consumer.id).map(d => d.name);

        return {
          type: 'MUTATION_PREVIEW',
          operation: INTENTS.UPDATE_COMPONENT,
          requiresConfirmation: true,
          proposedChange: {
            action: 'REMOVE_DEPENDENCY',
            title: `Remove Dependency between ${consumer.name} and ${provider.name}`,
            consumerName: consumer.name,
            providerName: provider.name
          },
          payload: {
            id: consumer.id,
            data: { dependencies: newDeps, consumers: currentConsumers }
          }
        };
      }

      // ─── 10. ADD CONSUMER (MUTATION PREVIEW) ──────────────────────────────
      case INTENTS.ADD_CONSUMER: {
        const consumerRes = aiEntityService.resolveComponent(intent.consumer, selectedId);
        const providerRes = aiEntityService.resolveComponent(intent.provider, selectedId);

        if (consumerRes.error) return { type: 'ERROR', error: `Consumer: ${consumerRes.error}` };
        if (providerRes.error) return { type: 'ERROR', error: `Provider: ${providerRes.error}` };

        const consumer = consumerRes.match;
        const provider = providerRes.match;

        const currentConsumers = graph.getDirectDownstream(provider.id).map(d => d.name);
        if (currentConsumers.includes(consumer.name)) {
          return { type: 'ERROR', error: `'${consumer.name}' is already a consumer of '${provider.name}'.` };
        }

        const newConsumers = [...currentConsumers, consumer.name];
        const currentDeps = graph.getDirectUpstream(provider.id).map(u => u.name);

        return {
          type: 'MUTATION_PREVIEW',
          operation: INTENTS.UPDATE_COMPONENT,
          requiresConfirmation: true,
          proposedChange: {
            action: 'ADD_CONSUMER',
            title: `Add Consumer: ${consumer.name} consumes ${provider.name}`,
            consumerName: consumer.name,
            providerName: provider.name,
            canonicalEdge: `${provider.name} → ${consumer.name}`
          },
          payload: {
            id: provider.id,
            data: { dependencies: currentDeps, consumers: newConsumers }
          }
        };
      }

      // ─── 11. UPDATE COMPONENT (MUTATION PREVIEW) ──────────────────────────
      case INTENTS.UPDATE_COMPONENT: {
        const targetQuery = intent.target || selectedId;
        if (!targetQuery) return { type: 'ERROR', error: 'Please specify which component to update.' };

        const res = aiEntityService.resolveComponent(targetQuery, selectedId);
        if (res.error) return { type: 'ERROR', error: res.error, ambiguous: res.ambiguous };

        const comp = res.match;
        const patch = intent.patch || {};

        return {
          type: 'MUTATION_PREVIEW',
          operation: INTENTS.UPDATE_COMPONENT,
          requiresConfirmation: true,
          proposedChange: {
            action: 'UPDATE',
            title: `Update Component: ${comp.name}`,
            component: comp.toJSON(),
            patch
          },
          payload: {
            id: comp.id,
            data: patch
          }
        };
      }

      default:
        return {
          type: 'READ',
          operation: INTENTS.GENERAL_QA,
          data: { query: intent.query || 'General architecture inquiry' }
        };
    }
  }

  /**
   * Executes a confirmed mutation against existing datasetService.
   * @param {string} operation 
   * @param {object} payload 
   * @returns {object} result with updated summary & affected component
   */
  executeMutation(operation, payload) {
    switch (operation) {
      case INTENTS.CREATE_COMPONENT: {
        const created = datasetService.createComponent(payload);
        return {
          success: true,
          operation: 'CREATE',
          message: `Successfully created component '${created.name}'.`,
          component: created,
          summary: datasetService.getSummary()
        };
      }

      case INTENTS.DELETE_COMPONENT: {
        const delRes = datasetService.deleteComponent(payload.id);
        return {
          success: true,
          operation: 'DELETE',
          message: `Successfully removed component '${payload.name || payload.id}' from ecosystem.`,
          data: delRes,
          summary: datasetService.getSummary()
        };
      }

      case INTENTS.UPDATE_COMPONENT: {
        const updated = datasetService.updateComponent(payload.id, payload.data || payload);
        return {
          success: true,
          operation: 'UPDATE',
          message: `Successfully updated component '${updated.name}'.`,
          component: updated,
          summary: datasetService.getSummary()
        };
      }

      default:
        throw new Error(`Unsupported mutation operation: ${operation}`);
    }
  }
}

module.exports = new AiExecutionService();
