import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Standard } from '../types';

interface StandardDropdownProps {
  standards: Standard[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function StandardDropdown({ standards, value, onChange, disabled }: StandardDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredStandard, setHoveredStandard] = useState<Standard | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = (standard: Standard) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredStandard(standard);
    }, 1000); // 1 second delay requested by user
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
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium disabled:opacity-50 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="block truncate">
          {value || "Select..."}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {standards.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 text-center">No standards available</div>
            ) : (
              <ul className="py-1">
                {standards.map((s) => (
                  <li
                    key={s.code}
                    className={`relative cursor-pointer select-none py-2 pl-4 pr-9 hover:bg-blue-50 ${value === s.code ? 'text-blue-900 bg-blue-50/50' : 'text-slate-700'}`}
                    onClick={() => handleSelect(s.code)}
                    onMouseEnter={() => handleMouseEnter(s)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span className={`block truncate ${value === s.code ? 'font-semibold' : 'font-normal'}`}>
                      {s.code}
                    </span>
                    
                    {value === s.code && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Tooltip rendered outside overflow container to prevent clipping */}
          {hoveredStandard && (
            <div 
              className="fixed w-80 p-4 bg-slate-800 text-white text-sm rounded-xl shadow-2xl z-[9999] pointer-events-none border border-slate-700 transition-opacity duration-200"
              style={{ 
                left: Math.min(mousePos.x + 15, window.innerWidth - 340), // keep on screen horizontally
                top: Math.min(mousePos.y + 15, window.innerHeight - 150) // keep on screen vertically
              }}
            >
              <strong className="block mb-2 text-blue-300 text-base">{hoveredStandard.code}</strong>
              <p className="leading-relaxed opacity-90">{hoveredStandard.description}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
