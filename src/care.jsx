// Hearth — the care block.
//
// Shown only when a free-text surface saw signs that someone may be
// carrying more than a reading can hold. Previously this lived inside
// the Carry screen and so covered exactly one of the four places a
// person writes freely in Hearth. It is shared now: Carry, the journal,
// and Attune all render this same block from the same server signal.
//
// SCOPE, deliberately narrow (docs/HEARTH_BRAND_BRIEF.md §5.9). Hearth
// is a companion, not a clinician. This block does not assess, score,
// triage, or plan. It says one true thing and gives real numbers that
// can actually be dialled where the reader is. The numbers are composed
// server-side and are never model-generated, so a hallucinated hotline
// can never reach someone at their lowest.
//
// Tone rules: quiet, never alarmed, never interrupting what the reader
// came to do. It sits alongside, it does not take over the screen, and
// it is never a modal.

import React from 'react';

function CareBlock({ care }) {
  if (!care || !care.flagged) return null;
  return (
    <section style={{ padding: '28px 22px 0' }}>
      <div style={{ background: 'var(--hh-isabel)', padding: '22px 24px' }}>
        <div className="mono" style={{
          fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--hh-green)', marginBottom: 12,
        }}>
          Before we go on
        </div>
        {care.note && (
          <p className="body" style={{ margin: 0, color: 'var(--paper-2)', lineHeight: 1.6 }}>
            {care.note}
          </p>
        )}
        <div style={{ marginTop: 16 }}>
          {(care.lines || []).map((l, i) => (
            <div key={`${l.name}-${i}`} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              gap: 12, padding: '8px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(31, 64, 69, 0.10)',
            }}>
              <span className="body" style={{ fontSize: 13.5, color: 'var(--hh-green)' }}>
                {l.name}
                {l.detail && <span style={{ color: 'var(--paper-mute)' }}> · {l.detail}</span>}
              </span>
              <span className="mono" style={{
                fontSize: 12, letterSpacing: '0.06em', color: 'var(--hh-green)', whiteSpace: 'nowrap',
              }}>
                {l.contact}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { CareBlock };
