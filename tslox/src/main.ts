import { run } from "./run.ts";
import { initGlobalEnv } from "./types/Environment.ts";

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
  const env = initGlobalEnv();
  const hadError = run(Deno.readTextFileSync(file), env);
  if (hadError) Deno.exit(65);
}

function runPrompt() {
  const env = initGlobalEnv();
  while (true) {
    const line = prompt("> ");
    if (line === null) break;
    run(line, env);
  }
}
