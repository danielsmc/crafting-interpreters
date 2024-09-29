import { interpret, parse, resolve, scan } from "./passes/index.ts";
import { Environment } from "./types/Environment.ts";
import { Token } from "./types/Token.ts";

let hadError = false;

export function run(source: string, env: Environment): boolean {
    hadError = false;
    const tokens = scan(source);
    const statements = parse(tokens);
    if (hadError) return true;
    resolve(statements);
    if (hadError) return true;
    interpret(statements, env);
    return hadError;
}

export function loxError(loc: Token | number, message: string) {
    if (typeof loc === "number") {
        report(loc, "", message);
    } else if (loc.type === "EOF") {
        report(loc.line, " at end", message);
    } else {
        report(loc.line, ` at '${loc.lexeme}'`, message);
    }
}

export function report(line: number, where: string, message: string) {
    console.log(`[line ${line}] Error ${where}: ${message}`);
    hadError = true;
}
