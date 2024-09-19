export type Sub<T extends { type: string }, S extends T["type"]> = T & {
    type: S;
};

export function visitor<T extends { type: string }, R = void>(
    funcs: {
        [K in T["type"]]: (v: Sub<T, K>) => R;
    },
) {
    return (v: T) => funcs[v.type as T["type"]](v);
}
