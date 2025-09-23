# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReasonSuite is a Model Context Protocol (MCP) server that provides structured reasoning tools including dialectic analysis, Socratic questioning, abductive reasoning, systems thinking, red/blue team challenges, analogical mapping, and Z3-powered constraint solving. The project is built in TypeScript and uses the MCP SDK.

## Commands

### Build and Development

- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run dev` - Run the server from compiled output
- `npm start` - Run the server from compiled output
- `node dist/smoke.js` - Run offline smoke tests (requires build first)

### Testing

The project uses an offline smoke test system rather than traditional unit tests. After building, run the smoke tests to verify all tools work correctly without requiring an LLM backend.

### Running the Server

- Default (stdio): `npm start`
- HTTP transport: `MCP_TRANSPORT=http PORT=3333 npm start`

## Architecture

### Core Structure

- **Server Entry Point**: `src/index.ts` - Registers all tools, prompts, and resources
- **Tool Registration**: Each reasoning tool is in `src/tools/` with corresponding prompts in `src/prompts/`
- **Router System**: `src/router/router.ts` - Planning router that selects reasoning sequences
- **Constraint DSL**: `src/lib/dsl.ts` - JSON-to-Z3 constraint validation and parsing
- **Resources**: `src/resources/` - Markdown reference docs served via MCP

### Tool Categories

1. **Router**: `reasoning.router.plan` - Plans sequences of reasoning modes
2. **Core Reasoning**: dialectic, socratic, abductive, systems, redblue, analogical
3. **Validation**: razors.apply - Applies Occam/MDL, Bayesian, Sagan, Hitchens, Hanlon, Popper tests
4. **Constraint Solving**: Uses Z3 SMT solver for optimization problems
5. **Additional Tools**: scientific, self_explain, divergent, exec

### Key Dependencies

- `@modelcontextprotocol/sdk` - MCP server framework
- `z3-solver` - SMT constraint solving
- `zod` - Runtime schema validation
- `yaml` - YAML parsing support

### Code Conventions

- ES2022 modules with .js imports (required for MCP SDK compatibility)
- Strict TypeScript configuration
- Tool registration pattern: each tool exports a `register*` function
- JSON-only tool responses for downstream automation
- Zod schemas for input validation

### Transport Modes

The server supports both stdio (default) and HTTP transports via the `MCP_TRANSPORT` environment variable. HTTP mode is useful for development and debugging.

### Resource System

Reference documents are automatically served as `doc://` URIs including reasoning razors, systems thinking cheatsheet, and constraint DSL documentation.
