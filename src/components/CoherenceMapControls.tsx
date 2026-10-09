import React from 'react';
import { X } from 'lucide-react';
import type { GradeLevel, Standard } from '../types';
import type { CoherenceAtlasLayout, CoherenceAtlasScope } from '../utils/buildCoherenceAtlasModel';
import { gradeColumnLabel } from '../utils/buildCoherenceAtlasModel';
import { StandardDropdown } from './StandardDropdown';

type Props = {
  layout: CoherenceAtlasLayout;
  scope: CoherenceAtlasScope;
  onScopeChange: (scope: CoherenceAtlasScope) => void;
  focusGrade: GradeLevel | '';
  onFocusGradeChange: (grade: GradeLevel | '') => void;
  k8Grades: GradeLevel[];
  strandFilter: Set<string>;
  onToggleStrand: (strand: string) => void;
  filteredStandards: Standard[];
  pinnedStandardCode: string;
  onPinStandard: (code: string) => void;
  onClearPin: () => void;
};

export const CoherenceMapControls: React.FC<Props> = ({
  layout,
  scope,
  onScopeChange,
  focusGrade,
  onFocusGradeChange,
  k8Grades,
  strandFilter,
  onToggleStrand,
  filteredStandards,
  pinnedStandardCode,
  onPinStandard,
  onClearPin,
}) => {
  const pinDisabled = scope === 'k8' && !focusGrade;

  return (
    <section className="coherence-atlas-panel" aria-labelledby="studio-filters-heading">
      <div className="studio-filters">
        <h2 id="studio-filters-heading" className="sr-only-live">
          Standard filters
        </h2>

        <div className="studio-filter-row">
          <span className="studio-filter-label" id="scope-label">
            Scope
          </span>
          <div className="studio-filter-options" role="group" aria-labelledby="scope-label">
            <button
              type="button"
              onClick={() => onScopeChange('k8')}
              className={`coherence-atlas-chip ${scope === 'k8' ? 'coherence-atlas-chip--active' : ''}`}
              aria-pressed={scope === 'k8'}
            >
              K–8
            </button>
            <button
              type="button"
              onClick={() => onScopeChange('912')}
              className={`coherence-atlas-chip ${scope === '912' ? 'coherence-atlas-chip--active' : ''}`}
              aria-pressed={scope === '912'}
            >
              9–12
            </button>
          </div>
        </div>

        {scope === 'k8' && (
          <div className="studio-filter-row">
            <span className="studio-filter-label" id="grade-label">
              Grade
            </span>
            <div className="studio-filter-options" role="group" aria-labelledby="grade-label">
              {k8Grades.map((grade) => {
                const active = focusGrade === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => onFocusGradeChange(grade)}
                    className={`coherence-atlas-chip coherence-atlas-chip--grade ${active ? 'coherence-atlas-chip--active' : ''}`}
                    aria-pressed={active}
                    aria-label={grade}
                  >
                    {gradeColumnLabel(grade)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="studio-filter-row">
          <span className="studio-filter-label" id="strand-label">
            Strands
          </span>
          <div className="studio-filter-options" role="group" aria-labelledby="strand-label">
            {layout.strands.map((strand) => {
              const active = strandFilter.has(strand);
              const meta = layout.strandMeta[strand];
              return (
                <button
                  key={strand}
                  type="button"
                  onClick={() => onToggleStrand(strand)}
                  className={`coherence-atlas-chip coherence-atlas-chip--strand ${active ? 'is-on' : ''}`}
                  style={{ '--strand-color': meta.color, '--strand-tint': meta.tint } as React.CSSProperties}
                  aria-pressed={active}
                  title={meta.title}
                >
                  <span className="strand-swatch" style={{ background: meta.color }} aria-hidden />
                  <span translate="no">{strand}</span>
                  <span className="strand-title">{meta.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="studio-filter-row studio-filter-row--pin">
          <label className="studio-filter-label" htmlFor="pin-standard-trigger">
            Standard
          </label>
          <div className="studio-pin-field">
            <StandardDropdown
              id="pin-standard-trigger"
              standards={filteredStandards}
              value={pinnedStandardCode}
              onChange={onPinStandard}
              disabled={pinDisabled}
              placeholder={pinDisabled ? 'Pick a grade first' : 'Choose a benchmark'}
            />
            {pinnedStandardCode && (
              <button
                type="button"
                onClick={onClearPin}
                className="coherence-atlas-btn-secondary inline-flex items-center gap-1.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
