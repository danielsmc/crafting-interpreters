import { loxError } from "../run.ts";
import { Token } from "../types/Token.ts";

const keywords = Object.fromEntries(
    ([
        "AND",
        "CLASS",
        "ELSE",
        "FALSE",
        "FUN",
        "FOR",
        "IF",
        "NIL",
        "OR",
        "PRINT",
        "RETURN",
        "SUPER",
        "THIS",
        "TRUE",
        "VAR",
        "WHILE",
    ] satisfies Token["type"][]).map((k) => [k.toLowerCase(), k]),
);

export function scan(source: string): Token[] {
    const tokens: Token[] = [];
    let start = 0;
    let current = 0;
    let line = 1;

    while (!isAtEnd()) {
        start = current;
        scanToken();
    }
    tokens.push({
        type: "EOF",
        lexeme: "",
        line,
    });

    return tokens;

    function scanToken() {
        const c = advance();
        switch (c) {
            case "(":
                addToken("LEFT_PAREN");
                break;
            case ")":
                addToken("RIGHT_PAREN");
                break;
            case "{":
                addToken("LEFT_BRACE");
                break;
            case "}":
                addToken("RIGHT_BRACE");
                break;
            case ",":
                addToken("COMMA");
                break;
            case ".":
                addToken("DOT");
                break;
            case "-":
                addToken("MINUS");
                break;
            case "+":
                addToken("PLUS");
                break;
            case ";":
                addToken("SEMICOLON");
                break;
            case "*":
                addToken("STAR");
                break;
            case "!":
                addToken(match("=") ? "BANG_EQUAL" : "BANG");
                break;
            case "=":
                addToken(match("=") ? "EQUAL_EQUAL" : "EQUAL");
                break;
            case "<":
                addToken(match("=") ? "LESS_EQUAL" : "LESS");
                break;
            case ">":
                addToken(match("=") ? "GREATER_EQUAL" : "GREATER");
                break;
            case "/":
                if (match("/")) {
                    // comment
                    while (peek() !== "\n" && !isAtEnd) advance();
                } else {
                    addToken("SLASH");
                }
                break;
            case " ":
            case "\r":
            case "\t":
                break;
            case "\n":
                line++;
                break;
            case '"':
                string();
                break;
            default:
                if (isDigit(c)) {
                    number();
                } else if (isAlpha(c)) {
                    identifier();
                } else {
                    loxError(line, "Unexpected character.");
                }
        }
    }

    function identifier() {
        while (isAlphaNumeric(peek())) advance();
        const type: Token["type"] = keywords[curLexeme()] ?? "IDENTIFIER";
        addToken(type);
    }

    function number() {
        while (isDigit(peek())) advance();

        if (peek() == "." && isDigit(peekNext())) {
            // consume the decimal point
            advance();

            while (isDigit(peek())) advance();
        }

        addToken("NUMBER", parseFloat(curLexeme()));
    }

    function string() {
        while (peek() !== '"' && !isAtEnd()) {
            if (peek() !== "\n") line++;
            advance();
        }

        if (isAtEnd()) {
            loxError(line, "Unterminated string.");
            return;
        }

        // closing "
        advance();

        addToken("STRING", curLexeme().slice(1, -1));
    }

    function match(expected: string): boolean {
        if (isAtEnd()) return false;
        if (source[current] !== expected) return false;
        current++;
        return true;
    }

    function peek() {
        return isAtEnd() ? "\0" : source[current];
    }

    function peekNext() {
        if (current + 1 > source.length) return "\0";
        return source[current + 1];
    }

    function isAlpha(c: string) {
        return /^[a-zA-Z_]$/.test(c);
    }

    function isDigit(c: string) {
        return /^[0-9]$/.test(c);
    }

    function isAlphaNumeric(c: string) {
        return isAlpha(c) || isDigit(c);
    }

    function advance() {
        return source[current++];
    }

    function curLexeme() {
        return source.slice(start, current);
    }

    // The assertions are kind of ick.
    // Maybe it would be easier to just have separate addStringToken() etc?
    function addToken(type: Exclude<Token["type"], "STRING" | "NUMBER">): void;
    function addToken(type: "STRING", literal: string): void;
    function addToken(type: "NUMBER", literal: number): void;
    function addToken(type: Token["type"], literal?: string | number) {
        const lexeme = curLexeme();
        if (type === "NUMBER") {
            literal = literal as number;
            tokens.push({ type, lexeme, literal, line });
        } else if (type === "STRING") {
            literal = literal as string;
            tokens.push({ type, lexeme, literal, line });
        } else {
            tokens.push({ type, lexeme, line });
        }
    }

    function isAtEnd() {
        return current >= source.length;
    }
}
