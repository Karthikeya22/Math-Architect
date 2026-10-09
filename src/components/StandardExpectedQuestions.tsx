import React, { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { buildStandardQuestionExpectations } from '../utils/buildStandardQuestionExpectations';

type Props = {
  standardCode: string;
  description?: string;
  className?: string;
};

export const StandardExpectedQuestions: React.FC<Props> = ({
  standardCode,
  description,
  className = '',
}) => {
  const profile = useMemo(
    () =>
      buildStandardQuestionExpectations({
        standardCode,
        description,
      }),
    [standardCode, description],
  );

  return (
    <div className={className}>
      <div className="coherence-atlas-section-label">
        <ClipboardList className="w-3.5 h-3.5" />
        Expected questions
      </div>

      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed" style={{ color: '#3A3528' }}>
        {profile.highlights.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              className="mt-2 h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: 'var(--accent-strong)' }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
