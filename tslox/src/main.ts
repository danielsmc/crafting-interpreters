import { interpret } from "./interpret.ts";
import { parse } from "./parse.ts";
import { scan } from "./scan.ts";
import { Environment } from "./types/Environment.ts";
import { Token } from "./types/Token.ts";

let hadError = false;

const [file, ...extras] = Deno.args;
if (extras.length) {
  console.log("Usage: tslox [script]");
  Deno.exit(64);
} else if (file) {
  runFile(file);
} else {
  runPrompt();
}

function runFile(file: string) {
  const env = new Environment();
  run(Deno.readTextFileSync(file), env);
  if (hadError) Deno.exit(65);
}

function runPrompt() {
  const env = new Environment();
  while (true) {
    const line = prompt("> ");
    if (line === null) break;
    run(line, env);
    hadError = false;
  }
}

function run(source: string, env: Environment) {
  const tokens = scan(source);
  const statements = parse(tokens);

  if (hadError) return;
  interpret(statements, env);
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

function report(line: number, where: string, message: string) {
  console.log(`[line ${line}] Error ${where}: ${message}`);
  hadError = true;
}
