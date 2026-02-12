# PHC Budget System

![Next.js](https://img.shields.io/badge/Next.js-16.0.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-[Your_License]-green?style=flat-square)

A comprehensive budget management and expense tracking application for the **Ministry of Public Health - Primary Health Care Division** (Thailand).

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Test Accounts](#test-accounts)
- [Project Structure](#project-structure)
- [User Roles & Permissions](#user-roles--permissions)
- [Database Schema](#database-schema)
- [Localization](#localization)
- [Screenshots](#screenshots)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Support](#support)

## Overview

The PHC Budget System is an enterprise-grade financial management platform designed for Thai government healthcare administrators to efficiently manage budgets across organizational divisions, track expenses, implement multi-level approval workflows, and generate comprehensive financial analytics.

**Target Users**: Government finance teams, division managers, budget approvers, project staff, and executives within the Ministry of Public Health's Primary Health Care Division.

**Key Capabilities**:
- Fiscal year-based budget allocation with three-tier hierarchy (Plan → Output → Activity)
- Real-time expense tracking against budgets and allocations
- Multi-level approval workflows with timeline metrics
- Comprehensive reporting and data visualization
- Role-based access control with five permission levels
- Full Thai and English language support

## Features

### Budget Management
- **Fiscal Year Budgeting**: Buddhist calendar support (2543-2643)
- **Three-Tier Hierarchy**: แผนงาน (Plan) → ผลผลิต/โครงการ (Output) → กิจกรรม (Activity)
- **Budget Allocations**: Create sub-projects from parent budgets
- **Real-time Tracking**: Automatic calculation of spent vs. remaining funds
- **Custom Categories**: Operating, Subsidy, and Investment budget types

### Expense Tracking
- **Multi-Status Workflow**: Draft → Pending Approval → Approved → Paid
- **Document Attachments**: Support for expense documentation
- **Budget Validation**: Automatic verification against available funds
- **Category-Based**: Organized by hierarchical expense categories
- **Audit Trail**: Complete change history logging

### Approval System
- **Multi-Level Approvals**: Three-level approval hierarchy
- **Separate Workflows**: Independent approval types for budgets and expenses
- **Comment Support**: English and Thai language comments
- **Timeline Analytics**: Track average approval duration by level
- **Status Tracking**: Pending, Approved, Rejected states

### Reporting & Analytics
- **Budget Summary Reports**: Allocation vs. spending analysis
- **Expense Reports**: Category and department breakdowns
- **Department Analysis**: Utilization rates and efficiency metrics
- **Approval Timelines**: Processing duration trends
- **Data Visualization**: Interactive charts using Recharts

### Access Control
- **Role-Based Permissions**: Five distinct user roles
- **Division Segregation**: Data access based on organizational units
- **Activity Logging**: Comprehensive audit trails
- **Secure Authentication**: NextAuth with bcrypt password hashing

### Internationalization
- **Bilingual Support**: Full English and Thai localization
- **Thai Government Compliance**: Buddhist calendar, Thai Baht (THB) formatting
- **Dynamic Locale Switching**: User-selectable language preferences

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.6 (App Router architecture)
- **UI Library**: React 19.2.0
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS v4 with PostCSS
- **Components**: Radix UI (dialogs, dropdowns, tables, forms)
- **Icons**: Lucide React 0.555.0
- **Fonts**: Geist Sans & Geist Mono (via next/font)

### Backend
- **API**: Next.js Server Actions
- **ORM**: Prisma 7.0.1
- **Database**: PostgreSQL (with @prisma/adapter-pg)
- **Authentication**: NextAuth 5.0.0-beta.30
- **Password Hashing**: bcryptjs 3.0.3

### Forms & Validation
- **Form Management**: React Hook Form 7.67.0
- **Schema Validation**: Zod 4.1.13
- **Resolvers**: @hookform/resolvers 5.2.2

### Data & Visualization
- **Charts**: Recharts 3.5.1
- **Tables**: TanStack React Table 8.21.3
- **Date Utilities**: date-fns 4.1.0

### Internationalization
- **i18n**: next-intl 4.5.6

### Utilities
- **Notifications**: sonner 2.0.7 (toast notifications)
- **Class Management**: clsx 2.1.1, tailwind-merge 3.4.0
- **Component Variants**: class-variance-authority 0.7.1

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
  ```bash
  node --version
  ```
- **PostgreSQL**: Version 14.0 or higher
  - **macOS**: `brew install postgresql@14`
  - **Ubuntu**: `sudo apt-get install postgresql-14`
  - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Package Manager**: npm (comes with Node.js) or yarn
- **Git**: For version control

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd phc-budget-system
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages from `package.json`.

### Step 3: Environment Setup

Create a `.env` file in the root directory:

```bash
# Copy from the example below
touch .env
```

Add the following environment variables (see [Environment Variables](#environment-variables) section for details):

```env
DATABASE_URL="postgresql://username:password@localhost:5432/phc-budget"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### Step 4: Database Setup

```bash
# Run Prisma migrations to create database schema
npm run db:migrate

# Seed the database with test data
npm run db:seed
```

The seed script creates:
- 5 test user accounts (one for each role)
- Sample divisions (Thai organizational units)
- Budget categories
- Plans, Outputs, and Activities
- Sample budgets and expenses

### Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the login page. Use any of the [test accounts](#test-accounts) to sign in.

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `npm run dev` | Start development server on http://localhost:3000 |
| **build** | `npm run build` | Build optimized production bundle |
| **start** | `npm start` | Start production server (run `build` first) |
| **lint** | `npm run lint` | Run ESLint to check code quality |
| **db:migrate** | `npm run db:migrate` | Run Prisma migrations to update database schema |
| **db:seed** | `npm run db:seed` | Seed database with test data |
| **db:reset** | `npm run db:reset` | **WARNING**: Delete all data, reset schema, and re-seed |

### Additional Prisma Commands

```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# Generate Prisma Client (auto-runs after migration)
npx prisma generate

# View migration status
npx prisma migrate status

# Create a new migration
npx prisma migrate dev --name your_migration_name
```

## Environment Variables

Create a `.env` file in the project root with these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| **DATABASE_URL** | PostgreSQL connection string | `postgresql://user:password@localhost:5432/phc-budget` |
| **NEXTAUTH_URL** | Base URL for NextAuth (must match deployment URL) | `http://localhost:3000` |
| **NEXTAUTH_SECRET** | Secret key for NextAuth session encryption (min 32 chars) | Generate with: `openssl rand -base64 32` |
| **NEXT_PUBLIC_APP_URL** | Public application URL (accessible client-side) | `http://localhost:3000` |
| **NODE_ENV** | Environment mode | `development` or `production` |

### Optional File Upload Variables

If you plan to implement file uploads for expense documents:

```env
# Cloudinary
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

# AWS S3
AWS_S3_BUCKET="your-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-southeast-1"
```

## Test Accounts

After running `npm run db:seed`, you can log in with these test accounts:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Super Admin** | admin@phc.go.th | password123 | Full system access, all administrative functions |
| **Admin** | dept.admin@phc.go.th | password123 | Administrative functions, user management |
| **Approver** | approver@phc.go.th | password123 | Approve/reject budgets and expenses (all levels) |
| **Staff** | staff@phc.go.th | password123 | Create and view own division's budgets/expenses |
| **Viewer** | viewer@phc.go.th | password123 | Read-only access to assigned divisions |

**Security Note**: Change these default passwords before deploying to production!

For more authentication details, see [LOGIN_CREDENTIALS.md](./LOGIN_CREDENTIALS.md).

## Project Structure

```
phc-budget-system/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # Database migration files
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── [locale]/          # Locale-based routing (en, th)
│   │   │   ├── (auth)/        # Authentication routes
│   │   │   │   └── login/     # Login page
│   │   │   └── (dashboard)/   # Protected dashboard routes
│   │   │       └── dashboard/
│   │   │           ├── budgets/             # Budget management
│   │   │           ├── budget-allocations/  # Project allocations
│   │   │           ├── projects/            # Expense tracking
│   │   │           ├── divisions/           # Division management
│   │   │           ├── users/               # User management
│   │   │           └── page.tsx             # Dashboard home
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/  # NextAuth API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── actions/               # Server actions
│   │   ├── budget.ts          # Budget CRUD operations
│   │   ├── budget-allocation.ts
│   │   ├── expense.ts
│   │   ├── approval.ts
│   │   ├── user.ts
│   │   ├── division.ts
│   │   ├── report.ts
│   │   └── helpers.ts
│   ├── components/            # React components
│   │   ├── approvals/        # Approval workflow UI
│   │   ├── budget-allocations/
│   │   ├── budgets/
│   │   ├── charts/           # Recharts visualizations
│   │   ├── divisions/
│   │   ├── expenses/
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Header, sidebar, navigation
│   │   ├── projects/
│   │   ├── providers/        # Context providers
│   │   ├── ui/               # Reusable UI components (Radix)
│   │   └── users/
│   ├── lib/                  # Utilities
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── db.ts            # Prisma client singleton
│   │   └── utils.ts         # Helper functions
│   ├── messages/            # Internationalization
│   │   ├── en.json          # English translations
│   │   └── th.json          # Thai translations
│   ├── types/               # TypeScript type definitions
│   ├── i18n.ts              # i18n configuration
│   └── middleware.ts        # Next.js middleware (auth, locale)
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── postcss.config.mjs        # PostCSS configuration
├── next.config.ts            # Next.js configuration
├── CLAUDE.md                 # Development guidelines for AI assistance
├── LOGIN_CREDENTIALS.md      # Authentication documentation
└── README.md                 # This file
```

## User Roles & Permissions

The system implements role-based access control (RBAC) with five distinct permission levels:

| Role | Code | Description | Permissions |
|------|------|-------------|-------------|
| **Super Admin** | `SUPER_ADMIN` | Full system access | All operations, system configuration, user management across all divisions |
| **Admin** | `ADMIN` | Administrative functions | User management, division management, view all data within assigned divisions |
| **Approver** | `APPROVER` | Budget/expense approval | Approve/reject budgets and expenses at assigned approval levels (1-3) |
| **Staff** | `STAFF` | Standard user | Create budgets, allocations, expenses; view own division's data |
| **Viewer** | `VIEWER` | Read-only access | View budgets, expenses, and reports for assigned divisions only |

### Permission Matrix

| Action | Super Admin | Admin | Approver | Staff | Viewer |
|--------|:-----------:|:-----:|:--------:|:-----:|:------:|
| Create Budgets | ✅ | ✅ | ❌ | ✅ | ❌ |
| Edit Budgets | ✅ | ✅ | ❌ | ✅ (own) | ❌ |
| Delete Budgets | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Budgets | ✅ | ❌ | ✅ | ❌ | ❌ |
| Create Expenses | ✅ | ✅ | ❌ | ✅ | ❌ |
| Approve Expenses | ✅ | ❌ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Divisions | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ |

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

### Core Models

- **User**: System users with authentication credentials and role assignments
- **Division**: Organizational units (Thai names: กองสุขศึกษา, กองทันตสาธารณสุข, etc.)
- **Budget**: Main budget records tied to fiscal years and divisions
- **BudgetAllocation**: Sub-projects created from parent budgets
- **Expense**: Individual spending records with approval workflows
- **ExpenseDocument**: File attachments for expense documentation

### Hierarchical Planning Models

- **Plan** (แผนงาน): Strategic plans
- **Output** (ผลผลิต/โครงการ): Project outputs under plans
- **Activity** (กิจกรรม): Activities under outputs
- **BudgetCategory**: Hierarchical expense categories (parent-child relationships)

### Workflow Models

- **Approval**: Multi-level approval records (levels 1-3)
- **Notification**: User notification system
- **AuditLog**: Complete change history tracking

### Database Management

```bash
# View and edit database via Prisma Studio GUI
npx prisma studio

# Access via terminal
psql -U username -d phc-budget

# Backup database
pg_dump -U username phc-budget > backup.sql

# Restore database
psql -U username -d phc-budget < backup.sql
```

**Schema Features**:
- Composite indexes on frequently queried fields (divisionId, fiscalYear, status)
- Unique constraints on budget/division codes
- Cascade delete for expense documents
- Soft-delete patterns via status fields
- Full-text search support (future enhancement)

## Localization

The system supports bilingual operation for Thai government compliance:

### Supported Languages

- **English (en)**: Default language
- **Thai (th)**: Full Thai language support with Buddhist calendar

### Configuration

- **Config File**: `src/i18n.ts`
- **Message Files**:
  - `src/messages/en.json` (English translations)
  - `src/messages/th.json` (Thai translations)
- **Default Locale**: English (`en`)
- **Locale Detection**: URL-based via `[locale]` segment

### Usage

**URL Format**:
```
http://localhost:3000/en/dashboard  (English)
http://localhost:3000/th/dashboard  (Thai)
```

**Switching Languages**:
Users can switch languages via the language selector in the application header.

### Adding New Translations

1. Edit `src/messages/en.json` and `src/messages/th.json`
2. Add new keys following the existing structure:
   ```json
   {
     "common": {
       "save": "Save",
       "cancel": "Cancel"
     }
   }
   ```
3. Use in components with `useTranslations()`:
   ```tsx
   const t = useTranslations('common');
   return <button>{t('save')}</button>;
   ```

## Screenshots

### Dashboard Overview
[Add screenshot here]

The main dashboard displays four comprehensive reports:
- Budget Summary Report
- Expense Summary Report
- Department Analysis Report
- Approval Timeline Report

### Budget Management
[Add screenshot here]

Create and manage budgets with three-tier hierarchy (Plan → Output → Activity).

### Expense Tracking
[Add screenshot here]

Track expenses against budgets with document upload support.

### Approval Workflow
[Add screenshot here]

Multi-level approval system with comment support.

## Deployment

### Vercel (Recommended)

The easiest deployment option for Next.js applications:

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Import to Vercel**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Configure environment variables (see below)

3. **Environment Variables**:
   Add these in Vercel dashboard → Settings → Environment Variables:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   NODE_ENV=production
   ```

4. **Database Options**:
   - **Vercel Postgres**: Built-in PostgreSQL database
   - **Supabase**: Free tier available
   - **Railway**: PostgreSQL hosting
   - **Amazon RDS**: Production-grade option

5. **Deploy**:
   Click "Deploy" - Vercel will automatically build and deploy your application.

### Docker (Future Implementation)

Docker configuration is not yet implemented. To add Docker support:

1. Create `Dockerfile`:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   CMD ["npm", "start"]
   ```

2. Create `docker-compose.yml`:
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://postgres:password@db:5432/phc-budget
     db:
       image: postgres:14
       environment:
         - POSTGRES_DB=phc-budget
         - POSTGRES_PASSWORD=password
   ```

### Manual Deployment

For traditional hosting (VPS, EC2, etc.):

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set environment variables** on your server

3. **Start the production server**:
   ```bash
   npm start
   ```

4. **Process Manager** (recommended):
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start npm --name "phc-budget" -- start
   pm2 save
   pm2 startup
   ```

5. **Nginx Reverse Proxy** (optional):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Troubleshooting

### Database Connection Errors

**Problem**: `Error: Can't reach database server`

**Solutions**:
1. Verify PostgreSQL is running:
   ```bash
   # macOS
   brew services list

   # Ubuntu
   sudo systemctl status postgresql
   ```

2. Check `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/phc-budget"
   ```

3. Test connection:
   ```bash
   psql -U username -d phc-budget
   ```

4. Create database if missing:
   ```bash
   createdb phc-budget
   ```

### Authentication Issues

**Problem**: `[next-auth][error][SIGNIN_EMAIL_ERROR]`

**Solutions**:
1. Verify `NEXTAUTH_SECRET` is set (min 32 characters)
2. Ensure `NEXTAUTH_URL` matches your deployment URL
3. Clear browser cookies and try again
4. Check user exists in database:
   ```bash
   npx prisma studio
   # Navigate to User table
   ```

### Migration Failures

**Problem**: `Migration failed to apply`

**Solutions**:
1. Check Prisma schema syntax:
   ```bash
   npx prisma validate
   ```

2. Reset database (WARNING: deletes all data):
   ```bash
   npm run db:reset
   ```

3. Manual migration:
   ```bash
   npx prisma migrate dev --create-only
   # Edit migration file if needed
   npx prisma migrate dev
   ```

### Seed Script Errors

**Problem**: `Error: Seed script failed`

**Solutions**:
1. Ensure migrations are applied first:
   ```bash
   npm run db:migrate
   ```

2. Run seed script with verbose output:
   ```bash
   npx tsx prisma/seed.ts
   ```

3. Check for unique constraint violations (if re-seeding)

### Port Already in Use

**Problem**: `Error: Port 3000 is already in use`

**Solutions**:
1. Find and kill the process:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. Use a different port:
   ```bash
   PORT=3001 npm run dev
   ```

### Additional Help

For more troubleshooting information:
- Review [LOGIN_CREDENTIALS.md](./LOGIN_CREDENTIALS.md) for authentication details
- Check [CLAUDE.md](./CLAUDE.md) for development guidelines
- Consult the [Next.js documentation](https://nextjs.org/docs)
- Review [Prisma documentation](https://www.prisma.io/docs)

## Contributing

We welcome contributions from team members! Please follow these guidelines:

### Getting Started

1. **Fork the repository** (for external contributors):
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/your-username/phc-budget-system.git
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Make your changes** following the development standards below

4. **Commit your changes**:
   ```bash
   git commit -m "Add some AmazingFeature"
   ```

5. **Push to your branch**:
   ```bash
   git push origin feature/AmazingFeature
   ```

6. **Open a Pull Request** on GitHub

### Development Standards

**TypeScript**:
- Use strict mode (enforced in `tsconfig.json`)
- Define proper types for all functions and components
- Avoid `any` types - use specific types or `unknown`
- Use path aliases (`@/`) for imports

**Styling**:
- Use Tailwind CSS utility classes
- Follow existing component patterns
- Maintain responsive design (mobile-first)
- Use CSS variables for theming

**File Organization**:
- Place components in appropriate directories (`src/components/`)
- Server actions go in `src/actions/`
- Follow App Router conventions for pages
- Use route groups `(group-name)` for logical organization

**Code Quality**:
- Run `npm run lint` before committing
- Write meaningful commit messages
- Keep functions small and focused
- Add comments for complex logic only
- Follow existing code patterns

**Database Changes**:
- Create migrations for schema changes:
  ```bash
  npx prisma migrate dev --name descriptive_name
  ```
- Update seed script if needed
- Test migrations on a separate database first

**Testing** (when implemented):
- Write tests for new features
- Ensure existing tests pass
- Test with all user roles
- Test in both English and Thai locales

### Pull Request Guidelines

- Provide a clear description of changes
- Reference related issues (`Fixes #123`)
- Include screenshots for UI changes
- Ensure CI checks pass (when implemented)
- Request review from team members

## License

[Specify your license here - e.g., MIT License, Apache 2.0, or Proprietary]

For proprietary/government projects:
```
Copyright (c) 2025 Ministry of Public Health - Primary Health Care Division
All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution,
or modification of this software is strictly prohibited.
```

## Acknowledgments

This project is built with excellent open-source technologies:

- **[Next.js](https://nextjs.org/)** - The React Framework for Production
- **[React](https://react.dev/)** - A JavaScript library for building user interfaces
- **[Tailwind CSS](https://tailwindcss.com/)** - A utility-first CSS framework
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM for Node.js and TypeScript
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication for Next.js
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible UI components
- **[Recharts](https://recharts.org/)** - Composable charting library for React
- **[Lucide](https://lucide.dev/)** - Beautiful & consistent icon toolkit
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[React Hook Form](https://react-hook-form.com/)** - Performant, flexible forms

Special thanks to the open-source community for these amazing tools.

## Support

### Documentation

- **Development Guidelines**: See [CLAUDE.md](./CLAUDE.md)
- **Authentication Help**: See [LOGIN_CREDENTIALS.md](./LOGIN_CREDENTIALS.md)
- **Troubleshooting**: See [Troubleshooting](#troubleshooting) section above

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Getting Help

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review existing documentation
3. Contact the development team
4. Create an issue (for bugs or feature requests)

---

**Built with ❤️ for the Ministry of Public Health - Primary Health Care Division**
