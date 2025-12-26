"use client";

import { useState, useEffect } from 'react';

type EditableFieldProps = {
  value: string | number;
  onUpdate: (value: string | number) => void;
  type?: 'text' | 'number' | 'date';
  className?: string;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
  id?: string;
};

export function EditableField({
  value,
  onUpdate,
  type = 'text',
  className = '',
  placeholder,
  step,
  min,
  max,
  id,
}: EditableFieldProps) {
  const [localValue, setLocalValue] = useState<string | number>(value);
  const [isEditing, setIsEditing] = useState(false);

  // Sync external value changes when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    
    // Only update if value has changed
    if (localValue !== value) {
      onUpdate(localValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      const numValue = e.target.value === '' ? '' : e.target.value;
      setLocalValue(numValue);
    } else {
      setLocalValue(e.target.value);
    }
  };

  return (
    <input
      type={type}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      id={id}
    />
  );
}
