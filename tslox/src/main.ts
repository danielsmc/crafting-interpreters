import { scan } from "./scan.ts";
import { tokenToString } from "./types/Token.ts";

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
  run(Deno.readTextFileSync(file));
  if (hadError) Deno.exit(65);
}

function runPrompt() {
  while (true) {
    const line = prompt("> ");
    if (line === null) break;
    run(line);
    hadError = false;
  }
}

function run(source: string) {
  const tokens = scan(source);

  for (const token of tokens) {
    console.log(tokenToString(token));
  }
}

export function loxError(line: number, message: string) {
  report(line, "", message);
}

function report(line: number, where: string, message: string) {
  console.log(`[line ${line}] Error ${where}: ${message}`);
  hadError = true;
}
