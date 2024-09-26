import { Token } from "./Token.ts";
import { Sub, SubTypes } from "./utils.ts";

export type LoxVal = boolean | null | string | number;

export type Expr = SubTypes<{
    Assign: {
        name: Sub<Token, "IDENTIFIER">;
        value: Expr;
    };
    Binary: {
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
    };
    Grouping: {
        expression: Expr;
    };
    Literal: {
        value: LoxVal;
    };
    Unary: {
        operator: Sub<Token, "BANG" | "MINUS">;
        right: Expr;
    };
    Variable: {
        name: Sub<Token, "IDENTIFIER">;
    };
}>;
