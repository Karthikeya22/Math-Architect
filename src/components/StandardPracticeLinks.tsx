import React, { useEffect, useId, useState } from 'react';
import { ExternalLink, ChevronDown, Dumbbell } from 'lucide-react';
import { fetchPracticeLinks, type PracticeLink } from '../services/practiceLinksService';
import { fetchQuestionMaterials, type QuestionMaterial } from '../services/questionMaterialsService';

const providerToneClass = (provider: string) => {
  const key = provider.toUpperCase();
  if (key.startsWith('KHAN')) return 'practice-provider--green';
  if (key.startsWith('IXL')) return 'practice-provider--sky';
  if (key.startsWith('CPALMS')) return 'practice-provider--amber';
  return '';
};

type Props = {
  standardCode: string;
  title?: string;
  /** Shown in collapsed summary / header */
  subtitle?: string;
  maxVisible?: number;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
};

export const StandardPracticeLinks: React.FC<Props> = ({
  standardCode,
  title = 'Aligned practice (Khan Academy)',
  subtitle,
  maxVisible = 8,
  defaultOpen = false,
  collapsible = true,
  className = '',
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<PracticeLink[]>([]);
  const [materials, setMaterials] = useState<QuestionMaterial[]>([]);
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [showAll, setShowAll] = useState(false);
  const bodyId = useId();
  const providerSelectId = useId();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setShowAll(false);
    setProviderFilter('ALL');

    Promise.all([
      fetchPracticeLinks(standardCode, 50).catch(() => ({ links: [] as PracticeLink[] })),
      fetchQuestionMaterials({ standardCode, limit: 100 }).catch(() => ({
        standardId: standardCode,
        materials: [] as QuestionMaterial[],
      })),
    ])
      .then(([practiceData, materialsData]) => {
        if (!cancelled) {
          setLinks(practiceData.links);
          setMaterials(materialsData.materials);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load practice links.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [standardCode]);

  const visible = showAll ? links : links.slice(0, maxVisible);
  const hasMore = links.length > maxVisible;
  const providerOptions: string[] = ['ALL', ...Array.from(new Set<string>(materials.map((m) => String(m.provider))))];
  const filteredMaterials =
    providerFilter === 'ALL'
      ? materials
      : materials.filter((material) => material.provider === providerFilter);
  const visibleMaterials = showAll ? filteredMaterials : filteredMaterials.slice(0, maxVisible);
  const hasMoreMaterials = filteredMaterials.length > maxVisible;
  const isEmpty = links.length === 0 && materials.length === 0;

  const body = (
    <div className="practice-body" aria-busy={loading}>
      <p className="practice-disclaimer">
        Third-party practice from Khan Academy, IXL, and CPALMS. Links open in a new tab and follow each site&apos;s
        terms. This is not an official FAST item bank.
      </p>

      {loading && (
        <p className="practice-status" role="status">
          <span className="app-spinner" aria-hidden />
          Loading practice links…
        </p>
      )}

      {!loading && error && <p className="studio-alert">{error}</p>}

      {!loading && !error && isEmpty && (
        <p className="practice-status">No practice is mapped to this standard yet.</p>
      )}

      {!loading && !error && links.length > 0 && (
        <div className="practice-group">
          <h4 className="practice-group-title">
            <span className="app-badge practice-provider practice-provider--green">Khan Academy</span>
          </h4>
          <ul className="practice-list">
            {visible.map((link, i) => (
              <li key={`${link.url}-${i}`}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="practice-link">
                  <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
                  <span>{link.title}</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && materials.length > 0 && (
        <div className="practice-group">
          <div className="practice-group-head">
            <h4 className="practice-group-title">IXL and CPALMS</h4>
            {providerOptions.length > 2 && (
              <>
                <label htmlFor={providerSelectId} className="sr-only">
                  Filter by provider
                </label>
                <select
                  id={providerSelectId}
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="app-select-sm"
                >
                  {providerOptions.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider === 'ALL' ? 'All providers' : provider.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <ul className="practice-list">
            {visibleMaterials.map((material) => (
              <li key={material.id}>
                <a href={material.url} target="_blank" rel="noopener noreferrer" className="practice-link">
                  <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
                  <span>
                    <span className={`app-badge practice-provider ${providerToneClass(material.provider)}`}>
                      {material.provider.replaceAll('_', ' ')}
                    </span>{' '}
                    {material.title}
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                {material.description && <p className="practice-desc">{material.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && (hasMore || hasMoreMaterials) && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="app-text-button self-start">
          {showAll ? 'Show fewer' : `Show all ${links.length + filteredMaterials.length}`}
        </button>
      )}
    </div>
  );

  if (!collapsible) {
    return (
      <section className={`app-section ${className}`} aria-label={title}>
        <h2 className="app-section-head">
          <span className="app-icon-tile app-icon-tile--green" aria-hidden="true">
            <Dumbbell className="w-4 h-4" strokeWidth={1.75} />
          </span>
          {title}
        </h2>
        {subtitle && subtitle !== standardCode && <p className="app-section-sub">{subtitle}</p>}
        {body}
      </section>
    );
  }

  return (
    <div className={`app-section practice-collapsible ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="practice-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <span className="min-w-0">
          <span className="practice-toggle-title">{title}</span>
          {subtitle && <span className="practice-toggle-sub">{subtitle}</span>}
        </span>
        <ChevronDown
          className={`w-5 h-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }}
          aria-hidden
        />
      </button>
      {open && (
        <div id={bodyId} className="practice-collapsible-body">
          {body}
        </div>
      )}
    </div>
  );
};
