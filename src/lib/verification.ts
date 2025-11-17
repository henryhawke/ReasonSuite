import { createHash } from "crypto";

/**
 * Verification metadata for tool results
 */
export interface VerificationEnvelope {
    result: any;
    argumentHash: string;
    proofArtifacts?: ProofArtifacts;
    verifiable: boolean;
    timestamp: string;
}

/**
 * Proof artifacts for constraint solver results
 */
export interface ProofArtifacts {
    models?: Record<string, any>[];
    unsatCore?: string[];
    unitsAnalysis?: {
        learned: number;
        propagated: number;
        conflicts: number;
    };
    causalAnalysis?: {
        critical_constraints: string[];
        variable_dependencies: Record<string, string[]>;
    };
    statistics?: {
        solve_time_ms: number;
        decision_count?: number;
        propagation_count?: number;
    };
    smtScript?: string;
}

/**
 * Cache entry for solver results
 */
interface SolverCacheEntry {
    argumentHash: string;
    result: any;
    proofArtifacts?: ProofArtifacts;
    timestamp: number;
    hits: number;
}

// Simple in-memory cache with TTL
const solverCache = new Map<string, SolverCacheEntry>();
const DEFAULT_CACHE_TTL_MS = 3600000; // 1 hour

/**
 * Compute deterministic hash of input arguments
 */
export function computeArgumentHash(args: Record<string, any>): string {
    // Sort keys for deterministic hashing
    const sorted = Object.keys(args)
        .sort()
        .reduce((acc, key) => {
            acc[key] = args[key];
            return acc;
        }, {} as Record<string, any>);

    const normalized = JSON.stringify(sorted);
    return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

/**
 * Cache a solver result with proof artifacts
 */
export function cacheSolverResult(
    hash: string,
    result: any,
    proofArtifacts?: ProofArtifacts
): void {
    solverCache.set(hash, {
        argumentHash: hash,
        result,
        proofArtifacts,
        timestamp: Date.now(),
        hits: 0,
    });
}

/**
 * Retrieve cached solver result if available and not expired
 */
export function getCachedSolverResult(
    hash: string,
    ttlMs: number = DEFAULT_CACHE_TTL_MS
): SolverCacheEntry | null {
    const entry = solverCache.get(hash);
    if (!entry) {
        return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > ttlMs) {
        solverCache.delete(hash);
        return null;
    }

    // Increment hit counter
    entry.hits++;
    return entry;
}

/**
 * Clear expired cache entries
 */
export function cleanSolverCache(ttlMs: number = DEFAULT_CACHE_TTL_MS): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [hash, entry] of solverCache.entries()) {
        if (now - entry.timestamp > ttlMs) {
            solverCache.delete(hash);
            cleaned++;
        }
    }

    return cleaned;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    const entries = Array.from(solverCache.values());
    return {
        size: solverCache.size,
        totalHits: entries.reduce((sum, e) => sum + e.hits, 0),
        oldestEntry: entries.length > 0
            ? Math.min(...entries.map(e => e.timestamp))
            : null,
    };
}

/**
 * Finalize a tool result with verification metadata
 */
export function finalizeVerifiableResult(
    result: any,
    args: Record<string, any>,
    proofArtifacts?: ProofArtifacts
): VerificationEnvelope {
    const argumentHash = computeArgumentHash(args);
    const verifiable = !!proofArtifacts;

    return {
        result,
        argumentHash,
        proofArtifacts,
        verifiable,
        timestamp: new Date().toISOString(),
    };
}
