'use client';
import type { ReactNode } from 'react';
import { useController, type ControllerRenderProps, type FieldPath, type FieldPathValue, type FieldValues, type UseControllerProps } from 'react-hook-form';
import { Field } from './core.js';

export interface RHFFieldProps<T extends FieldValues, N extends FieldPath<T>> extends UseControllerProps<T, N> {
  label: string;
  hint?: string;
  required?: boolean;
  children: (field: ControllerRenderProps<T, N>) => ReactNode;
}

/** Labels and errors for native inputs registered with useController. */
export function RHFField<T extends FieldValues, N extends FieldPath<T>>({label, hint, required, children, ...options}: RHFFieldProps<T, N>) {
  const {field, fieldState} = useController(options);
  return <Field label={label} hint={hint} required={required} error={fieldState.error?.message}>{children(field)}</Field>;
}

export interface RHFControlBinding<T extends FieldValues, N extends FieldPath<T>> {
  name: N;
  value: FieldPathValue<T, N>;
  onValueChange: (value: FieldPathValue<T, N>) => void;
  onBlur: () => void;
  inputRef: ControllerRenderProps<T, N>['ref'];
  disabled?: boolean;
  error?: string;
}

export interface RHFControlProps<T extends FieldValues, N extends FieldPath<T>> extends UseControllerProps<T, N> {
  children: (binding: RHFControlBinding<T, N>) => ReactNode;
}

/** Value, touch, focus and error bindings for controls that own their label. */
export function RHFControl<T extends FieldValues, N extends FieldPath<T>>({children, ...options}: RHFControlProps<T, N>) {
  const {field, fieldState} = useController(options);
  return children({name:field.name, value:field.value, onValueChange:field.onChange, onBlur:field.onBlur, inputRef:field.ref, disabled:field.disabled, error:fieldState.error?.message});
}
