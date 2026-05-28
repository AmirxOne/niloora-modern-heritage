# Inputs Contract

This folder is the single source for form inputs.

## Import Path (required)
Use:
- `import { TextBox, TextAreaBox, SelectBox, SearchableSelectBox, DatePickerBox } from "@/components/inputs"`

Avoid direct imports from internal files in feature code.

## Styling Contract
- Base field class: `field-control`
- Current default single-line height: `h-11`
- Error class: `field-control--error`
- Shared helper classes: `fieldStyles.ts`

## Components
- `TextBox` - standard text/tel/email/password input
- `TextAreaBox` - multiline input with label/error UI parity
- `SelectBox` / `SearchableSelectBox` - custom listbox select
- `DatePickerBox` - Jalali date picker wrapper

## Notes
- `ui/Input.tsx` is compatibility-only; prefer direct `TextBox`.
- Keep labels RTL by default; use `inputClassName` for LTR content fields.
