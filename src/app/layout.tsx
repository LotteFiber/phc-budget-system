import type { ReactNode } from "react";
import "./globals.css";

type Props = {
  children: ReactNode;
};

// This is the root layout that wraps all pages
export default function RootLayout({ children }: Props) {
  return children;
}
