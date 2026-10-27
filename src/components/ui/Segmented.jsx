import { useRef } from 'react';

// iOS-style segmented control. options = [{ value, label }]. Arrow keys move the selection (radiogroup).
export default function Segmented({ options, value, onChange, label, className = '', fullWidth = false }) {
  const groupRef = useRef(null);

  const onKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = options.findIndex((option) => option.value === value);
    const next = options[(index + step + options.length) % options.length];
    onChange(next.value);
    groupRef.current?.querySelector(`[data-value="${CSS.escape(String(next.value))}"]`)?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`${fullWidth ? 'flex w-full' : 'inline-flex'} rounded-pill bg-white/10 p-0.5 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-value={option.value}
            onClick={() => onChange(option.value)}
            className={`min-h-tap whitespace-nowrap rounded-pill px-4 text-subhead font-medium text-label-2 transition-[background-color,color] duration-fast ease-standard hover:text-label-1 aria-checked:bg-white/[0.18] aria-checked:text-label-1 aria-checked:shadow-[0_1px_3px_rgb(0_0_0/0.3)] can-hover:min-h-9 ${
              fullWidth ? 'flex-1' : ''
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
