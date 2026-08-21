"use client";

import { useEffect, useRef } from "react";

type HeaderSelectionCheckboxProps = {
  selectedCount: number;
  totalCount: number;
  disabled?: boolean;
  label: string;
  onChange: (selected: boolean) => void;
};

export function HeaderSelectionCheckbox({
  selectedCount,
  totalCount,
  disabled = false,
  label,
  onChange,
}: HeaderSelectionCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = selectedCount > 0 && selectedCount < totalCount;
    }
  }, [selectedCount, totalCount]);

  return (
    <label className="header-selection-control">
      <span>선택</span>
      <input
        ref={inputRef}
        type="checkbox"
        aria-label={label}
        checked={allSelected}
        disabled={disabled || totalCount === 0}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
