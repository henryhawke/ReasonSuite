/**
 * Budget tracking and enforcement for expensive operations
 */

export interface BudgetLimits {
    maxTimeMs?: number;
    maxTokens?: number;
    maxCost?: number;
}

export interface BudgetUsage {
    timeMs: number;
    tokens?: number;
    cost?: number;
}

export class BudgetExceededError extends Error {
    constructor(
        public readonly type: "time" | "tokens" | "cost",
        public readonly usage: BudgetUsage,
        public readonly limits: BudgetLimits
    ) {
        super(`Budget exceeded: ${type}`);
        this.name = "BudgetExceededError";
    }
}

/**
 * Execute an async function with budget enforcement
 */
export async function withBudget<T>(
    fn: () => Promise<T>,
    limits: BudgetLimits,
    onProgress?: (usage: BudgetUsage) => void
): Promise<T> {
    const startTime = Date.now();
    const usage: BudgetUsage = { timeMs: 0 };

    // Set up timeout if time limit is specified
    let timeoutId: NodeJS.Timeout | null = null;
    let timeoutPromise: Promise<never> | null = null;

    if (limits.maxTimeMs) {
        timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                usage.timeMs = Date.now() - startTime;
                reject(new BudgetExceededError("time", usage, limits));
            }, limits.maxTimeMs);
        });
    }

    try {
        const result = timeoutPromise
            ? await Promise.race([fn(), timeoutPromise])
            : await fn();

        usage.timeMs = Date.now() - startTime;

        if (onProgress) {
            onProgress(usage);
        }

        return result;
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}

/**
 * Track token usage for LLM calls
 */
export class TokenBudgetTracker {
    private used = 0;

    constructor(private readonly limit: number) {}

    record(tokens: number): void {
        this.used += tokens;
        if (this.used > this.limit) {
            throw new BudgetExceededError(
                "tokens",
                { timeMs: 0, tokens: this.used },
                { maxTokens: this.limit }
            );
        }
    }

    getUsage(): number {
        return this.used;
    }

    getRemaining(): number {
        return Math.max(0, this.limit - this.used);
    }

    getPercentage(): number {
        return (this.used / this.limit) * 100;
    }
}

/**
 * Track cost budget for API calls
 */
export class CostBudgetTracker {
    private used = 0;

    constructor(private readonly limit: number) {}

    record(cost: number): void {
        this.used += cost;
        if (this.used > this.limit) {
            throw new BudgetExceededError(
                "cost",
                { timeMs: 0, cost: this.used },
                { maxCost: this.limit }
            );
        }
    }

    getUsage(): number {
        return this.used;
    }

    getRemaining(): number {
        return Math.max(0, this.limit - this.used);
    }

    getPercentage(): number {
        return (this.used / this.limit) * 100;
    }
}
