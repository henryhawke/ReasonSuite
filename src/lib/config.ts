/**
 * Configuration system with environment variable overrides
 */

export interface MemoryProfile {
    name: string;
    maxCandidateLength: number;
    maxCandidateCount: number;
    cacheSize: number;
    cacheTtlMs: number;
    maxPromptTokens: number;
}

const MEMORY_PROFILES: Record<string, MemoryProfile> = {
    minimal: {
        name: "minimal",
        maxCandidateLength: 2000,
        maxCandidateCount: 2,
        cacheSize: 50,
        cacheTtlMs: 1800000, // 30 minutes
        maxPromptTokens: 200,
    },
    standard: {
        name: "standard",
        maxCandidateLength: 5000,
        maxCandidateCount: 3,
        cacheSize: 100,
        cacheTtlMs: 3600000, // 1 hour
        maxPromptTokens: 300,
    },
    extended: {
        name: "extended",
        maxCandidateLength: 15000,
        maxCandidateCount: 5,
        cacheSize: 200,
        cacheTtlMs: 7200000, // 2 hours
        maxPromptTokens: 500,
    },
};

/**
 * Get configuration value with environment variable override
 */
function getEnvValue<T>(
    envVar: string,
    defaultValue: T,
    parser: (value: string) => T = (v) => v as T
): T {
    const value = process.env[envVar];
    if (value === undefined || value === "") {
        return defaultValue;
    }
    try {
        return parser(value);
    } catch {
        console.warn(`Invalid value for ${envVar}: ${value}, using default: ${defaultValue}`);
        return defaultValue;
    }
}

/**
 * Get active memory profile from environment or default
 */
export function getMemoryProfile(): MemoryProfile {
    const profileName = getEnvValue("REASONSUITE_MEMORY_PROFILE", "standard");
    const baseProfile = MEMORY_PROFILES[profileName] || MEMORY_PROFILES.standard;

    // Allow individual overrides
    return {
        ...baseProfile,
        cacheSize: getEnvValue("REASONSUITE_CACHE_SIZE", baseProfile.cacheSize, parseInt),
        cacheTtlMs: getEnvValue("REASONSUITE_CACHE_TTL", baseProfile.cacheTtlMs, parseInt),
        maxCandidateLength: getEnvValue(
            "REASONSUITE_MAX_CANDIDATE_LENGTH",
            baseProfile.maxCandidateLength,
            parseInt
        ),
        maxCandidateCount: getEnvValue(
            "REASONSUITE_MAX_CANDIDATE_COUNT",
            baseProfile.maxCandidateCount,
            parseInt
        ),
        maxPromptTokens: getEnvValue(
            "REASONSUITE_MAX_PROMPT_TOKENS",
            baseProfile.maxPromptTokens,
            parseInt
        ),
    };
}

/**
 * Check if local mode is enabled
 */
export function isLocalMode(): boolean {
    return getEnvValue<string>("REASONSUITE_LOCAL_MODE", "false") === "true";
}

/**
 * Get policy limits from environment
 */
export function getPolicyLimits() {
    return {
        maxDepth: getEnvValue("REASONSUITE_MAX_DEPTH", 10, parseInt),
        maxSteps: getEnvValue("REASONSUITE_MAX_STEPS", 50, parseInt),
        maxTimeMs: getEnvValue("REASONSUITE_MAX_TIME_MS", 120000, parseInt),
    };
}

/**
 * Get budget limits from environment
 */
export function getBudgetLimits() {
    return {
        maxTokens: getEnvValue("REASONSUITE_MAX_TOKENS", 100000, parseInt),
        maxCost: getEnvValue("REASONSUITE_MAX_COST", 1.0, parseFloat),
        solverTimeoutMs: getEnvValue("REASONSUITE_SOLVER_TIMEOUT_MS", 15000, parseInt),
    };
}

// Export singleton config
export const config = {
    memoryProfile: getMemoryProfile(),
    isLocalMode: isLocalMode(),
    policyLimits: getPolicyLimits(),
    budgetLimits: getBudgetLimits(),
};
