import { loxError } from "./main.ts";
import { Environment } from "./types/Environment.ts";
import { Expr, LoxVal } from "./types/Expr.ts";
import { RuntimeError } from "./types/RuntimeError.ts";
import { Stmt } from "./types/Stmt.ts";
import { Sub, visitor } from "./types/utils.ts";

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
    Print: (s, env) => console.log(stringify(evaluate(s.expression, env))),
    Var: (s, env) => {
        const value = s.initializer ? evaluate(s.initializer, env) : null;
        env.define(s.name.lexeme, value);
    },
    Block: ({ statements }, parentEnv) => {
        const env = new Environment(parentEnv);
        for (const s of statements) {
            execute(s, env);
        }
    },
});

function evaluate(expression: Expr, env: Environment): LoxVal {
    try {
        return innerEvaluate(expression, env);
    } catch (e) {
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
        const left = evaluate(e.left, env);
        const right = evaluate(e.right, env);

        switch (e.operator.type) {
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
    Variable: (e, env) => env.get(e.name),
    Assign: (e, env) => {
        const value = evaluate(e.value, env);
        env.assign(e.name, value);
        return value;
    },
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
