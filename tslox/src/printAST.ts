import { Expr } from "./types/Expr.ts";
import { visitor } from "./types/utils.ts";

export const printAST = visitor<Expr, string>({
    Binary: (e) => parenthesize(e.operator.lexeme, e.left, e.right),
    Grouping: (e) => parenthesize("group", e.expression),
    Literal: (e) => e.value === null ? "nil" : e.value.toString(),
    Unary: (e) => parenthesize(e.operator.lexeme, e.right),
});

function parenthesize(name: string, ...exprs: Expr[]): string {
    return `(${name} ${exprs.map(printAST).join(" ")})`;
}
