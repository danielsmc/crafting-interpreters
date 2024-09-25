type FunctionTakingItsOwnShadow<T extends unknown[], R, F = (...a: T) => R> = (
    f: F,
) => F;
type LiteralMagic<T extends unknown[], R, F = (...a: T) => R> = (
    a: LiteralMagic<T, R>,
) => F;

const yCombinator = <T extends unknown[], R>(
    f: FunctionTakingItsOwnShadow<T, R>,
) => ((g) => g(g))((h: LiteralMagic<T, R>) => f((...x) => h(h)(...x)));

function partial<T, TS extends unknown[], R>(
    f: (a: T, ...rest: TS) => R,
    a: T,
): (...rest: TS) => R {
    return (...rest: TS) => f(a, ...rest);
}

/*
ParseLayer extracts the pattern of expression parsing functions
which each call the function for the next-higher precedence operators
and possibly themselves. Instead of each function being linked to
others by direct function calls, each ParseLayer is freestanding,
expecting to be passed the higher-precedence function and itself.
A bunch of layers can then be composed with stack(), and layers can
be added, removed, or reordered quickly.

Is all of this worth it? Would it be easier to just define some
parser combinators? Maybe.
*/

export type ParseLayer<T, F = () => T> = (
    precedent: F,
    self: F,
) => F;

export function stack<T>(base: () => T, ...funcs: ParseLayer<T>[]): () => T {
    if (funcs.length === 0) return base;
    return stack(yCombinator(partial(funcs[0], base)), ...funcs.slice(1));
}
