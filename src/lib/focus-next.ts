import type { KeyboardEvent } from "react";

/**
 * Move focus to the next focusable form field inside the container when Enter is pressed.
 * - Shift+Enter still keeps normal textarea new-line behavior
 * - Select triggers move forward when closed, and after choosing an open option with Enter
 * - Acts on inputs, textareas, and Select combobox triggers
 */
export function handleEnterFocusNext(e: KeyboardEvent<HTMLElement>) {
  if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
  const target = e.target as HTMLElement;
  const isInput =
    target instanceof HTMLInputElement && target.type !== "submit" && target.type !== "button";
  const isTextArea = target instanceof HTMLTextAreaElement;
  const isCombobox = target.getAttribute("role") === "combobox";
  if (!isInput && !isTextArea && !isCombobox) return;
  const container = e.currentTarget;
  const selectIsOpen = isCombobox && target.getAttribute("aria-expanded") === "true";

  if (selectIsOpen) {
    requestAnimationFrame(() => requestAnimationFrame(() => focusNext(container, target)));
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  focusNext(container, target);
}

function focusNext(container: HTMLElement, target: HTMLElement) {
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]), textarea, [role="combobox"]',
    ),
  ).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      !el.getAttribute("aria-disabled") &&
      !(el instanceof HTMLInputElement && el.readOnly) &&
      el.tabIndex !== -1 &&
      (el as HTMLElement).offsetParent !== null,
  );
  const idx = focusables.indexOf(target);
  if (idx === -1) return;
  const next = focusables[idx + 1];
  if (next) {
    next.focus();
    if (next instanceof HTMLInputElement && next.type !== "date") {
      try {
        next.select();
      } catch {
        /* noop */
      }
    }
  }
}
