export function trimTrailingBracketSuffix(name: string): string {
    return String(name).replace(/\s*\([^()]*\)\s*$/, "").trim();
}

