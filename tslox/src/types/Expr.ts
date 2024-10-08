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
    Get: {
        object: Expr;
        name: Token;
    };
    Grouping: {
        expression: Expr;
    };
    Literal: {
        value: LoxVal;
    };
    Set: {
        object: Expr;
        name: Token;
        value: Expr;
    };
    Super: {
        keyword: Token;
        method: Token;
        distance?: number;
    };
    This: {
        keyword: Token;
        distance?: number;
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
