import { interpret } from "../passes/interpret.ts";
import { Environment } from "./Environment.ts";
import { Return, RuntimeError } from "./RuntimeError.ts";
import { Stmt } from "./Stmt.ts";
import { Token } from "./Token.ts";
import { Sub } from "./utils.ts";

// This is a class so we can instanceof
export abstract class LoxCallable {
    abstract get arity(): number;
    abstract call(args: LoxVal[]): LoxVal;
}

export type LoxVal =
    | boolean
    | null
    | string
    | number
    | LoxCallable
    | LoxInstance;

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
        private isInitializer = false,
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
            if (e instanceof Return) {
                return this.isInitializer
                    ? this.closure.getAt("this", 0)
                    : e.value;
            }
            throw e;
        }
        return this.isInitializer ? this.closure.getAt("this", 0) : null;
    }

    bind(instance: LoxInstance, isInitializer: boolean) {
        const env = new Environment(this.closure);
        env.define("this", instance);
        return new LoxFunction(this.declaration, env, isInitializer);
    }

    toString() {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}

export class LoxClass extends LoxCallable {
    constructor(
        public name: string,
        private methods: Map<string, LoxFunction>,
    ) {
        super();
    }

    findMethod(name: string): LoxFunction | undefined {
        return this.methods.get(name);
    }

    get arity(): number {
        return this.findMethod("init")?.arity ?? 0;
    }

    call(args: LoxVal[]): LoxInstance {
        const instance = new LoxInstance(this);
        this.findMethod("init")?.bind(instance, true).call(args);
        return instance;
    }

    toString() {
        return this.name;
    }
}

export class LoxInstance {
    fields: Map<string, LoxVal> = new Map();

    constructor(private klass: LoxClass) {}

    get(name: Token): LoxVal {
        const val = this.fields.get(name.lexeme);
        if (val !== undefined) return val;

        const method = this.klass.findMethod(name.lexeme);
        if (method !== undefined) {
            return method.bind(this, name.lexeme === "init");
        }

        throw new RuntimeError(
            `Undefined property '${name.lexeme}'.`,
            name,
        );
    }

    set(name: Token, value: LoxVal) {
        this.fields.set(name.lexeme, value);
    }

    toString() {
        return `${this.klass.name} instance`;
    }
}
