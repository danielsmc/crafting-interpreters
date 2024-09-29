import { LoxVal, NativeFunction } from "./LoxTypes.ts";
import { RuntimeError } from "./RuntimeError.ts";
import { Token } from "./Token.ts";

export class Environment {
    values = new Map<string, LoxVal>();
    ancestors: Environment[];

    constructor(enclosing?: Environment) {
        this.ancestors = [
            this,
            ...enclosing?.ancestors ?? [],
        ];
    }

    get globals() {
        return this.ancestors[this.ancestors.length - 1].values;
    }

    define(name: string, value: LoxVal) {
        this.values.set(name, value);
    }

    getAt(name: Token, distance?: number): LoxVal {
        const val = distance === undefined
            ? this.globals.get(name.lexeme)
            : this.ancestors[distance].values.get(name.lexeme);
        if (val === undefined) {
            throw new RuntimeError(
                `Undeclared variable '${name.lexeme}'.`,
                name,
            );
        }
        return val;
    }

    assignAt(name: Token, value: LoxVal, distance?: number): void {
        this.getAt(name, distance);
        distance === undefined
            ? this.globals.set(name.lexeme, value)
            : this.ancestors[distance].values.set(name.lexeme, value);
    }
}

export function initGlobalEnv() {
    const env = new Environment();
    env.define("clock", new NativeFunction(() => Date.now() / 1000));
    return env;
}
