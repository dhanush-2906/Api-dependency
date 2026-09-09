/**
 * AI Entity Resolution Service
 * Resolves natural language references to exact graph component IDs.
 * Handles exact matches, case-insensitive matches, slug matches, aliases, contextual pronouns, and ambiguity.
 */

const datasetService = require('../dataset.service');
const { toComponentId } = require('../../models/Component');

class AiEntityService {
  /**
   * Resolves a query string or entity name to a single component or returns ambiguity/unknown.
   * @param {string} rawInput 
   * @param {string|null} selectedComponentId 
   * @returns {{ match: object|null, ambiguous: Array<object>|null, error: string|null }}
   */
  resolveComponent(rawInput, selectedComponentId = null) {
    if (!rawInput || typeof rawInput !== 'string') {
      return { match: null, ambiguous: null, error: 'Empty component reference' };
    }

    const trimmed = rawInput.trim();
    const lower = trimmed.toLowerCase();
    const graph = datasetService.getGraph();
    const components = graph.getAllComponents();

    // 1. Contextual Pronouns ("this", "it", "current", "selected", "the selected service")
    const pronounKeywords = ['this', 'it', 'the service', 'this service', 'current', 'current service', 'selected', 'selected service', 'the selected component'];
    if (pronounKeywords.includes(lower) || lower.startsWith('this ') || lower === 'this') {
      if (selectedComponentId) {
        const selected = graph.getComponent(selectedComponentId);
        if (selected) {
          return { match: selected, ambiguous: null, error: null };
        }
      }
      return { match: null, ambiguous: null, error: 'No component is currently selected in the graph context.' };
    }

    // 2. Exact ID match
    const byId = graph.getComponent(trimmed);
    if (byId) return { match: byId, ambiguous: null, error: null };

    // 3. Exact Normalized Slug match
    const slug = toComponentId(trimmed);
    const bySlug = graph.getComponent(slug);
    if (bySlug) return { match: bySlug, ambiguous: null, error: null };

    // 4. Case-insensitive exact name match
    const exactNameMatch = components.find(c => c.name.toLowerCase() === lower);
    if (exactNameMatch) return { match: exactNameMatch, ambiguous: null, error: null };

    // 5. Cleaned suffix matching (e.g. "auth" -> "Auth Service", "pricing" -> "Pricing Service", "portal" -> "Customer Portal")
    const cleanLower = lower
      .replace(/\b(service|api|app|application|database|db|gateway|system)\b/gi, '')
      .trim();

    const candidateMatches = [];

    for (const comp of components) {
      const compLower = comp.name.toLowerCase();
      const compClean = compLower
        .replace(/\b(service|api|app|application|database|db|gateway|system)\b/gi, '')
        .trim();

      // Check if cleaned query matches cleaned component name
      if (cleanLower && (compClean === cleanLower || compClean.includes(cleanLower) || cleanLower.includes(compClean))) {
        candidateMatches.push(comp);
      } else if (compLower.includes(lower) || lower.includes(compLower)) {
        candidateMatches.push(comp);
      }
    }

    if (candidateMatches.length === 1) {
      return { match: candidateMatches[0], ambiguous: null, error: null };
    }

    if (candidateMatches.length > 1) {
      // Check if one is a perfect prefix or exact word match
      const perfectWordMatch = candidateMatches.filter(c => {
        const words = c.name.toLowerCase().split(/\s+/);
        return words.includes(cleanLower) || words.includes(lower);
      });
      if (perfectWordMatch.length === 1) {
        return { match: perfectWordMatch[0], ambiguous: null, error: null };
      }

      return {
        match: null,
        ambiguous: candidateMatches.map(c => ({ id: c.id, name: c.name, type: c.type })),
        error: `Found multiple matching components: ${candidateMatches.map(c => c.name).join(', ')}. Please specify which one you mean.`
      };
    }

    return { match: null, ambiguous: null, error: `Component '${rawInput}' does not exist in the current architecture.` };
  }

  /**
   * Resolves an array of component names/references.
   * @param {Array<string>} names 
   * @param {string|null} selectedComponentId 
   * @returns {{ resolved: Array<object>, unresolved: Array<string>, ambiguous: Array<object> }}
   */
  resolveMultiple(names = [], selectedComponentId = null) {
    const resolved = [];
    const unresolved = [];
    const ambiguous = [];

    for (const name of names) {
      if (!name || typeof name !== 'string') continue;
      const res = this.resolveComponent(name, selectedComponentId);
      if (res.match) {
        resolved.push(res.match);
      } else if (res.ambiguous) {
        ambiguous.push({ query: name, matches: res.ambiguous });
      } else {
        unresolved.push(name.trim());
      }
    }

    return { resolved, unresolved, ambiguous };
  }
}

module.exports = new AiEntityService();
