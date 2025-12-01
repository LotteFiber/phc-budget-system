import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in Thai Baht
export function formatCurrency(amount: number | string, locale: string = "th-TH"): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (locale === "th-TH" || locale === "th") {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

// Format date
export function formatDate(date: Date | string, locale: string = "th-TH"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

// Format date and time
export function formatDateTime(date: Date | string, locale: string = "th-TH"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

// Generate unique code
export function generateCode(prefix: string, length: number = 6): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, length);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}
