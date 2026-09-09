/**
 * AI Intent Extraction Service
 * Parses natural language user prompts into structured architectural operations.
 * Employs Hugging Face LLM structured extraction with deterministic rule-based fallback.
 */

const aiHfService = require('./ai.hf.service');
const aiEntityService = require('./ai.entity.service');

const INTENTS = {
  SUMMARIZE_ARCHITECTURE: 'SUMMARIZE_ARCHITECTURE',
  ANALYZE_FAILURE: 'ANALYZE_FAILURE',
  ANALYZE_CHANGE_IMPACT: 'ANALYZE_CHANGE_IMPACT',
  EXPLAIN_PATH: 'EXPLAIN_PATH',
  GET_RISKS: 'GET_RISKS',
  GET_RECOMMENDATIONS: 'GET_RECOMMENDATIONS',
  CREATE_COMPONENT: 'CREATE_COMPONENT',
  UPDATE_COMPONENT: 'UPDATE_COMPONENT',
  DELETE_COMPONENT: 'DELETE_COMPONENT',
  ADD_DEPENDENCY: 'ADD_DEPENDENCY',
  REMOVE_DEPENDENCY: 'REMOVE_DEPENDENCY',
  ADD_CONSUMER: 'ADD_CONSUMER',
  REMOVE_CONSUMER: 'REMOVE_CONSUMER',
  GENERAL_QA: 'GENERAL_QA'
};

class AiIntentService {
  /**
   * Deterministic pattern matcher as an instantaneous, infallible extractor and fallback.
   * @param {string} text 
   * @param {string|null} selectedComponentId 
   * @returns {object|null}
   */
  matchRuleBasedIntent(text, selectedComponentId = null) {
    if (!text || typeof text !== 'string') return null;
    const lower = text.trim().toLowerCase();

    // 1. Summarize
    if (/^(summarize|summary|overview|explain this ecosystem|architecture overview|how is this architecture structured)/i.test(lower) ||
        lower === 'summarize' || lower === 'overview' || lower === 'summary') {
      return { operation: INTENTS.SUMMARIZE_ARCHITECTURE };
    }

    // 2. Risks & Single Points of Failure
    if (/^(what are the biggest risks|biggest risks|single point of failure|biggest single point of failure|risk analysis|where are the biggest risks|where is the architecture (highly )?coupled|spof)/i.test(lower) ||
        lower.includes('single point of failure') || lower.includes('biggest risks') || lower.includes('biggest architectural risks')) {
      return { operation: INTENTS.GET_RISKS };
    }

    // 3. Recommendations
    if (/^(how can i reduce|how to reduce|recommendations|recommend|suggest improvements|how to improve|reduce blast radius)/i.test(lower) ||
        lower.includes('reduce blast radius') || lower.includes('reduce its blast radius')) {
      const matchTarget = text.match(/(?:for|of)\s+([a-zA-Z0-9\s\-]+)/i);
      const targetName = matchTarget ? matchTarget[1].trim() : (selectedComponentId || null);
      return {
        operation: INTENTS.GET_RECOMMENDATIONS,
        target: targetName
      };
    }

    // 4. "Why is X affected by Y?" / Explain Path
    const whyMatch = text.match(/why is\s+([^?]+?)\s+affected(?:\s+by\s+([^?]+))?/i) ||
                     text.match(/explain(?:\s+the)?\s+path\s+between\s+([^?]+?)\s+and\s+([^?]+)/i);
    if (whyMatch) {
      const targetName = whyMatch[1].trim();
      const sourceName = whyMatch[2] ? whyMatch[2].trim() : (selectedComponentId || null);
      return {
        operation: INTENTS.EXPLAIN_PATH,
        source: sourceName,
        target: targetName
      };
    }

    // 5. Change Impact Analysis
    // e.g. "What happens if I modify Inventory Service?", "What services depend on Payment Service?", "Change impact of X"
    if (/^(what happens if i (modify|change|update)|modify|change impact|what services depend on|who depends on|what applications could be affected by changing)/i.test(lower) ||
        lower.includes('change impact') || lower.includes('if i modify') || lower.includes('if i change') || lower.includes('who depends on this') || lower.includes('who depends on')) {
      const matchComp = text.match(/(?:modify|change|changing|depend on|impact of)\s+([a-zA-Z0-9\s\-]+)/i);
      const targetName = matchComp ? matchComp[1].trim() : (selectedComponentId || null);
      return {
        operation: INTENTS.ANALYZE_CHANGE_IMPACT,
        target: targetName
      };
    }

    // 6. Outage / Failure Simulation
    // e.g. "What happens if Auth Service fails?", "What if Auth Service goes down?", "Simulate an outage of X", "Simulate failure of X and Y"
    if (/^(what happens if|what if|simulate (an )?outage|simulate failure|outage simulation)/i.test(lower) ||
        lower.includes('fails') || lower.includes('goes down') || lower.includes('is down') || lower.includes('unavailable')) {
      // Check if multi-component failure (e.g. "Auth Service and Payment Service")
      const compRegex = /(?:if|outage of|failure of|what if)\s+([^?]+?)(?:\s+(?:fails|goes down|is down|is unavailable|breaks)|\?|$)/i;
      const matched = text.match(compRegex);
      if (matched) {
        const rawEntities = matched[1].trim();
        // Split by "and" or ","
        const parts = rawEntities.split(/\s+and\s+|,\s*/i).map(s => s.trim()).filter(Boolean);
        return {
          operation: INTENTS.ANALYZE_FAILURE,
          targets: parts.length > 0 ? parts : (selectedComponentId ? [selectedComponentId] : [])
        };
      }
      if (selectedComponentId) {
        return {
          operation: INTENTS.ANALYZE_FAILURE,
          targets: [selectedComponentId]
        };
      }
    }

    // 7. CREATE Component
    // e.g. "Create Notification Service as an API that depends on Auth Service and is consumed by Customer Portal"
    if (/^(create|add a new|add new|build a new)\s+(?:service|api|component|application|database|app)?/i.test(lower)) {
      const nameMatch = text.match(/(?:create|add a new|add new)\s+(?:service|api|app|application|database)?\s*(?:called\s+)?["']?([A-Za-z0-9\s\-_]+?)["']?(?:\s+as\s+|\s+of\s+type\s+|\s+that\s+|\s+which\s+|\s+with\s+|\s+depending\s+|\s+consumed\s+|\.|$)/i);
      const name = nameMatch ? nameMatch[1].trim() : '';

      // Type extraction
      let type = 'SERVICE';
      if (/application|app\b/i.test(text)) type = 'APPLICATION';
      else if (/database|db\b/i.test(text)) type = 'DATABASE';
      else if (/external\b/i.test(text)) type = 'EXTERNAL';
      else if (/service|api\b/i.test(text)) type = 'SERVICE';

      // Dependencies extraction: "depends on X and Y" / "with dependencies X, Y"
      let dependencies = [];
      const depMatch = text.match(/(?:depends on|depending on|with dependency|with dependencies)\s+([^.]+?)(?:\s+and is consumed by|\s+and consumed by|\s+consumed by|\.|$)/i);
      if (depMatch) {
        dependencies = depMatch[1].split(/\s+and\s+|,\s*/i).map(s => s.trim()).filter(Boolean);
      }

      // Consumers extraction: "consumed by A and B" / "is consumed by A"
      let consumers = [];
      const consMatch = text.match(/(?:consumed by|is consumed by|with consumer|with consumers)\s+([^.]+?)(?:\s+and depends on|\.|$)/i);
      if (consMatch) {
        consumers = consMatch[1].split(/\s+and\s+|,\s*/i).map(s => s.trim()).filter(Boolean);
      }

      return {
        operation: INTENTS.CREATE_COMPONENT,
        component: {
          name,
          type,
          dependencies,
          consumers
        }
      };
    }

    // 8. DELETE Component
    // e.g. "Delete Auth Service", "Remove Notification Service"
    if (/^(delete|remove|destroy|drop)\s+(?:the\s+)?(?:service|component|api|app)?\s*["']?([A-Za-z0-9\s\-_]+?)["']?$/i.test(lower) ||
        /^(delete|remove)\s+([a-zA-Z0-9\s\-_]+)/i.test(lower)) {
      const match = text.match(/^(?:delete|remove|destroy|drop)\s+(?:the\s+)?(?:service|component|api|app)?\s*["']?([A-Za-z0-9\s\-_]+?)["']?$/i);
      const targetName = match ? match[1].trim() : (selectedComponentId || null);
      if (targetName && !['dependency', 'consumer', 'relationship'].includes(targetName.toLowerCase())) {
        return {
          operation: INTENTS.DELETE_COMPONENT,
          target: targetName
        };
      }
    }

    // 9. ADD DEPENDENCY
    // e.g. "Make Order Service depend on Inventory Service", "Add Inventory Service as a dependency of Order Service"
    const addDepMatch = text.match(/make\s+([a-zA-Z0-9\s\-_]+?)\s+depend on\s+([a-zA-Z0-9\s\-_]+)/i) ||
                        text.match(/add\s+([a-zA-Z0-9\s\-_]+?)\s+as(?:\s+a)?\s+dependency\s+of\s+([a-zA-Z0-9\s\-_]+)/i) ||
                        text.match(/connect\s+([a-zA-Z0-9\s\-_]+?)\s+to\s+([a-zA-Z0-9\s\-_]+)/i);
    if (addDepMatch) {
      let consumerComp = addDepMatch[1].trim();
      let providerComp = addDepMatch[2].trim();
      // Handle "add X as dependency of Y" where X is provider, Y is consumer
      if (text.includes('as a dependency of') || text.includes('as dependency of')) {
        providerComp = addDepMatch[1].trim();
        consumerComp = addDepMatch[2].trim();
      }
      return {
        operation: INTENTS.ADD_DEPENDENCY,
        consumer: consumerComp,
        provider: providerComp
      };
    }

    // 10. REMOVE DEPENDENCY
    // e.g. "Remove the dependency between Order Service and Inventory Service"
    const remDepMatch = text.match(/remove(?:\s+the)?\s+dependency\s+between\s+([a-zA-Z0-9\s\-_]+?)\s+and\s+([a-zA-Z0-9\s\-_]+)/i);
    if (remDepMatch) {
      return {
        operation: INTENTS.REMOVE_DEPENDENCY,
        compA: remDepMatch[1].trim(),
        compB: remDepMatch[2].trim()
      };
    }

    // 11. ADD CONSUMER
    // e.g. "Make Customer Portal consume Order Service", "Add Customer Portal as a consumer of Notification Service"
    const addConsMatch = text.match(/make\s+([a-zA-Z0-9\s\-_]+?)\s+consume\s+([a-zA-Z0-9\s\-_]+)/i) ||
                         text.match(/add\s+([a-zA-Z0-9\s\-_]+?)\s+as(?:\s+a)?\s+consumer\s+of\s+([a-zA-Z0-9\s\-_]+)/i);
    if (addConsMatch) {
      const consumerComp = addConsMatch[1].trim();
      const providerComp = addConsMatch[2].trim();
      return {
        operation: INTENTS.ADD_CONSUMER,
        consumer: consumerComp,
        provider: providerComp
      };
    }

    // 12. UPDATE / RENAME
    // e.g. "Rename Notification Service to Alerts Service", "Change Notification Service type to API"
    const renameMatch = text.match(/rename\s+([a-zA-Z0-9\s\-_]+?)\s+to\s+([a-zA-Z0-9\s\-_]+)/i);
    if (renameMatch) {
      return {
        operation: INTENTS.UPDATE_COMPONENT,
        target: renameMatch[1].trim(),
        patch: { name: renameMatch[2].trim() }
      };
    }

    const changeTypeMatch = text.match(/change\s+([a-zA-Z0-9\s\-_]+?)\s+type\s+to\s+([a-zA-Z0-9\s\-_]+)/i);
    if (changeTypeMatch) {
      let rawType = changeTypeMatch[2].trim().toUpperCase();
      if (rawType === 'API') rawType = 'SERVICE';
      return {
        operation: INTENTS.UPDATE_COMPONENT,
        target: changeTypeMatch[1].trim(),
        patch: { type: rawType }
      };
    }

    return null;
  }

  /**
   * Extracts structured intent using Hugging Face LLM with rule-based fallback.
   * @param {string} userMessage 
   * @param {Array<object>} history 
   * @param {object} context 
   * @returns {Promise<object>}
   */
  async extractIntent(userMessage, history = [], context = {}) {
    // 1. Check deterministic rule matcher first for instant precision
    const ruleIntent = this.matchRuleBasedIntent(userMessage, context.selectedComponent?.id);
    if (ruleIntent) {
      return ruleIntent;
    }

    // 2. Query Hugging Face LLM for structured intent extraction
    const systemPrompt = `You are a precision Intent Extractor for an Enterprise API Dependency Visualizer.
Convert user natural language into a JSON object matching one of these operations:
- SUMMARIZE_ARCHITECTURE
- ANALYZE_FAILURE (targets: string[])
- ANALYZE_CHANGE_IMPACT (target: string)
- EXPLAIN_PATH (source: string, target: string)
- GET_RISKS
- GET_RECOMMENDATIONS (target: string)
- CREATE_COMPONENT (component: { name: string, type: string, dependencies: string[], consumers: string[] })
- UPDATE_COMPONENT (target: string, patch: object)
- DELETE_COMPONENT (target: string)
- ADD_DEPENDENCY (consumer: string, provider: string)
- REMOVE_DEPENDENCY (compA: string, compB: string)
- ADD_CONSUMER (consumer: string, provider: string)
- REMOVE_CONSUMER (consumer: string, provider: string)
- GENERAL_QA (query: string)

Topology Context:
${context.summaryText || ''}

Current Selected Component: ${context.selectedComponent ? context.selectedComponent.name : 'None'}

Return ONLY valid JSON matching this schema: { "operation": "...", ... }`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage }
    ];

    const hfRes = await aiHfService.chatCompletion(messages, { maxTokens: 300, temperature: 0.1 });
    if (hfRes.success && hfRes.text) {
      try {
        const jsonMatch = hfRes.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.operation && Object.values(INTENTS).includes(parsed.operation)) {
            return parsed;
          }
        }
      } catch (err) {
        // Fallback to GENERAL_QA if JSON parse fails
      }
    }

    return { operation: INTENTS.GENERAL_QA, query: userMessage };
  }
}

module.exports = {
  AiIntentService: new AiIntentService(),
  INTENTS
};
