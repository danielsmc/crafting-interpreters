// Really just for nicer type hints. The conditional seems to be necessary
export type Flatten<T> = T extends object ? { [K in keyof T]: T[K] } : T;

type AllPossibleKeys = string | number | symbol;
export type Typed<K extends AllPossibleKeys = AllPossibleKeys> = { type: K };

export type SubTypes<T extends Record<string, Record<string, unknown>>> = {
    [K in keyof T]: Flatten<
        & Typed<K>
        & {
            [J in keyof T[K]]: T[K][J];
        }
    >;
}[keyof T];

export type Sub<T extends Typed, S extends T["type"]> = T & {
    type: S;
};

export function visitor<
    T extends Typed,
    R = void,
    C extends unknown[] = [],
>(
    funcs: {
        [K in T["type"]]: (v: Sub<T, K>, ...ctx: C) => R;
    },
) {
    return (v: T, ...ctx: C) => funcs[v.type as T["type"]](v, ...ctx);
}
