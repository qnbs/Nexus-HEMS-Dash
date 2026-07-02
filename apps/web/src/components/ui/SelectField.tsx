import { ChevronDown } from 'lucide-react';
import type { ReactNode, SelectHTMLAttributes } from 'react';

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  children: ReactNode;
}

/**
 * Styled native select matching the glass design system.
 * Uses appearance-none with a custom chevron for a consistent modern look.
 */
export function SelectField({
  label,
  hint,
  id,
  className = '',
  children,
  ...selectProps
}: SelectFieldProps) {
  const fieldId = id ?? selectProps.name;

  return (
    <div className={`select-field ${className}`.trim()}>
      <label htmlFor={fieldId} className="select-field-label">
        {label}
      </label>
      <div className="select-field-control">
        <select id={fieldId} className="select-field-native focus-ring" {...selectProps}>
          {children}
        </select>
        <ChevronDown className="select-field-chevron" aria-hidden="true" />
      </div>
      {hint ? <p className="select-field-hint">{hint}</p> : null}
    </div>
  );
}
