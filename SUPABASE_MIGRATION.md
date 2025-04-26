# Migrating to Supabase

This document provides instructions for migrating the OMERTÀ game from PostgreSQL to Supabase.

## What is Supabase?

Supabase is an open-source Firebase alternative providing all the backend services you need for your application, including:

- PostgreSQL database (with realtime capabilities)
- Authentication
- Storage
- Serverless Functions
- Realtime subscriptions

## Benefits of Migrating

- **Authentication system**: Built-in auth with security best practices
- **Realtime data**: Easier implementation of real-time features
- **Row-Level Security (RLS)**: Database-level security policies
- **Built-in APIs**: Auto-generated REST and GraphQL APIs
- **Edge Functions**: Serverless functions for game logic
- **Storage**: Built-in solution for user avatars and assets

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new Supabase project
3. Collect your Supabase API keys:
   - Project URL (from API settings)
   - Anon/Public key (from API settings)
   - Service Role key (from API settings)

## Migration Steps

### 1. Set Up Environment Variables

Create a `.env` file at the root of your project with the following variables:

```
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Client-side Supabase (must be prefixed with VITE_)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Session Secret (for cookies)
SESSION_SECRET=your-session-secret
```

### 2. Run the Migration Script

We've created a script to help switch between the original PostgreSQL implementation and the Supabase implementation:

```bash
node switch-to-supabase.js
```

To switch back to the original implementation:

```bash
node switch-to-supabase.js --original
```

### 3. Migrate Database Schema

The Supabase database is still PostgreSQL, so you can use the same Drizzle schema. The only difference is how we connect to it.

```bash
# Push your schema to Supabase
npm run db:push
```

### 4. Data Migration

If you have existing data, you'll need to migrate it to Supabase. There are several ways to do this:

1. **Direct Database Export/Import**: Export your data from your current PostgreSQL database and import it into Supabase.

2. **Migration Script**: Write a migration script that fetches data from your current database and inserts it into Supabase.

3. **Supabase CLI**: Use the Supabase CLI to generate migration scripts.

### 5. Update Auth System

The Supabase implementation includes the following changes to the auth system:

- New authentication endpoints in `server/auth-supabase.ts`
- Client-side auth hooks in `client/src/hooks/use-supabase-auth.tsx`
- Updated auth page in `client/src/pages/supabase-auth-page.tsx`

### 6. Realtime Features

The WebSocket implementation has been updated to work with Supabase in `server/websocket-supabase.ts`. This provides:

- Realtime presence for online status
- Realtime messaging
- Realtime game updates

## File Changes

The migration script modifies the following files:

- `server/index.ts` → Uses Supabase auth middleware
- `server/routes.ts` → Updated for Supabase integration
- `server/db.ts` → Connects to Supabase PostgreSQL
- `server/auth.ts` → Uses Supabase auth
- `server/storage.ts` → Modified for Supabase
- `client/src/App.tsx` → Uses Supabase auth provider
- `client/src/main.tsx` → Updated imports

## Troubleshooting

### Connection Issues

If you're having trouble connecting to Supabase:

1. Check your environment variables
2. Verify your Supabase project is active
3. Check the API settings in your Supabase dashboard

### Authentication Issues

If users can't log in:

1. Check the browser console for errors
2. Verify your Supabase auth settings
3. Make sure email confirmations are correctly configured

### Database Migration Issues

If you're having trouble with database migrations:

1. Check that your schema is compatible with Supabase
2. Verify that you have the correct permissions
3. Consider using the Supabase dashboard to manage your database directly

## Best Practices

1. **Use RLS Policies**: Define Row-Level Security policies in Supabase to control access to your data
2. **Leverage Realtime**: Use Supabase's realtime features for multiplayer functionality
3. **Client-Side Security**: Never expose your service role key in client-side code
4. **Use Storage**: Use Supabase Storage for user-uploaded content

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/installing)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)