export type Sub<T extends { type: string }, S extends T["type"]> = T & {
    type: S;
};

export function visitor<
    T extends { type: string },
    R = void,
    C extends unknown[] = [],
>(
    funcs: {
        [K in T["type"]]: (v: Sub<T, K>, ...ctx: C) => R;
    },
) {
    return (v: T, ...ctx: C) => funcs[v.type as T["type"]](v, ...ctx);
}
