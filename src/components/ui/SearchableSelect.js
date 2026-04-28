"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeOption(option) {
  if (typeof option === "string") {
    return {
      value: option,
      label: option,
      searchText: option,
    };
  }

  return {
    value: String(option?.value ?? ""),
    label: String(option?.label ?? option?.value ?? ""),
    searchText: String(
      option?.searchText ?? `${option?.label ?? option?.value ?? ""}`
    ),
  };
}

export default function SearchableSelect({
  value = "",
  onChange,
  options = [],
  placeholder = "",
  emptyLabel = "",
  emptyMessage = "Khong co ket qua phu hop.",
  leadingContent = null,
  containerClassName = "",
  inputClassName = "",
  dropdownClassName = "",
  optionClassName = "",
  inputMode,
  showChevron = true,
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const normalizedOptions = useMemo(
    () => options.map(normalizeOption).filter((option) => option.label),
    [options]
  );

  const filteredOptions = useMemo(() => {
    const keyword = normalizeText(value);
    if (!keyword) {
      return normalizedOptions;
    }

    return normalizedOptions.filter((option) =>
      normalizeText(option.searchText).includes(keyword)
    );
  }, [normalizedOptions, value]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const handleSelect = (nextValue) => {
    onChange?.(String(nextValue || ""));
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={rootRef} className={`relative w-full ${containerClassName}`}>
      <div className="relative flex w-full items-center">
        {leadingContent ? (
          <div className="mr-2 shrink-0 text-slate-400">{leadingContent}</div>
        ) : null}

        <input
          ref={inputRef}
          type="text"
          value={value}
          inputMode={inputMode}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onChange?.(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          className={`w-full bg-transparent outline-none ${inputClassName}`}
        />

        {showChevron && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="ml-2 shrink-0 text-slate-500 transition hover:text-slate-700"
            aria-label="Mo danh sach lua chon"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className={`h-4 w-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute left-0 top-[calc(100%+0.4rem)] z-30 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)] ${dropdownClassName}`}
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {emptyLabel && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect("")}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 ${
                  !value.trim() ? "bg-orange-50 font-semibold text-orange-600" : ""
                } ${optionClassName}`}
              >
                {emptyLabel}
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                      isSelected
                        ? "bg-sky-50 font-semibold text-sky-700"
                        : "text-slate-700"
                    } ${optionClassName}`}
                  >
                    {option.label}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
