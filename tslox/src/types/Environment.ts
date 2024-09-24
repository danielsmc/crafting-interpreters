import { LoxVal } from "./Expr.ts";
import { RuntimeError } from "./RuntimeError.ts";
import { Token } from "./Token.ts";

export class Environment {
    values = new Map<string, LoxVal>();

    constructor(private enclosing?: Environment) {}

    define(name: string, value: LoxVal) {
        this.values.set(name, value);
    }

    get(name: Token): LoxVal {
        const val = this.values.get(name.lexeme);
        if (val === undefined) {
            if (this.enclosing) return this.enclosing.get(name);

            throw new RuntimeError(
                `Undefined variable '${name.lexeme}'.`,
                name,
            );
        }
        return val;
    }

    assign(name: Token, value: LoxVal): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }

        if (this.enclosing) return this.enclosing.assign(name, value);

        throw new RuntimeError(
            `Undefined variable '${name.lexeme}'.`,
            name,
        );
    }
}
