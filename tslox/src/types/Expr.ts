import { Token } from "./Token.ts";
import { Sub } from "./utils.ts";

export type LoxVal = boolean | null | string | number;

export type Expr = {
    type: "Binary";
    left: Expr;
    operator: Sub<
        Token,
        | "SLASH"
        | "STAR"
        | "MINUS"
        | "PLUS"
        | "GREATER"
        | "GREATER_EQUAL"
        | "LESS"
        | "LESS_EQUAL"
        | "BANG_EQUAL"
        | "EQUAL_EQUAL"
    >;
    right: Expr;
} | {
    type: "Grouping";
    expression: Expr;
} | {
    type: "Literal";
    value: LoxVal;
} | {
    type: "Unary";
    operator: Sub<Token, "BANG" | "MINUS">;
    right: Expr;
};
