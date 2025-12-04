# Login Credentials

## How to Setup Database with Admin Users

If you haven't seeded the database yet, run:

```bash
npx prisma db seed
```

## Test Accounts

After seeding, you can login with these accounts:

### Super Admin
- **Email:** `admin@phc.go.th`
- **Password:** `password123`
- **Permissions:** Full system access

### Admin
- **Email:** `dept.admin@phc.go.th`
- **Password:** `password123`
- **Permissions:** Can manage users, budgets, and departments

### Approver
- **Email:** `approver@phc.go.th`
- **Password:** `password123`
- **Permissions:** Can approve budgets and expenses

### Staff
- **Email:** `staff@phc.go.th`
- **Password:** `password123`
- **Permissions:** Can create and manage own content

### Viewer
- **Email:** `viewer@phc.go.th`
- **Password:** `password123`
- **Permissions:** Read-only access

## Troubleshooting

### Can't login?

1. **Check if database is seeded:**
   ```bash
   npx prisma db seed
   ```

2. **Check if user exists:**
   ```bash
   npx prisma studio
   ```
   Then check the User table.

3. **Check if user is active:**
   Make sure the `isActive` field is `true` in the database.

4. **Reset password:**
   All seed users have the password `password123` (hashed with bcrypt).

### Database Issues?

If you need to reset the database:

```bash
# Reset database (WARNING: This will delete all data!)
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Recreate it
# 3. Run all migrations
# 4. Run the seed script
```

## Password Security

**Important:** The seed passwords (`password123`) are for development only.

In production:
1. Change all default passwords immediately
2. Use strong passwords (min 12 characters)
3. Consider implementing 2FA
4. Regularly rotate passwords

## Creating New Users

You can create new users via:
1. **UI:** Login as Admin/Super Admin → Navigate to `/dashboard/users/new`
2. **Code:** Use the `createUser` action from `src/actions/user.ts`

New users must have:
- Unique email address
- Password (min 6 characters)
- Assigned role (SUPER_ADMIN, ADMIN, APPROVER, STAFF, VIEWER)
- Assigned division
- isActive set to true
