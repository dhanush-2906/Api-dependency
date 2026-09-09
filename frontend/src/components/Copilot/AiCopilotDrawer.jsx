import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Trash2, 
  Sparkles, 
  Layers, 
  RefreshCw,
  Cpu,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import AiMessageItem from './AiMessageItem';
import { sendAiChat, executeAiMutation, getAiSuggestions } from '../../services/api';

const INITIAL_GREETING = {
  role: 'assistant',
  text: `### AI Architecture Copilot Ready
I am your enterprise architecture copilot powered by Hugging Face and grounded in your live dependency topology.

You can ask me to:
• **Analyze Outages:** "What happens if Auth Service fails?"
• **Explain Dependencies:** "Why is Customer Portal affected by Auth Service?"
• **Identify Risks:** "What are the biggest architectural risks & single points of failure?"
• **Modify Ecosystem:** "Create Notification Service as an API depending on Auth Service"
• **Summarize:** "Summarize my architecture"`,
  type: 'TEXT'
};

export default function AiCopilotDrawer({
  isOpen,
  onClose,
  selectedComponentId,
  selectedDetails,
  mode,
  impactData,
  onSelectComponent,
  onRefreshEcosystem
}) {
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executingMutation, setExecutingMutation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Fetch contextual suggestions when drawer opens or selected component changes
  useEffect(() => {
    let isMounted = true;
    const loadSuggestions = async () => {
      try {
        const list = await getAiSuggestions(selectedComponentId);
        if (isMounted) setSuggestions(list || []);
      } catch (err) {
        console.error('Failed to load AI suggestions:', err);
      }
    };
    if (isOpen) {
      loadSuggestions();
    }
    return () => { isMounted = false; };
  }, [isOpen, selectedComponentId]);

  // Send Message handler
  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const userMessage = { role: 'user', text: query, type: 'TEXT' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.text
      }));

      const activeAnalysis = mode !== 'NORMAL' ? { mode, impactData } : null;

      const aiResponse = await sendAiChat({
        message: query,
        history: historyPayload,
        selectedComponentId,
        activeAnalysis
      });

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error('AI Copilot request failed:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to communicate with AI Copilot.';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **AI Copilot Error:** ${errorMsg}`,
          type: 'ERROR'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Confirmed Mutation execution
  const handleConfirmMutation = async ({ operation, payload }) => {
    setExecutingMutation(true);
    try {
      const result = await executeAiMutation({ operation, payload });
      
      // Hot-reload the live application graph, metrics, and details!
      if (onRefreshEcosystem) {
        const affectedId = result.component?.id || (payload.id || null);
        await onRefreshEcosystem(affectedId);
      }

      // Append confirmation success message in chat
      const successMessage = {
        role: 'assistant',
        text: `✅ **Operation Executed Successfully:** ${result.message}\n\n` +
          `• **Total Components:** ${result.summary?.componentCount || 'Updated'}\n` +
          `• **Canonical Edges:** ${result.summary?.edgeCount || 'Updated'}\n\n` +
          `The live graph canvas, metrics strip, and navigator have been synchronized with this change.`,
        type: 'TEXT'
      };

      setMessages(prev => [...prev, successMessage]);
    } catch (err) {
      console.error('Failed to execute confirmed mutation:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Mutation execution failed.';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `❌ **Mutation Execution Failed:** ${errorMsg}`,
          type: 'ERROR'
        }
      ]);
    } finally {
      setExecutingMutation(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_GREETING]);
  };

  if (!isOpen) return null;

  return (
    <aside className={`ai-copilot-drawer ${isExpanded ? 'expanded' : ''}`}>
      {/* Drawer Header */}
      <div className="ai-drawer-header">
        <div className="ai-drawer-header-left">
          <div className="ai-bot-badge-icon">
            <Sparkles size={15} color="var(--brand-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="ai-drawer-title">Architecture Copilot</span>
              <span className="ai-model-tag">Llama-3.3 70B</span>
            </div>
            <div className="ai-status-subtext">
              <span className="ai-status-pulse" />
              <span>Grounded in Active Topology</span>
              {selectedDetails?.component && (
                <span className="ai-focus-pill" title="Current selected component context">
                  Focus: {selectedDetails.component.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ai-drawer-header-actions">
          <button 
            type="button" 
            className="btn-icon" 
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse width' : 'Expand width'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button 
            type="button" 
            className="btn-icon" 
            onClick={handleClearChat}
            title="Clear conversation history"
          >
            <Trash2 size={14} />
          </button>
          <button 
            type="button" 
            className="btn-icon" 
            onClick={onClose}
            title="Close Copilot (Ctrl+J)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Suggestion Prompts Strip */}
      {suggestions.length > 0 && (
        <div className="ai-suggestions-strip">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              className="ai-suggestion-chip"
              onClick={() => handleSendMessage(sug.prompt)}
              disabled={loading}
            >
              <span>{sug.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages List Area */}
      <div className="ai-messages-container">
        {messages.map((msg, idx) => (
          <AiMessageItem
            key={idx}
            message={msg}
            onSelectComponent={onSelectComponent}
            onConfirmMutation={handleConfirmMutation}
            isExecutingMutation={executingMutation}
          />
        ))}

        {loading && (
          <div className="ai-message-row assistant-row">
            <div className="ai-avatar assistant">
              <Bot size={14} />
            </div>
            <div className="ai-message-bubble assistant-bubble loading-bubble">
              <div className="ai-typing-indicator">
                <span />
                <span />
                <span />
              </div>
              <span className="ai-typing-text">Analyzing graph topology &amp; calculating impact...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="ai-input-area">
        <form 
          className="ai-input-wrapper"
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        >
          <textarea
            ref={inputRef}
            className="ai-input-field"
            placeholder={
              selectedDetails?.component 
                ? `Ask about ${selectedDetails.component.name}, simulate outage, or modify...`
                : "Ask architecture question, simulate outage, or create service..."
            }
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || executingMutation}
          />

          <button
            type="submit"
            className="ai-send-btn"
            disabled={!inputValue.trim() || loading || executingMutation}
            title="Send message (Enter)"
          >
            <Send size={14} />
          </button>
        </form>

        <div className="ai-input-hint">
          <span>Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline • <strong>Ctrl+J</strong> to toggle</span>
        </div>
      </div>
    </aside>
  );
}
