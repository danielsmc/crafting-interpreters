import { interpret } from "../passes/interpret.ts";
import { Environment } from "./Environment.ts";
import { Return } from "./RuntimeError.ts";
import { Stmt } from "./Stmt.ts";
import { Sub } from "./utils.ts";

// This is a class so we can instanceof
export abstract class LoxCallable {
    abstract get arity(): number;
    abstract call(args: LoxVal[]): LoxVal;
}

export type LoxVal = boolean | null | string | number | LoxCallable;

export class NativeFunction<F extends (...args: LoxVal[]) => LoxVal>
    extends LoxCallable {
    constructor(private func: F) {
        super();
    }

    get arity() {
        return this.func.length;
    }

    call(args: LoxVal[]): LoxVal {
        return this.func(...args);
    }

    toString() {
        return "<native fn>";
    }
}

export class LoxFunction extends LoxCallable {
    constructor(
        private declaration: Sub<Stmt, "Function">,
        private closure: Environment,
    ) {
        super();
    }

    get arity() {
        return this.declaration.params.length;
    }

    call(args: LoxVal[]): LoxVal {
        const { params, body } = this.declaration;
        const env = new Environment(this.closure);
        for (let i = 0; i < args.length; i++) {
            env.define(params[i].lexeme, args[i]);
        }
        try {
            interpret(body, env);
        } catch (e) {
            if (e instanceof Return) return e.value;
            throw e;
        }
        return null;
    }

    toString() {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}
