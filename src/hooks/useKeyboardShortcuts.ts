import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onCommandK?: () => void;
  onCommandN?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onCommandK,
  onCommandN,
  onEscape,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Check if we're in an input field
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.isContentEditable;

    // Cmd/Ctrl + K - Command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onCommandK?.();
      return;
    }

    // Cmd/Ctrl + N - New lead (only when not in input)
    if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !isInputField) {
      e.preventDefault();
      onCommandN?.();
      return;
    }

    // Escape - Close modals
    if (e.key === 'Escape') {
      onEscape?.();
      return;
    }
  }, [enabled, onCommandK, onCommandN, onEscape]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
