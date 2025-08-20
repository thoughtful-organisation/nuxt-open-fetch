# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Generate type stubs and prepare development environment
pnpm dev:prepare

# Start development with playground
pnpm dev

# Build playground for testing
pnpm dev:build

# Start docs development server
pnpm docs

# Build documentation
pnpm docs:build

# Code quality and testing
pnpm lint          # Run ESLint
pnpm lint:fix      # Run ESLint with auto-fix
pnpm typecheck     # Run TypeScript type checking
pnpm test          # Run tests (in playground directory)
pnpm test:watch    # Run tests in watch mode

# Release process
pnpm release       # Full release process (lint + test + typecheck + build + publish)
pnpm release:major # Release with major version bump
```

## Architecture Overview

This is a Nuxt module (`nuxt-open-fetch`) that generates zero-overhead, 100% typed OpenAPI clients for Nuxt applications. The module uses `openapi-typescript` to generate types at build time.

### Core Components

**Module Entry Point (`src/module.ts`)**
- Main Nuxt module definition that processes OpenAPI schemas
- Generates TypeScript types from OpenAPI schemas during build
- Creates typed composables for each configured client
- Sets up auto-imports and runtime configuration

**Runtime Files (`src/runtime/`)**
- `fetch.ts`: Core OpenAPI fetch client with type-safe request/response handling
- `useFetch.ts`: Nuxt composables that wrap the fetch client with SSR support
- `nuxt-plugin.ts`: Client-side plugin for injecting fetch clients
- `nitro-plugin.ts`: Server-side plugin for injecting fetch clients

**Client Configuration**
- Clients are configured in `nuxt.config.ts` under the `openFetch` key
- Each client requires a name and OpenAPI schema (local file or URL)
- Schemas should be placed in `openapi/{clientName}/openapi.{json,yaml,yml}`

**Type Generation Flow**
1. Module reads client configurations from layers
2. For each client, generates TypeScript types from OpenAPI schema
3. Creates composables like `useApi()` and `useLazyApi()` with full type safety
4. Injects clients into Nuxt app context (`$api`) and Vue components

### Key Features

- **Zero Runtime Overhead**: Types are generated at build time, no runtime parsing
- **Layer Support**: Works with Nuxt layers for modular API configuration
- **SSR Compatibility**: Composables work seamlessly in both client and server contexts
- **Hook System**: Supports global and client-specific fetch hooks
- **Path Parameter Handling**: Automatic replacement of `{param}` in OpenAPI paths

### Testing

Tests are located in `playground/tests/` and run using Vitest with Nuxt test environment. The playground serves as both a development environment and test suite.

### Build Process

Uses `@nuxt/module-builder` for building the module. The build process:
1. Compiles TypeScript source to JavaScript
2. Generates type definitions
3. Creates distributable module files in `dist/`
