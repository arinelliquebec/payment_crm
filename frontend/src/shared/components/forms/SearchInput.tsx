/**
 * SearchInput Component
 * Input de busca com debounce
 */

"use client";

import { useState, useEffect } from "react";
import { Input, InputProps } from "./Input";
import { useDebounce } from "@/shared/hooks/useDebounce";

interface SearchInputProps extends Omit<InputProps, "onChange"> {
  onSearch: (value: string) => void;
  debounceMs?: number;
}

export function SearchInput({
  onSearch,
  debounceMs = 300,
  ...props
}: SearchInputProps) {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      leftIcon={
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      rightIcon={
        value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )
      }
    />
  );
}
