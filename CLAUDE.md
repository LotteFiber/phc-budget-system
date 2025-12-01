# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application for a PHC Budget System, using the App Router architecture with TypeScript and Tailwind CSS v4.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Technology Stack

- **Framework**: Next.js 16.0.6 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x with strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Geist Sans and Geist Mono (via next/font)
- **Linting**: ESLint 9 with Next.js config

## Project Structure

```
src/
├── app/                 # Next.js App Router directory
│   ├── layout.tsx      # Root layout with font configuration
│   ├── page.tsx        # Home page component
│   ├── globals.css     # Global styles with Tailwind and CSS variables
│   └── favicon.ico     # Site favicon
public/                  # Static assets
```

## Architecture Notes

### TypeScript Configuration

- Path alias `@/*` maps to `./src/*`
- Strict mode enabled
- Target: ES2017
- Module resolution: bundler (Next.js default)
- JSX: react-jsx

### Styling System

- Uses Tailwind CSS v4 with the new `@import "tailwindcss"` syntax
- CSS variables defined in `globals.css` for theming:
  - `--background` and `--foreground` with dark mode support via `prefers-color-scheme`
  - Custom theme tokens: `--color-background`, `--color-foreground`, `--font-sans`, `--font-mono`
- Font variables injected via layout: `--font-geist-sans` and `--font-geist-mono`

### App Router Patterns

- Root layout handles HTML structure, font loading, and metadata
- Uses Server Components by default (no 'use client' directives in existing code)
- Metadata API used in layout.tsx for SEO

## Development Guidelines

### File Organization

- Place new page routes in `src/app/` following App Router conventions
- Use route groups `(group-name)` for logical organization without affecting URL structure
- Server Components are default; add `'use client'` only when needed for interactivity

### Styling Conventions

- Tailwind utility classes are preferred
- Dark mode handled via `dark:` prefix (automatic via `prefers-color-scheme`)
- Reference CSS variables via Tailwind config for consistency

### TypeScript

- Always use strict typing
- Leverage Next.js types: `Metadata`, `NextConfig`, etc.
- Path imports use `@/` prefix (e.g., `import Component from '@/components/...'`)
- don't ask to run npm dev, It's usaully running already