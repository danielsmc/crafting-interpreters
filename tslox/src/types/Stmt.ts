import { Expr } from "./Expr.ts";
import { Token } from "./Token.ts";

export type Stmt = {
    type: "Block";
    statements: Stmt[];
} | {
    type: "Expression";
    expression: Expr;
} | {
    type: "Print";
    expression: Expr;
} | {
    type: "Var";
    name: Token;
    initializer: Expr | undefined;
};
