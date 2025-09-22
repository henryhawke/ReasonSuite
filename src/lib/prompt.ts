import type { ZodOptional, ZodTypeAny } from "zod";

export type PromptArgsShape = Record<string, ZodTypeAny | ZodOptional<ZodTypeAny>>;

export function definePromptArgsShape<T extends PromptArgsShape>(shape: T): T {
    return shape;
}
