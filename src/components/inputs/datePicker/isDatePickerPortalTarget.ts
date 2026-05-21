/** True when event target is inside react-multi-date-picker portal/calendar. */
export function isDatePickerPortalTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  return Boolean(
    target.closest(".rmdp-wrapper") ||
      target.closest(".rmdp-container") ||
      target.closest(".rmdp-calendar") ||
      target.closest(".rmdp-day-picker") ||
      target.closest(".rmdp-popover") ||
      target.closest(".date-picker-box")
  );
}
