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
    Function: {
        name: Token;
        params: Token[];
        body: Stmt[];
    };
    If: {
        condition: Expr;
        thenBranch: Stmt;
        elseBranch: Stmt | undefined;
    };
    Print: {
        expression: Expr;
    };
    Return: {
        keyword: Token;
        value: Expr | undefined;
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
