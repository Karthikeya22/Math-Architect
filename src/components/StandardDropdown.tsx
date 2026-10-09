import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Standard } from '../types';

interface StandardDropdownProps {
  standards: Standard[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
}

export function StandardDropdown({
  standards,
  value,
  onChange,
  disabled,
  id,
  placeholder = 'Choose a benchmark',
}: StandardDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredStandard, setHoveredStandard] = useState<Standard | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = standards.find((s) => s.code === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleMouseEnter = (standard: Standard) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredStandard(standard);
    }, 1000);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredStandard(null);
  };

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    handleMouseLeave();
    triggerRef.current?.focus();
  };

  return (
    <div className="relative w-full min-w-0" ref={containerRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="app-input studio-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`block truncate ${value ? 'font-mono' : 'studio-select-placeholder'}`} translate={value ? 'no' : undefined}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden />
      </button>

      {isOpen && (
        <>
          <div className="studio-menu" role="listbox" aria-label="Standards">
            {standards.length === 0 ? (
              <div className="studio-menu-empty">No standards match these filters.</div>
            ) : (
              <ul className="py-1">
                {standards.map((s) => {
                  const isSelected = value === s.code;
                  return (
                    <li key={s.code} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`studio-menu-option ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelect(s.code)}
                        onMouseEnter={() => handleMouseEnter(s)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        title={s.description}
                      >
                        <span className="font-mono truncate" translate="no">
                          {s.code}
                        </span>
                        {isSelected && <Check className="w-4 h-4 shrink-0" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {hoveredStandard && (
            <div
              className="studio-tooltip"
              style={{
                left: Math.min(mousePos.x + 15, window.innerWidth - 340),
                top: Math.min(mousePos.y + 15, window.innerHeight - 150),
              }}
            >
              <strong className="studio-tooltip-code" translate="no">
                {hoveredStandard.code}
              </strong>
              <p>{hoveredStandard.description}</p>
            </div>
          )}
        </>
      )}
      {selected && <span className="sr-only-live">{selected.description}</span>}
    </div>
  );
}
