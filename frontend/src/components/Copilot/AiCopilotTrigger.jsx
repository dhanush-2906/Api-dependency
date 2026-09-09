import React from 'react';
import { Sparkles, Bot } from 'lucide-react';

export default function AiCopilotTrigger({ isOpen, onToggle }) {
  if (isOpen) return null;

  return (
    <button
      type="button"
      className="ai-copilot-floating-trigger"
      onClick={onToggle}
      title="Open AI Architecture Copilot (Ctrl+J)"
    >
      <div className="ai-trigger-sparkle">
        <Sparkles size={16} />
      </div>
      <span className="ai-trigger-label">AI Copilot</span>
      <span className="ai-trigger-shortcut">Ctrl J</span>
    </button>
  );
}
