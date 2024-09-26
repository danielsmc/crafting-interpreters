import { Environment } from "./Environment.ts";

// This is a class so we can instanceof
export abstract class LoxCallable {
    abstract get arity(): number;
    abstract call(env: Environment, args: LoxVal[]): LoxVal;
}

export type LoxVal = boolean | null | string | number | LoxCallable;
