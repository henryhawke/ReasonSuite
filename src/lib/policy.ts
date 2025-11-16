import { computeArgumentHash } from "./verification.js";

/**
 * Execution context for tracking policy limits
 */
export interface ExecutionContext {
    depth: number;
    maxDepth: number;
    steps: number;
    maxSteps: number;
    startTime: number;
    maxTimeMs: number;
    callStack: string[];
    visitedHashes: Set<string>;
}

/**
 * Policy violation error
 */
export class PolicyViolationError extends Error {
    constructor(
        public readonly type: "depth" | "steps" | "time" | "cycle",
        message: string
    ) {
        super(message);
        this.name = "PolicyViolationError";
    }
}

/**
 * Default policy limits
 */
export const DEFAULT_POLICY = {
    maxDepth: 10,
    maxSteps: 50,
    maxTimeMs: 120000, // 2 minutes
};

/**
 * Create a new execution context with policy limits
 */
export function createExecutionContext(
    maxDepth = DEFAULT_POLICY.maxDepth,
    maxSteps = DEFAULT_POLICY.maxSteps,
    maxTimeMs = DEFAULT_POLICY.maxTimeMs
): ExecutionContext {
    return {
        depth: 0,
        maxDepth,
        steps: 0,
        maxSteps,
        startTime: Date.now(),
        maxTimeMs,
        callStack: [],
        visitedHashes: new Set(),
    };
}

/**
 * Validate execution context against policy limits
 */
export function validateExecutionContext(ctx: ExecutionContext): void {
    const elapsed = Date.now() - ctx.startTime;

    if (ctx.depth > ctx.maxDepth) {
        throw new PolicyViolationError(
            "depth",
            `Maximum depth exceeded: ${ctx.depth} > ${ctx.maxDepth}`
        );
    }

    if (ctx.steps > ctx.maxSteps) {
        throw new PolicyViolationError(
            "steps",
            `Maximum steps exceeded: ${ctx.steps} > ${ctx.maxSteps}`
        );
    }

    if (elapsed > ctx.maxTimeMs) {
        throw new PolicyViolationError(
            "time",
            `Maximum time exceeded: ${elapsed}ms > ${ctx.maxTimeMs}ms`
        );
    }
}

/**
 * Detect cycle based on argument hash
 */
export function detectCycle(
    ctx: ExecutionContext,
    args: Record<string, any>
): boolean {
    const hash = computeArgumentHash(args);
    if (ctx.visitedHashes.has(hash)) {
        return true;
    }
    ctx.visitedHashes.add(hash);
    return false;
}

/**
 * Enter a new reasoning step
 */
export function enterStep(ctx: ExecutionContext, toolName: string): void {
    ctx.steps++;
    ctx.callStack.push(toolName);
    validateExecutionContext(ctx);
}

/**
 * Exit a reasoning step
 */
export function exitStep(ctx: ExecutionContext): void {
    ctx.callStack.pop();
}

/**
 * Enter a new depth level
 */
export function enterDepth(ctx: ExecutionContext): void {
    ctx.depth++;
    validateExecutionContext(ctx);
}

/**
 * Exit a depth level
 */
export function exitDepth(ctx: ExecutionContext): void {
    ctx.depth = Math.max(0, ctx.depth - 1);
}

/**
 * Get current policy status for diagnostics
 */
export function getPolicyStatus(ctx: ExecutionContext) {
    const elapsed = Date.now() - ctx.startTime;
    return {
        depth: {
            current: ctx.depth,
            max: ctx.maxDepth,
            percentage: (ctx.depth / ctx.maxDepth) * 100,
        },
        steps: {
            current: ctx.steps,
            max: ctx.maxSteps,
            percentage: (ctx.steps / ctx.maxSteps) * 100,
        },
        time: {
            elapsed_ms: elapsed,
            max_ms: ctx.maxTimeMs,
            percentage: (elapsed / ctx.maxTimeMs) * 100,
        },
        callStack: [...ctx.callStack],
        uniqueOperations: ctx.visitedHashes.size,
    };
}
