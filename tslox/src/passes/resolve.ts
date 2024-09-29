import { loxError } from "../run.ts";
import { Expr } from "../types/Expr.ts";
import { Stmt } from "../types/Stmt.ts";
import { Token } from "../types/Token.ts";
import { Sub, visitor } from "../types/utils.ts";

type FunctionType = "NONE" | "FUNCTION";

export function resolve(statements: Stmt[]) {
    const scopes: Record<string, boolean>[] = [];
    let currentFunction: FunctionType = "NONE";
    const noScopes = () => scopes.length === 0;
    const topScope = () => scopes[scopes.length - 1];

    const resolve = visitor<Stmt | Expr>({
        Block: (s) => {
            beginScope();
            s.statements.forEach(resolve);
            endScope();
        },
        Var: (s) => {
            declare(s.name);
            if (s.initializer) resolve(s.initializer);
            define(s.name);
        },
        Variable: (e) => {
            if (!noScopes() && topScope()[e.name.lexeme] === false) {
                loxError(
                    e.name,
                    "Can't read local variable in its own initializer.",
                );
            }
            e.distance = resolveLocal(e.name);
        },
        Assign: (e) => {
            resolve(e.value);
            e.distance = resolveLocal(e.name);
        },
        Function: (s) => {
            if (s.params.length > 255) {
                loxError(s.params[255], "Can't have more than 255 parameters.");
            }
            declare(s.name);
            define(s.name);
            resolveFunction(s, "FUNCTION");
        },
        Expression: (s) => resolve(s.expression),
        If: (s) => {
            resolve(s.condition);
            resolve(s.thenBranch);
            if (s.elseBranch) resolve(s.elseBranch);
        },
        Print: (s) => resolve(s.expression),
        Return: (s) => {
            if (currentFunction === "NONE") {
                loxError(s.keyword, "Can't return from top-level code.");
            }
            if (s.value) resolve(s.value);
        },
        While: (s) => {
            resolve(s.condition);
            resolve(s.body);
        },
        Binary: (e) => {
            resolve(e.left);
            resolve(e.right);
        },
        Call: (e) => {
            if (e.args.length > 255) {
                loxError(e.paren, "Can't have more than 255 arguments.");
            }
            resolve(e.callee);
            e.args.forEach(resolve);
        },
        Grouping: (e) => resolve(e.expression),
        Literal: () => {},
        Unary: (e) => resolve(e.right),
    });

    statements.forEach(resolve);

    function resolveFunction(func: Sub<Stmt, "Function">, type: FunctionType) {
        const enclosingFunction = currentFunction;
        currentFunction = type;
        beginScope();
        func.params.forEach((param) => {
            declare(param);
            define(param);
        });
        func.body.forEach(resolve);
        endScope();
        currentFunction = enclosingFunction;
    }

    function beginScope() {
        scopes.push({});
    }

    function endScope() {
        scopes.pop();
    }

    function declare(name: Token) {
        if (noScopes()) return;
        const scope = topScope();
        if (scope[name.lexeme] !== undefined) {
            loxError(name, "Already a variable with this name in this scope.");
        }
        scope[name.lexeme] = false;
    }

    function define(name: Token) {
        if (noScopes()) return;
        topScope()[name.lexeme] = true;
    }

    function resolveLocal(name: Token): number | undefined {
        for (let i = scopes.length - 1; i >= 0; i--) {
            if (scopes[i][name.lexeme] !== undefined) {
                return scopes.length - 1 - i;
            }
        }
    }
}
