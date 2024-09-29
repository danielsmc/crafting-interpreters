import { LoxVal } from "./LoxTypes.ts";
import { Token } from "./Token.ts";
import { Sub, SubTypes } from "./utils.ts";

export type Expr = SubTypes<{
    Assign: {
        name: Sub<Token, "IDENTIFIER">;
        value: Expr;
        distance?: number;
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
            | "AND"
            | "OR"
        >;
        right: Expr;
    };
    Call: {
        callee: Expr;
        paren: Token;
        args: Expr[];
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
        distance?: number;
    };
}>;
