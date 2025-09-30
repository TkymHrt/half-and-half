# Suggested Commands

## Development Commands

### Starting Development Server
```bash
pnpm dev                    # Start Next.js development server with Turbopack
```
アクセス: http://localhost:3000

### Building for Production
```bash
pnpm build                  # Build production bundle with Turbopack
pnpm start                  # Start production server
```

### Code Quality & Formatting
```bash
pnpm check                  # Check code with Ultracite (Biome-based linter)
pnpm fix                    # Auto-fix issues with Ultracite
```

### Testing
```bash
pnpm test                   # Run Vitest tests
```

## Supabase Database Commands

### Local Database Management
```bash
pnpm db:start               # Start local Supabase instance
pnpm db:stop                # Stop local Supabase (no backup)
pnpm db:reset               # Reset database to migrations
pnpm db:status              # Check Supabase services status
```

### Schema & Migrations
```bash
pnpm migrate:new            # Create new migration file
pnpm migrate:list           # List all migrations
pnpm migrate:up             # Run pending migrations
pnpm db:diff -f <name>      # Generate migration from schema changes
```

### Database Operations
```bash
pnpm db:pull                # Pull remote schema to local
pnpm db:push                # Push local schema to remote
pnpm db:dump                # Dump local data to seed.sql
pnpm db:types               # Generate TypeScript types from database schema
```

## Docker Commands

### Development Container
```bash
docker compose --profile dev up      # Start development container
docker compose --profile dev down    # Stop development container
```

### Production Container
```bash
docker compose --profile prod up -d          # Start production with Cloudflare tunnel
docker compose --profile prod down           # Stop production containers
```

## Git Hooks
Git hooks are managed by Lefthook and run automatically:
- **pre-commit**: Runs `pnpm dlx ultracite fix` on staged files (*.js, *.jsx, *.ts, *.tsx, *.json, *.jsonc, *.css)

## Useful System Commands (Linux)
```bash
# Package management
pnpm install                # Install dependencies
pnpm add <package>          # Add new dependency
pnpm add -D <package>       # Add dev dependency

# File operations
ls -la                      # List files with details
find . -name "*.tsx"        # Find files by pattern
grep -r "pattern" src/      # Search in files

# Process management
ps aux | grep node          # Find Node processes
kill -9 <PID>              # Kill process by PID
```

## Environment Setup
Required environment variables (create `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=<your-anon-key>
```

For local Supabase development, these will be set automatically after `pnpm db:start`.
