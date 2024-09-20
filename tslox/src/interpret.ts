import { loxError } from "./main.ts";
import { Expr, LoxVal } from "./types/Expr.ts";
import { RuntimeError } from "./types/RuntimeError.ts";
import { Sub, visitor } from "./types/utils.ts";

export function interpret(e: Expr) {
    try {
        const value = evaluate(e);
        console.log(value);
    } catch (e) {
        if (e instanceof RuntimeError) {
            loxError(e.token, e.message);
        } else {
            throw e;
        }
    }
}

function evaluate(expression: Expr): LoxVal {
    try {
        return innerEvaluate(expression);
    } catch (e) {
        const message = (e instanceof Error) ? e.message : "Unknown error";
        throw new RuntimeError(
            message,
            (expression as Sub<Expr, "Binary">).operator,
        );
    }
}

const innerEvaluate = visitor<Expr, LoxVal>({
    "Literal": (e) => e.value,
    "Grouping": (e) => evaluate(e.expression),
    "Unary": (e) => {
        const right = evaluate(e.right);

        switch (e.operator.type) {
            case "BANG":
                return !isTruthy(right);
            case "MINUS":
                return -castNum(right);
        }
    },
    "Binary": (e) => {
        const left = evaluate(e.left);
        const right = evaluate(e.right);

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
