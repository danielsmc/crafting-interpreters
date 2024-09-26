import { Expr } from "./Expr.ts";
import { Token } from "./Token.ts";
import { SubTypes } from "./utils.ts";

export type Stmt = SubTypes<{
    Block: {
        statements: Stmt[];
    };
    Expression: {
        expression: Expr;
    };
    If: {
        condition: Expr;
        thenBranch: Stmt;
        elseBranch: Stmt | undefined;
    };
    Print: {
        expression: Expr;
    };
    Var: {
        name: Token;
        initializer: Expr | undefined;
    };
    While: {
        condition: Expr;
        body: Stmt;
    };
}>;
