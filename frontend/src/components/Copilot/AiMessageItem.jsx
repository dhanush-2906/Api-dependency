import React from 'react';
import { 
  Bot, 
  User, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  Lightbulb,
  Cpu,
  Layers
} from 'lucide-react';
import AiChangePreviewCard from './AiChangePreviewCard';

export default function AiMessageItem({
  message,
  onSelectComponent,
  onConfirmMutation,
  isExecutingMutation
}) {
  const isUser = message.role === 'user';
  const isError = message.type === 'ERROR';
  const isMutation = message.type === 'MUTATION_PREVIEW';

  // Helper to render text with clickable component pills and callouts
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');

    return lines.map((line, idx) => {
      // 1. Headers ###
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="ai-msg-heading">
            {line.replace('### ', '')}
          </h4>
        );
      }

      // 2. FACT Callout
      if (line.startsWith('**FACT:**') || line.startsWith('**FACT')) {
        return (
          <div key={idx} className="ai-callout fact">
            <span className="ai-callout-tag fact">FACT</span>
            <span className="ai-callout-text">{line.replace(/\*\*FACT:?\*\*/g, '').trim()}</span>
          </div>
        );
      }

      // 3. INFERENCE Callout
      if (line.startsWith('**INFERENCE:**') || line.startsWith('**INFERENCE')) {
        return (
          <div key={idx} className="ai-callout inference">
            <span className="ai-callout-tag inference">INFERENCE</span>
            <span className="ai-callout-text">{line.replace(/\*\*INFERENCE:?\*\*/g, '').trim()}</span>
          </div>
        );
      }

      // 4. RECOMMENDATION Callout
      if (line.startsWith('**RECOMMENDATION:**') || line.startsWith('**RECOMMENDATION') || line.startsWith('**RECOMMENDATIONS:**')) {
        return (
          <div key={idx} className="ai-callout recommendation">
            <span className="ai-callout-tag recommendation">RECOMMENDATION</span>
            <span className="ai-callout-text">{line.replace(/\*\*RECOMMENDATIONS?:?\*\*/g, '').trim()}</span>
          </div>
        );
      }

      // 5. Bullet Points • or -
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ') || /^\d+\.\s/.test(line.trim())) {
        const cleanLine = line.trim().replace(/^[•\-\d.]\s*/, '');
        return (
          <div key={idx} className="ai-bullet-item">
            <span className="ai-bullet-dot">›</span>
            <span>{parseInlineFormatting(cleanLine)}</span>
          </div>
        );
      }

      // 6. Blank lines
      if (!line.trim()) {
        return <div key={idx} style={{ height: 6 }} />;
      }

      // 7. Regular paragraph
      return (
        <p key={idx} className="ai-paragraph">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  // Parses `code`, **bold**, and clickable components
  const parseInlineFormatting = (text) => {
    // Regex splits by `code`, **bold**, or standard text
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

    return parts.map((part, i) => {
      if (!part) return null;

      // Inline code `...`
      if (part.startsWith('`') && part.endsWith('`')) {
        const val = part.slice(1, -1);
        return (
          <code 
            key={i} 
            className="ai-inline-code clickable"
            onClick={() => onSelectComponent && onSelectComponent(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
            title={`Select ${val} on canvas`}
          >
            {val}
          </code>
        );
      }

      // Bold **...**
      if (part.startsWith('**') && part.endsWith('**')) {
        const val = part.slice(2, -2);
        return <strong key={i} className="ai-bold">{val}</strong>;
      }

      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`ai-message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
      {/* Avatar */}
      <div className={`ai-avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? <User size={13} /> : <Bot size={14} />}
      </div>

      {/* Message Content */}
      <div className={`ai-message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'} ${isError ? 'error-bubble' : ''}`}>
        {/* Message Body */}
        <div className="ai-message-content">
          {renderFormattedText(message.text)}
        </div>

        {/* Mutation Preview Card */}
        {isMutation && message.proposedChange && (
          <div style={{ marginTop: 10 }}>
            <AiChangePreviewCard
              proposedChange={message.proposedChange}
              operation={message.operation}
              payload={message.payload}
              onConfirm={onConfirmMutation}
              isExecuting={isExecutingMutation}
            />
          </div>
        )}

        {/* Ambiguous matches chips if any */}
        {message.ambiguous && message.ambiguous.length > 0 && (
          <div className="ai-ambiguous-box">
            <span className="ai-field-label">Did you mean:</span>
            <div className="ai-chip-wrap" style={{ marginTop: 4 }}>
              {message.ambiguous.map((amb, i) => (
                <button
                  key={i}
                  type="button"
                  className="ai-preview-chip disambiguate"
                  onClick={() => onSelectComponent && onSelectComponent(amb.id)}
                >
                  {amb.name} ({amb.type})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
