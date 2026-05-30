"use client";

import "./button.css";

import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary";
}

export function Button({
  variant = "default",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  const variantClass = variant === "primary" ? " btn--primary" : "";
  return (
    <button
      className={`btn${variantClass} ${className}`.trim()}
      type={type}
      {...rest}
    />
  );
}
