import { loxError } from "../run.ts";
import { Stmt } from "../types/Stmt.ts";
import { Token } from "../types/Token.ts";
import { Sub } from "../types/utils.ts";
import { declaration } from "./parsing/stmt.ts";
import { PARSER_ERROR, ParserControls } from "./parsing/types.ts";

export function parse(tokens: Token[]): Stmt[] {
    const parser = new Parser(tokens);
    const statements: Stmt[] = [];
    while (!parser.isAtEnd()) {
        const s = declaration(parser);
        s && statements.push(s);
    }
    return statements;
}
class Parser implements ParserControls<Token> {
    private current = 0;
    constructor(private tokens: Token[]) {}

    consume<T extends Token["type"]>(type: T, message: string) {
        const res = this.match(type);
        if (!res) throw this.error(this.peek(), message);
        return res;
    }

    match<T extends Token["type"]>(
        ...types: T[]
    ): Sub<Token, T> | false {
        for (const type of types) {
            const checked = this.check(type);
            if (checked) {
                this.advance();
                return checked;
            }
        }
        return false;
    }

    check<T extends Token["type"]>(type: T): Sub<Token, T> | false {
        const tok = this.peek();
        if (tok.type !== type) return false;
        return tok as Sub<Token, T>; // I think this is true even if tsc can't infer it
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
    }

    isAtEnd() {
        return this.peek().type === "EOF";
    }

    peek() {
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    error(token: Token, message: string): typeof PARSER_ERROR {
        loxError(token, message);
        return PARSER_ERROR;
    }

    synchronize() {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type === "SEMICOLON") return;
            if (
                this.match(
                    "CLASS",
                    "FUN",
                    "VAR",
                    "FOR",
                    "IF",
                    "WHILE",
                    "PRINT",
                    "RETURN",
                )
            ) return;
            this.advance();
        }
    }
}
