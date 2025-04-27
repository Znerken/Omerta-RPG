# Supabase Migration Guide

This document provides instructions for migrating from the original PostgreSQL implementation to the new Supabase implementation for the OMERTÀ mafia game.

## Prerequisites

Before starting the migration, make sure you have:

1. A Supabase account and project set up
2. The following environment variables in your `.env` file:
   ```
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   DATABASE_URL=<your-database-url>
   ```

## Migration Steps

### 1. Run the Migration Script

The migration script will:
- Create necessary tables and columns
- Migrate existing users to Supabase Auth
- Link user accounts between the game database and Supabase Auth

```bash
node server/run_migration.js
```

### 2. Switch to Supabase Implementation

After the migration is complete, you can switch to the Supabase implementation:

```bash
node switch-to-supabase.js
```

This will:
- Backup original files
- Replace key files with their Supabase counterparts
- Update the Vite configuration to use the Supabase entry point

### 3. Start the Server

Start the server as usual:

```bash
npm run dev
```

### 4. Reverting to Original Implementation

If you need to revert to the original implementation:

```bash
node switch-to-supabase.js --original
```

## Architecture Changes

The Supabase implementation brings several improvements:

1. **Authentication**: Uses Supabase Auth with JWT for secure authentication
2. **Real-time Features**: Better support for real-time events using Supabase's built-in functionality
3. **Enhanced Security**: Proper role-based access control via Supabase's security features
4. **Scalability**: Improved scalability with Supabase's edge infrastructure

## File Structure

The Supabase implementation uses the following file structure:

- `server/auth-supabase.ts`: Authentication middleware and routes
- `server/db-supabase.ts`: Database connection and utilities
- `server/index-supabase.ts`: Server entry point
- `server/migration.ts`: Database migration script
- `server/routes-supabase.ts`: API routes
- `server/storage-supabase.ts`: Storage implementation
- `server/supabase.ts`: Supabase client and utilities
- `client/src/hooks/use-supabase-auth.tsx`: React hook for authentication
- `client/src/lib/protected-route-supabase.tsx`: Protected route component
- `client/src/App-supabase.tsx`: Main App component

## Testing

After migration, test the following functionality:

1. **Authentication**: Login, registration, and logout
2. **User Profiles**: Viewing and editing profiles
3. **Game Features**: All game features (crimes, gangs, etc.)
4. **Real-time Features**: Real-time updates and notifications
5. **Admin Features**: Admin functionality

## Troubleshooting

If you encounter issues during or after migration:

1. **Database Connection**: Ensure your database connection string is correct
2. **Supabase Configuration**: Verify Supabase project settings and API keys
3. **Missing Tables/Columns**: Run the migration script again
4. **Authentication Issues**: Check Supabase auth settings and policies
5. **Logs**: Check server logs for detailed error messages

For more help, contact the development team.