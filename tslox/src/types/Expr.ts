import { Token } from "./Token.ts";

export type Expr = {
    type: "Binary";
    left: Expr;
    operator: Token;
    right: Expr;
} | {
    type: "Grouping";
    expression: Expr;
} | {
    type: "Literal";
    value: boolean | null | string | number;
} | {
    type: "Unary";
    operator: Token;
    right: Expr;
};
