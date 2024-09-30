import { LoxVal, NativeFunction } from "./LoxTypes.ts";
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

    getAt(name: string, distance?: number): LoxVal {
        const val = distance === undefined
            ? this.globals.get(name)
            : this.ancestors[distance].values.get(name);
        return val!; // Resolution ~should~ ensure that the value will always be there
    }

    assignAt(name: Token, value: LoxVal, distance?: number): void {
        this.getAt(name.lexeme, distance);
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
