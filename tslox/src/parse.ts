import { loxError } from "./main.ts";
import { Expr } from "./types/Expr.ts";
import { Token, TokenType } from "./types/Token.ts";
import { Sub } from "./types/utils.ts";

type ParseLayer = (precedent: () => Expr) => () => Expr;

function pipe<O, F = () => O>(base: F, ...funcs: ((p: F) => F)[]): F {
    let out = base;
    for (const f of funcs) {
        out = f(out);
    }
    return out;
}

export function parse(tokens: Token[]) {
    let current = 0;

    function primary(): Expr {
        if (match("FALSE")) return { type: "Literal", value: false };
        if (match("TRUE")) return { type: "Literal", value: true };
        if (match("NIL")) return { type: "Literal", value: null };

        const maybeLiteral = match("NUMBER", "STRING");
        if (maybeLiteral) {
            return { type: "Literal", value: maybeLiteral.literal };
        }

        if (match("LEFT_PAREN")) {
            const expr = expression();
            consume("RIGHT_PAREN", "Expect ')' after expression.");
            return {
                type: "Grouping",
                expression: expr,
            };
        }

        throw error(peek(), "Expect expression.");
    }

    const unary: ParseLayer = (precedent) => () => {
        const operator = match("BANG", "MINUS");
        if (operator) {
            const right = unary(precedent)();
            return {
                type: "Unary",
                operator,
                right,
            };
        }
        return precedent();
    };

    const factor = leftAssocBinary(["SLASH", "STAR"]);

    const term = leftAssocBinary(["MINUS", "PLUS"]);

    const comparison = leftAssocBinary([
        "GREATER",
        "GREATER_EQUAL",
        "LESS",
        "LESS_EQUAL",
    ]);

    const equality = leftAssocBinary(["BANG_EQUAL", "EQUAL_EQUAL"]);

    const expression = pipe(primary, unary, factor, term, comparison, equality);

    //////// Actual entry point
    try {
        return expression();
    } catch {
        return null;
    }

    function leftAssocBinary(
        types: Sub<Expr, "Binary">["operator"]["type"][],
    ): ParseLayer {
        return (precedent) => () => {
            let expr = precedent();

            while (true) {
                const operator = match(...types);
                if (!operator) break;
                const right = precedent();
                expr = {
                    type: "Binary",
                    left: expr,
                    operator,
                    right,
                };
            }
            return expr;
        };
    }

    function consume(type: TokenType, message: string) {
        const res = match(type);
        if (!res) throw error(peek(), message);
        return res;
    }

    function match<T extends TokenType>(...types: T[]): Sub<Token, T> | false {
        for (const type of types) {
            const checked = check(type);
            if (checked) {
                advance();
                return checked;
            }
        }
        return false;
    }

    function check<T extends TokenType>(type: T): Sub<Token, T> | false {
        const tok = peek();
        if (tok.type !== type) return false;
        return tok as Sub<Token, T>; // I think this is true even if tsc can't infer it
    }

    function advance() {
        if (!isAtEnd()) current++;
    }

    function isAtEnd() {
        return peek().type === "EOF";
    }

    function peek() {
        return tokens[current];
    }

    function previous() {
        return tokens[current - 1];
    }

    function error(token: Token, message: string) {
        loxError(token, message);
        return new Error();
    }

    function synchronize() {
        advance();

        while (!isAtEnd()) {
            if (previous().type === "SEMICOLON") return;
            if (
                match(
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
            advance();
        }
    }
}
