"use client";

import { useState } from "react";
import { formatarInputMoeda } from "@/lib/format";

export function MoneyInput({
  name,
  defaultValue,
  placeholder,
  required,
  className,
}: {
  name: string;
  defaultValue?: number | string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const [valor, setValor] = useState(
    defaultValue === undefined || defaultValue === "" ? "" : String(defaultValue)
  );

  return (
    <input
      type="number"
      step="0.01"
      name={name}
      required={required}
      placeholder={placeholder}
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={() => setValor((v) => formatarInputMoeda(v))}
      className={className}
    />
  );
}
