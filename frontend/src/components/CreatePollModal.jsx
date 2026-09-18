// src/components/CreatePollModal.jsx
// Floating glass modal to create a new poll with 2-6 options.

import React, { useState } from 'react';
import { createPoll } from '../api/polls';
import { nanoid } from '../utils/nanoid';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, Zap } from 'lucide-react';

export default function CreatePollModal({ onClose, onCreated }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions]   = useState([
    { id: nanoid(), text: '' },
    { id: nanoid(), text: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions(prev => [...prev, { id: nanoid(), text: '' }]);
  };

  const removeOption = (id) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter(o => o.id !== id));
  };

  const updateOption = (id, text) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, text } : o));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim())                      return toast.error('Question cannot be empty');
    if (options.some(o => !o.text.trim()))     return toast.error('All options must have text');

    setSubmitting(true);
    try {
      const poll = await createPoll({
        question: question.trim(),
        options:  options.map(o => ({ id: o.id, text: o.text.trim(), votes: 0 })),
      });
      onCreated(poll);
      toast.success('Poll launched into orbit 🛸');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-panel modal-panel w-full max-w-lg p-5 sm:p-8 animate-float-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-bold text-accent text-glow-cyan tracking-wider"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            ⚡ NEW POLL
          </h2>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="text-dim hover:text-danger transition-colors p-1 rounded-lg hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="divider-glow mb-6" />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Question input */}
          <div>
            <label className="block text-xs text-accent font-mono uppercase tracking-widest mb-2">
              Question
            </label>
            <input
              id="poll-question-input"
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="What should we explore next?"
              className="w-full px-4 py-3 rounded-xl text-sm text-text placeholder:text-dim outline-none
                         border border-border bg-surface-2 focus:border-accent/50 transition-colors
                         focus:ring-2 focus:ring-accent/50"
              style={{ background: 'color-mix(in srgb, var(--accent) 6%, var(--surface-2))' }}
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="block text-xs text-accent-2 font-mono uppercase tracking-widest">
              Options
            </label>
            {options.map((opt, idx) => {
              const optionAccents = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', 'var(--accent-4)'];
              const optionAccent = optionAccents[idx % optionAccents.length];
              return (
              <div key={opt.id} className="flex gap-2 items-center">
                <span className="text-xs font-mono w-4 shrink-0" style={{ color: optionAccent }}>{idx + 1}</span>
                <input
                  id={`option-input-${opt.id}`}
                  type="text"
                  value={opt.text}
                  onChange={e => updateOption(opt.id, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm text-text placeholder:text-dim outline-none
                             border focus:ring-2 focus:ring-accent/50 transition-colors"
                  style={{
                    background: `color-mix(in srgb, ${optionAccent} 8%, var(--surface-2))`,
                    borderColor: `color-mix(in srgb, ${optionAccent} 45%, var(--border))`,
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  disabled={options.length <= 2}
                  className="text-dim hover:text-danger transition-colors p-1.5 rounded-lg
                             hover:bg-danger/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              );
            })}

            {options.length < 6 && (
              <button
                type="button"
                id="add-option-btn"
                onClick={addOption}
                className="flex items-center gap-2 text-xs text-accent hover:text-accent
                           transition-colors font-mono px-2 py-1 rounded-lg hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <Plus size={14} /> Add option
              </button>
            )}
          </div>

          <div className="divider-glow" />

          {/* Submit */}
          <button
            id="create-poll-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full btn-neon-cyan py-3.5 font-display tracking-widest flex items-center
                       justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem' }}
          >
            <Zap size={16} />
            {submitting ? 'LAUNCHING…' : 'LAUNCH POLL'}
          </button>
        </form>
      </div>
    </div>
  );
}
