export type PromptArgsShape = Record<string, unknown>;

export function definePromptArgsShape<T extends PromptArgsShape>(shape: T): T {
    return shape;
}
