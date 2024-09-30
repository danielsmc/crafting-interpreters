import { loxError } from "../run.ts";
import { Environment } from "../types/Environment.ts";
import { Expr } from "../types/Expr.ts";
import {
    LoxCallable,
    LoxClass,
    LoxFunction,
    LoxInstance,
    LoxVal,
} from "../types/LoxTypes.ts";
import { Return, RuntimeError } from "../types/RuntimeError.ts";
import { Stmt } from "../types/Stmt.ts";
import { Sub, visitor } from "../types/utils.ts";

export function interpret(statements: Stmt[], env: Environment) {
    try {
        for (const s of statements) {
            execute(s, env);
        }
    } catch (e) {
        if (e instanceof RuntimeError) {
            loxError(e.token, e.message);
        } else {
            throw e;
        }
    }
}

function stringify(v: LoxVal) {
    if (v === null) return "nil";
    return v.toString();
}

const execute = visitor<Stmt, void, [Environment]>({
    Expression: (s, env) => evaluate(s.expression, env),
    Function: (s, env) => env.define(s.name.lexeme, new LoxFunction(s, env)),
    If: (s, env) => {
        if (isTruthy(evaluate(s.condition, env))) {
            execute(s.thenBranch, env);
        } else if (s.elseBranch) {
            execute(s.elseBranch, env);
        }
    },
    Print: (s, env) => console.log(stringify(evaluate(s.expression, env))),
    Return: (s, env) => {
        throw new Return(s.value ? evaluate(s.value, env) : null);
    },
    Var: (s, env) => {
        const value = s.initializer ? evaluate(s.initializer, env) : null;
        env.define(s.name.lexeme, value);
    },
    While: (s, env) => {
        while (isTruthy(evaluate(s.condition, env))) {
            execute(s.body, env);
        }
    },
    Block: ({ statements }, parentEnv) => {
        const env = new Environment(parentEnv);
        for (const s of statements) {
            execute(s, env);
        }
    },
    Class: (s, env) => {
        env.define(s.name.lexeme, null);
        const methods: Map<string, LoxFunction> = new Map();
        s.methods.forEach((m) =>
            methods.set(m.name.lexeme, new LoxFunction(m, env))
        );
        const klass = new LoxClass(s.name.lexeme, methods);
        env.assignAt(s.name, klass, 0);
    },
});

function evaluate(expression: Expr, env: Environment): LoxVal {
    try {
        return innerEvaluate(expression, env);
    } catch (e) {
        if (e instanceof Return) throw e;
        const message = (e instanceof Error) ? e.message : "Unknown error";
        if (e instanceof RuntimeError) throw e;
        throw new RuntimeError(
            message,
            (expression as Sub<Expr, "Binary">).operator,
        );
    }
}

const innerEvaluate = visitor<Expr, LoxVal, [Environment]>({
    "Literal": (e) => e.value,
    "Grouping": (e, env) => evaluate(e.expression, env),
    "Unary": (e, env) => {
        const right = evaluate(e.right, env);

        switch (e.operator.type) {
            case "BANG":
                return !isTruthy(right);
            case "MINUS":
                return -castNum(right);
        }
    },
    "Binary": (e, env) => {
        const { type } = e.operator;
        const left = evaluate(e.left, env);

        if (type === "OR") {
            return isTruthy(left) ? left : evaluate(e.right, env);
        } else if (type === "AND") {
            return isTruthy(left) ? evaluate(e.right, env) : left;
        }

        const right = evaluate(e.right, env);

        switch (type) {
            case "GREATER":
                return castNum(left) > castNum(right);
            case "GREATER_EQUAL":
                return castNum(left) >= castNum(right);
            case "LESS":
                return castNum(left) < castNum(right);
            case "LESS_EQUAL":
                return castNum(left) <= castNum(right);
            case "BANG_EQUAL":
                return !isEqual(left, right);
            case "EQUAL_EQUAL":
                return isEqual(left, right);
            case "MINUS":
                return castNum(left) - castNum(right);
            case "SLASH":
                return castNum(left) / castNum(right);
            case "STAR":
                return castNum(left) * castNum(right);
            case "PLUS":
                if (typeof left === "number" && typeof right === "number") {
                    return left + right;
                }
                if (typeof left === "string" && typeof right === "string") {
                    return left + right;
                }
                throw new Error("Incompatible operands");
        }
    },
    Variable: (e, env) => env.getAt(e.name.lexeme, e.distance),
    Assign: (e, env) => {
        const value = evaluate(e.value, env);
        env.assignAt(e.name, value, e.distance);
        return value;
    },
    Call: (e, env) => {
        const callee = evaluate(e.callee, env);
        const args = e.args.map((a) => evaluate(a, env));
        if (!(callee instanceof LoxCallable)) {
            throw new RuntimeError("Tried to call a non-callable", e.paren);
        }
        if (args.length !== callee.arity) {
            throw new RuntimeError(
                `Expected ${callee.arity} arguments but got ${args.length}.`,
                e.paren,
            );
        }
        return callee.call(args);
    },
    Get: (e, env) => {
        const object = evaluate(e.object, env);
        if (object instanceof LoxInstance) {
            return object.get(e.name);
        }
        throw new RuntimeError("Only instances have properties.", e.name);
    },
    Set: (e, env) => {
        const object = evaluate(e.object, env);
        if (!(object instanceof LoxInstance)) {
            throw new RuntimeError("Only instances have fields.", e.name);
        }
        const value = evaluate(e.value, env);
        object.set(e.name, value);
        return value;
    },
    This: (e, env) => env.getAt(e.keyword.lexeme, e.distance),
});

function isTruthy(v: LoxVal): boolean {
    return !(v === null || v === false);
}

function isEqual(a: LoxVal, b: LoxVal): boolean {
    if (a === null && b === null) return true;
    return a === b;
}

function castNum(v: LoxVal): number {
    if (typeof v === "number") {
        return v;
    } else throw new Error("Non-number operand");
}
