'use client';

import React from 'react';

interface FormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

interface InputProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  options?: { value: string; label: string }[];
  rows?: number;
}

export function Form({ children, onSubmit, className = '' }: FormProps) {
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}

export function FormGroup({ children, className = '' }: FormProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function FormLabel({ children, htmlFor, className = '' }: { children: React.ReactNode; htmlFor: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`form-label ${className}`}>
      {children}
    </label>
  );
}

export function FormInput({ 
  id, 
  name, 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required, 
  disabled, 
  error, 
  hint,
  className = '',
  min,
  max,
  step
}: InputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`form-input ${error ? 'border-red-500 dark:border-red-400' : ''} ${className}`}
      />
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function FormSelect({ 
  id, 
  name, 
  label, 
  value, 
  onChange, 
  required, 
  disabled, 
  error, 
  hint,
  options = [],
  className = ''
}: InputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`form-select ${error ? 'border-red-500 dark:border-red-400' : ''} ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function FormTextarea({ 
  id, 
  name, 
  label, 
  value, 
  onChange, 
  placeholder, 
  required, 
  disabled, 
  error, 
  hint,
  rows = 3,
  className = ''
}: InputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`form-textarea ${error ? 'border-red-500 dark:border-red-400' : ''} ${className}`}
      />
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function FormCheckbox({ 
  id, 
  name, 
  label, 
  value, 
  onChange, 
  required, 
  disabled, 
  error, 
  hint,
  className = ''
}: InputProps) {
  return (
    <div className="mb-4 flex items-start">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={value === 'true' || value === true}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`form-checkbox ${error ? 'border-red-500 dark:border-red-400' : ''} ${className}`}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className="form-label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <p className="form-hint">{hint}</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  );
}
