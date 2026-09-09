/**
 * Master AI Architecture Copilot Service
 * Coordinates context gathering, intent extraction, deterministic execution, and LLM explanation.
 */

const datasetService = require('../dataset.service');
const metricsService = require('../metrics.service');
const aiContextService = require('./ai.context.service');
const { AiIntentService, INTENTS } = require('./ai.intent.service');
const aiExecutionService = require('./ai.execution.service');
const aiHfService = require('./ai.hf.service');

class AiService {
  /**
   * Main chat conversation endpoint.
   * @param {object} params
   * @param {string} params.message
   * @param {Array<object>} params.history
   * @param {string|null} params.selectedComponentId
   * @param {object|null} params.activeAnalysis
   * @returns {Promise<object>}
   */
  async processChat({ message, history = [], selectedComponentId = null, activeAnalysis = null }) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      return {
        role: 'assistant',
        text: 'Please ask an architecture question, simulate an outage, or propose an ecosystem modification.',
        type: 'TEXT'
      };
    }

    // 1. Gather current architecture snapshot (ground truth)
    const context = aiContextService.getArchitectureContext(selectedComponentId, activeAnalysis);

    // 2. Extract structured intent
    const intent = await AiIntentService.extractIntent(message, history, context);

    // 3. Execute deterministic analysis or generate mutation preview
    const executionResult = await aiExecutionService.processIntent(intent, context);

    // 4. Handle Errors / Missing info
    if (executionResult.type === 'ERROR') {
      return {
        role: 'assistant',
        text: executionResult.error,
        ambiguous: executionResult.ambiguous || null,
        type: 'ERROR'
      };
    }

    if (executionResult.type === 'PROMPT_MISSING_INFO') {
      return {
        role: 'assistant',
        text: executionResult.message,
        missingField: executionResult.missingField,
        type: 'PROMPT_MISSING_INFO'
      };
    }

    // 5. Handle Mutation Previews (Require Confirmation)
    if (executionResult.type === 'MUTATION_PREVIEW') {
      let previewText = '';
      if (executionResult.proposedChange.action === 'CREATE') {
        const c = executionResult.proposedChange.component;
        previewText = `I have structured your request to create **${c.name}** [Type: ${c.type}].\n\n` +
          `• **Upstream Dependencies:** ${c.dependencies.length > 0 ? c.dependencies.join(', ') : 'None'}\n` +
          `• **Downstream Consumers:** ${c.consumers.length > 0 ? c.consumers.join(', ') : 'None'}\n\n` +
          `Please review the proposed change below and confirm to apply it to the live ecosystem.`;
      } else if (executionResult.proposedChange.action === 'DELETE') {
        const p = executionResult.proposedChange;
        previewText = `⚠️ **High Impact Operation Warning**\n\n` +
          `You are proposing to permanently remove **${p.component.name}** from the ecosystem.\n\n` +
          `• **Severed Connections:** ${p.severedConnectionsCount} edges\n` +
          `• **Potentially Affected Downstream Systems:** ${p.affectedDownstreamCount}\n` +
          `• **Affected Applications:** ${p.affectedApplications.length > 0 ? p.affectedApplications.join(', ') : 'None'}\n` +
          `• **Risk Level:** **${p.riskLevel}**\n\n` +
          `Explicit confirmation is required before proceeding with this deletion.`;
      } else {
        previewText = `Proposed architecture modification: **${executionResult.proposedChange.title}**.\n\n` +
          `Please review and confirm to execute.`;
      }

      return {
        role: 'assistant',
        text: previewText,
        type: 'MUTATION_PREVIEW',
        requiresConfirmation: true,
        isDestructive: executionResult.isDestructive || false,
        proposedChange: executionResult.proposedChange,
        operation: executionResult.operation,
        payload: executionResult.payload
      };
    }

    // 6. Generate Natural Language Explanation for Read/Analysis operations
    const formattedExplanation = await this._generateExplanation(intent, executionResult, context, message);

    return {
      role: 'assistant',
      text: formattedExplanation.text,
      type: 'ANALYSIS_RESULT',
      operation: executionResult.operation,
      analysisData: executionResult.data,
      facts: formattedExplanation.facts,
      inference: formattedExplanation.inference,
      recommendations: formattedExplanation.recommendations
    };
  }

  /**
   * Generates grounded explanation using Hugging Face or deterministic factual templates.
   */
  async _generateExplanation(intent, executionResult, context, userMessage) {
    const op = executionResult.operation;
    const data = executionResult.data;

    // Build specific factual synthesis depending on operation
    if (op === INTENTS.SUMMARIZE_ARCHITECTURE) {
      const m = data.metrics;
      const text = [
        `### Architecture Topology Overview`,
        '',
        `The current ecosystem comprises **${data.totalComponents} total components** interconnected via **${data.totalEdges} canonical dependency edges** (Provider → Consumer).`,
        '',
        `**Component Breakdown:**`,
        `• **Services / APIs:** ${m.totalServices}`,
        `• **Applications:** ${m.totalApplications}`,
        `• **Databases:** ${m.totalDatabases}`,
        `• **External Systems:** ${m.totalExternalSystems}`,
        '',
        `**Key Structural Insights:**`,
        `• **Most Connected Service:** \`${m.mostConnectedService?.name || 'N/A'}\` with **${m.mostConnectedService?.connections || 0} total connections** (${m.mostConnectedService?.directUpstream || 0} upstream providers, ${m.mostConnectedService?.directDownstream || 0} downstream consumers).`,
        `• **Critical Service Candidate:** \`${m.criticalServiceCandidate?.name || 'N/A'}\` reaching **${m.criticalServiceCandidate?.reachableDownstreamCount || 0} downstream components** transitively.`,
        `• **Largest Blast Radius:** \`${m.largestBlastRadiusCandidate?.name || 'N/A'}\` potentially affecting **${m.largestBlastRadiusCandidate?.blastRadiusCount || 0} systems** during an outage.`
      ].join('\n');

      return {
        text,
        facts: [`Total Components: ${data.totalComponents}`, `Total Edges: ${data.totalEdges}`],
        inference: `Centralized routing around ${m.criticalServiceCandidate?.name || 'core services'}.`,
        recommendations: [`Consider monitoring ${m.criticalServiceCandidate?.name || 'critical services'} with automated health checks.`]
      };
    }

    if (op === INTENTS.ANALYZE_FAILURE) {
      if (data.isMultiFailure) {
        const c = data.combined;
        const comps = data.simulatedComponents.map(x => x.name).join(' & ');
        const text = [
          `### Multi-Component Outage Simulation: ${comps}`,
          '',
          `**FACT:**`,
          `• Simultaneous failure of **${comps}** creates a combined downstream blast radius of **${c.totalAffected} systems** (${c.blastRadiusPercent}% of ecosystem).`,
          `• Directly affected applications: ${c.affectedApplications.map(a => `\`${a.name}\``).join(', ') || 'None'}.`,
          `• Directly affected services: ${c.affectedServices.map(s => `\`${s.name}\``).join(', ') || 'None'}.`,
          '',
          `**INFERENCE:**`,
          `• Multiple critical paths are disrupted simultaneously, causing cascading degradation across customer and billing tiers.`,
          '',
          `**RECOMMENDATION:**`,
          `• Implement circuit breakers and fallback caching for downstream applications consuming these services.`
        ].join('\n');

        return { text, facts: [c.totalAffected + ' affected systems'], inference: 'Multi-node cascade', recommendations: ['Add circuit breakers'] };
      }

      const s = data.singleResult;
      const rootName = s.rootComponent.name;
      const text = [
        `### Outage Blast Radius: ${rootName}`,
        '',
        `**FACT:**`,
        `• **Total Affected Downstream Systems:** **${s.metrics.totalAffected}** (${s.metrics.blastRadiusPercent}% blast radius).`,
        `• **Directly Impacted (${s.metrics.directCount}):** ${s.directImpact.map(d => `\`${d.name}\``).join(', ') || 'None'}.`,
        `• **Indirectly Impacted (${s.metrics.indirectCount}):** ${s.indirectImpact.map(i => `\`${i.name}\``).join(', ') || 'None'}.`,
        `• **Impacted User Applications (${s.affectedApplications.length}):** ${s.affectedApplications.map(a => `\`${a.name}\``).join(', ') || 'None'}.`,
        '',
        `**INFERENCE:**`,
        `• An unexpected outage in \`${rootName}\` immediately degrades its direct consumers, propagating transitively down to end-user applications.`,
        '',
        `**RECOMMENDATION:**`,
        `• Ensure high-availability clustering and retry policies for consumers of \`${rootName}\`.`
      ].join('\n');

      return { text, facts: [`${s.metrics.totalAffected} affected systems`], inference: `Downstream cascade`, recommendations: [`Add redundancy for ${rootName}`] };
    }

    if (op === INTENTS.ANALYZE_CHANGE_IMPACT) {
      const imp = data.impact;
      const name = data.targetComponent.name;
      const text = [
        `### Change Impact Scope: ${name}`,
        '',
        `**FACT:**`,
        `• Modifying \`${name}\` requires validation across **${imp.metrics.totalDependentCount} total downstream consumers**.`,
        `• **Direct Consumers (${imp.metrics.directDependentCount}):** ${imp.directImpact.map(d => `\`${d.name}\``).join(', ') || 'None'}.`,
        `• **Indirect Dependents (${imp.metrics.indirectDependentCount}):** ${imp.indirectImpact.map(i => `\`${i.name}\``).join(', ') || 'None'}.`,
        `• **Applications Requiring Regression Testing:** ${imp.affectedApplications.map(a => `\`${a.name}\``).join(', ') || 'None'}.`,
        '',
        `**INFERENCE:**`,
        `• API contract modifications (e.g. schema changes, deprecations) will propagate through downstream dependency chains.`,
        '',
        `**RECOMMENDATION:**`,
        `• Run integration test suites against direct consumers (${imp.directImpact.map(d => d.name).join(', ') || 'none'}) before deploying changes.`
      ].join('\n');

      return { text, facts: [`${imp.metrics.totalDependentCount} dependents`], inference: 'Contract propagation risk', recommendations: ['Run regression test suite'] };
    }

    if (op === INTENTS.EXPLAIN_PATH) {
      if (data.source && data.target) {
        if (!data.hasPath) {
          return {
            text: `There is **no downstream dependency path** from \`${data.source.name}\` to \`${data.target.name}\`. Changes or outages in \`${data.source.name}\` will not affect \`${data.target.name}\`.`,
            facts: ['No connection'],
            inference: 'Isolated components',
            recommendations: []
          };
        }

        const pathList = data.paths.map((p, idx) => `${idx + 1}. \`${p.join(' → ')}\``).join('\n');
        const text = [
          `### Impact Trace: ${data.source.name} → ${data.target.name}`,
          '',
          `**FACT:**`,
          `\`${data.target.name}\` is affected by \`${data.source.name}\` through **${data.paths.length} downstream dependency path(s)**:`,
          '',
          pathList,
          '',
          `**INFERENCE:**`,
          `\`${data.target.name}\` transitively relies on \`${data.source.name}\` because intermediate providers consume its API output.`,
          '',
          `**RECOMMENDATION:**`,
          `Consider decoupling direct chains with message queues or cached read-models if independent uptime is required.`
        ].join('\n');

        return { text, facts: data.paths[0], inference: 'Transitive reliance', recommendations: ['Decouple via caching/queues'] };
      }

      const ups = data.directUpstream || [];
      const text = [
        `### Upstream Providers for ${data.target.name}`,
        '',
        `**FACT:** \`${data.target.name}\` relies directly on **${ups.length} upstream provider(s)**: ${ups.map(u => `\`${u.name}\``).join(', ') || 'None (Root Node)'}.`,
        '',
        `**INFERENCE:** Any disruption in these upstream services will directly affect \`${data.target.name}\`.`
      ].join('\n');

      return { text, facts: ups.map(u => u.name), inference: 'Direct dependency reliance', recommendations: [] };
    }

    if (op === INTENTS.GET_RISKS) {
      const topSpofs = data.spofCandidates.map(s => `• **${s.name}** [Score: ${s.criticalityScore} downstream reach, ${s.directDownstreamCount} direct consumers]`).join('\n');
      const topCoupled = data.highlyCoupled.map(c => `• **${c.name}** [${c.totalConnectivity} total connections: ${c.directUpstreamCount} in, ${c.directDownstreamCount} out]`).join('\n');

      const text = [
        `### Architecture Risk & SPOF Assessment`,
        '',
        `**FACT (Criticality & Single Points of Failure):**`,
        topSpofs,
        '',
        `**FACT (High Coupling / Central Hubs):**`,
        topCoupled,
        '',
        `**INFERENCE:**`,
        `Services with high downstream reachability pose the greatest systemic blast risk to the enterprise. If the top SPOF fails, it triggers the largest cascading outage.`,
        '',
        `**RECOMMENDATIONS:**`,
        `1. **Isolate Core Providers:** Implement rate-limiting and bulkheads on \`${data.criticalService?.name || 'top services'}\`.`,
        `2. **Reduce Fan-Out:** Introduce API Gateways or domain facade services to decouple direct consumers.`,
        `3. **Resilience Testing:** Periodically run simulated failure drills on top blast radius components.`
      ].join('\n');

      return { text, facts: ['SPOF identified'], inference: 'High coupling concentration', recommendations: ['Add bulkheads', 'Decouple fan-out'] };
    }

    if (op === INTENTS.GET_RECOMMENDATIONS) {
      const compName = data.targetComponent?.name || data.criticalService?.name || 'the system';
      const text = [
        `### Architectural Recommendations for ${compName}`,
        '',
        `**FACT:**`,
        `\`${compName}\` currently maintains significant connectivity in the canonical graph.`,
        '',
        `**INFERENCE:**`,
        `Direct synchronous coupling creates tight availability dependencies across tiers.`,
        '',
        `**RECOMMENDATIONS:**`,
        `1. **Asynchronous Decoupling:** Convert synchronous HTTP calls to asynchronous event pub/sub where eventual consistency is acceptable.`,
        `2. **Client-Side Fallbacks:** Equip consuming applications with fallback mock data or cached stale responses during provider downtime.`,
        `3. **Circuit Breaking:** Configure circuit breakers with 500ms trip thresholds to prevent cascading thread pool exhaustion.`
      ].join('\n');

      return { text, facts: [`Target: ${compName}`], inference: 'Synchronous coupling vulnerability', recommendations: ['Use async events', 'Client fallbacks', 'Circuit breakers'] };
    }

    // Default Fallback
    return {
      text: `Based on the current architecture topology of **${context.totalComponents} components**, all services are operational. You can ask me to simulate outages, calculate blast radius, explain dependency paths, or create/modify components.`,
      facts: [`Total Components: ${context.totalComponents}`],
      inference: 'Ecosystem is active and queryable',
      recommendations: []
    };
  }

  /**
   * Executes a confirmed mutation.
   * @param {object} params
   * @param {string} params.operation
   * @param {object} params.payload
   * @returns {object}
   */
  executeMutation({ operation, payload }) {
    return aiExecutionService.executeMutation(operation, payload);
  }

  /**
   * Generates prompt suggestions based on current graph state.
   */
  getSuggestions(selectedComponentId = null) {
    const graph = datasetService.getGraph();
    const metrics = metricsService.getMetrics();
    const selected = selectedComponentId ? graph.getComponent(selectedComponentId) : null;

    const baseSuggestions = [
      { label: '📊 Summarize Architecture', prompt: 'Summarize my architecture' },
      { label: '⚠️ What are the biggest risks?', prompt: 'What are the biggest architectural risks and single points of failure?' }
    ];

    if (selected) {
      return [
        { label: `💥 What happens if ${selected.name} fails?`, prompt: `What happens if ${selected.name} fails?` },
        { label: `🔍 Who depends on ${selected.name}?`, prompt: `Who depends on ${selected.name}?` },
        { label: `💡 How to reduce ${selected.name} blast radius?`, prompt: `How can I reduce ${selected.name} blast radius?` },
        ...baseSuggestions
      ];
    }

    const critical = metrics.criticalServiceCandidate;
    if (critical) {
      return [
        { label: `💥 What happens if ${critical.name} fails?`, prompt: `What happens if ${critical.name} fails?` },
        { label: `🔍 Why is Customer Portal affected?`, prompt: `Why is Customer Portal affected by Auth Service?` },
        { label: `➕ Create Notification Service`, prompt: `Create Notification Service as an API depending on Auth Service` },
        ...baseSuggestions
      ];
    }

    return baseSuggestions;
  }
}

module.exports = new AiService();
