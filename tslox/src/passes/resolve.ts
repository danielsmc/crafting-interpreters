import { loxError } from "../main.ts";
import { Expr } from "../types/Expr.ts";
import { Stmt } from "../types/Stmt.ts";
import { Token } from "../types/Token.ts";
import { Sub, visitor } from "../types/utils.ts";

export function resolve(statements: Stmt[]) {
    const scopes: Record<string, boolean>[] = [];
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
        "Function": (s) => {
            declare(s.name);
            define(s.name);
            resolveFunction(s);
        },
        Expression: (s) => resolve(s.expression),
        If: (s) => {
            resolve(s.condition);
            resolve(s.thenBranch);
            if (s.elseBranch) resolve(s.elseBranch);
        },
        Print: (s) => resolve(s.expression),
        Return: (s) => {
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
            resolve(e.callee);
            e.args.forEach(resolve);
        },
        Grouping: (e) => resolve(e.expression),
        Literal: () => {},
        Unary: (e) => resolve(e.right),
    });

    statements.forEach(resolve);

    function resolveFunction(func: Sub<Stmt, "Function">) {
        beginScope();
        func.params.forEach((param) => {
            declare(param);
            define(param);
        });
        func.body.forEach(resolve);
        endScope();
    }

    function beginScope() {
        scopes.push({});
    }

    function endScope() {
        scopes.pop();
    }

    function declare(name: Token) {
        if (noScopes()) return;
        topScope()[name.lexeme] = false;
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
