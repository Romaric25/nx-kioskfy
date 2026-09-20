import * as React from "react";
import ReactPhoneInput from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "../../lib/utils";

export interface PhoneInputProps {
  /** Valeur au format international (ex: "+229 96 73 34 18"). */
  value: string;
  /** Rappelé avec la valeur au format international (ou "" quand vide). */
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  onBlur?: () => void;
  defaultCountry?: Country;
  international?: boolean;
  withCountryCallingCode?: boolean;
  className?: string;
}

/**
 * Champ téléphone avec sélecteur de pays, stylé pour le design system.
 * Basé sur `react-phone-number-input` (libphonenumber-js).
 */
export function PhoneInput({
  value,
  onChange,
  disabled,
  placeholder,
  id,
  name,
  autoComplete,
  onBlur,
  defaultCountry = "FR",
  international = true,
  withCountryCallingCode = true,
  className,
}: PhoneInputProps) {
  return (
    <ReactPhoneInput
      value={value}
      onChange={(nextValue) => onChange(nextValue ?? "")}
      disabled={disabled}
      placeholder={placeholder}
      id={id}
      name={name}
      autoComplete={autoComplete}
      onBlur={onBlur}
      defaultCountry={defaultCountry}
      international={international}
      withCountryCallingCode={withCountryCallingCode}
      countryCallingCodeEditable={false}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "has-[:focus]:ring-2 has-[:focus]:ring-ring has-[:focus]:ring-offset-2",
        className,
      )}
    />
  );
}
