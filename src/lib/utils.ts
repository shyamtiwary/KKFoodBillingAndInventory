import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "0.00";
  return Number(amount).toFixed(2);
}

export function formatQuantity(quantity: number | undefined | null): string {
  if (quantity === undefined || quantity === null) return "0";
  // Remove trailing zeros after decimal point
  return Number(Number(quantity).toFixed(2)).toString();
}
