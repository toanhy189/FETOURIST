"use client";

import { useRef } from "react";

function formatDateDisplay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return "";
  }

  const [year, month, day] = String(value).split("-");
  return `${day}/${month}/${year}`;
}

function openNativeDatePicker(input) {
  if (!input) {
    return;
  }

  try {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
  } catch {
    // ignore and fallback to focus/click
  }

  input.focus();
  input.click();
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.7}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 3v2.5M16 3v2.5M3.75 9.5h16.5M5.25 5.5h13.5A1.75 1.75 0 0 1 20.5 7.25v11.5a1.75 1.75 0 0 1-1.75 1.75H5.25A1.75 1.75 0 0 1 3.5 18.75V7.25A1.75 1.75 0 0 1 5.25 5.5Z"
      />
    </svg>
  );
}

export default function DatePickerField({
  value = "",
  onChange,
  name,
  placeholder = "dd/mm/yyyy",
  containerClassName = "",
  inputClassName = "",
  buttonClassName = "",
  min,
  max,
  ariaLabel = "Chọn ngày",
}) {
  const inputRef = useRef(null);
  const displayValue = formatDateDisplay(value);

  const handleOpenPicker = () => {
    openNativeDatePicker(inputRef.current);
  };

  return (
    <div
      className={`relative flex w-full items-center ${containerClassName}`}
      onClick={handleOpenPicker}
    >
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        readOnly
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpenPicker();
          }
        }}
        className={`w-full cursor-pointer bg-transparent outline-none ${inputClassName}`}
        aria-label={ariaLabel}
      />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleOpenPicker();
        }}
        className={`ml-2 shrink-0 text-slate-500 transition hover:text-slate-700 ${buttonClassName}`}
        aria-label={ariaLabel}
      >
        <CalendarIcon />
      </button>

      <input
        ref={inputRef}
        type="date"
        name={name}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange?.(event.target.value)}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
