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
  "aria-invalid"?: boolean;
  className?: string;
}

/**
 * Champ téléphone avec sélecteur de pays, stylé comme le composant `Input`
 * du design system (même hauteur, bordure, focus ring, état invalide...).
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
  "aria-invalid": ariaInvalid,
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
      aria-invalid={ariaInvalid}
      // `aria-invalid` est aussi posé sur le conteneur racine pour que les
      // variantes `aria-invalid:*` (bordure/ring destructives) s'appliquent.
      containerComponentProps={{ "aria-invalid": ariaInvalid }}
      className={cn(
        // Miroir des classes du composant `Input` du design system.
        "dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] md:text-sm",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "has-[:disabled]:pointer-events-none has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
      numberInputProps={{
        className: cn(
          // L'input interne doit se fondre dans le conteneur bordé.
          "h-full flex-1 min-w-0 border-0 bg-transparent p-0 outline-none",
          "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        ),
      }}
    />
  );
}
