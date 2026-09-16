"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { LucideIcon, MapPin } from "lucide-react";

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[32%] bg-gradient-to-br from-brand-500 to-brand-900 shadow-[0_10px_22px_rgba(18,63,166,0.35)]"
      style={{ width: size, height: size }}
    >
      <MapPin size={size * 0.46} color="#fff" strokeWidth={2.4} />
    </div>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  label?: string;
}

export function TextField({ icon: Icon, label, className, ...props }: FieldProps) {
  return (
    <label className="mb-3 block">
      {label && <span className="mb-1.5 block text-[12px] font-semibold text-gray">{label}</span>}
      <span className="flex items-center gap-2.5 rounded-[13px] border-[1.5px] border-gray-light bg-brand-50 px-3.5 py-3">
        {Icon && <Icon size={17} strokeWidth={2} className="shrink-0 text-gray" />}
        <input
          className={`w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-gray ${className ?? ""}`}
          {...props}
        />
      </span>
    </label>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  placeholder: string;
  options: string[];
}

export function SelectField({ label, placeholder, options, className, ...props }: SelectFieldProps) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-[12px] font-semibold text-gray">{label}</span>
      <select
        className={`w-full appearance-none rounded-[13px] border-[1.5px] border-gray-light bg-brand-50 px-3.5 py-3 text-[14.5px] text-ink outline-none disabled:opacity-50 ${className ?? ""}`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  variant?: "primary" | "ghost" | "outline";
}

export function Button({ icon: Icon, variant = "primary", className, children, ...props }: ButtonProps) {
  const base = "flex w-full items-center justify-center gap-2 rounded-[13px] py-3.5 text-[14.5px] font-semibold transition active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100";
  const styles = {
    primary: "bg-brand-700 text-white",
    ghost: "text-brand-700",
    outline: "border-[1.5px] border-gray-light bg-white text-ink",
  }[variant];

  return (
    <button className={`${base} ${styles} ${className ?? ""}`} {...props}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-light bg-white p-4 ${className ?? ""}`}>
      {children}
    </div>
  );
}
