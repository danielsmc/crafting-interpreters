import { loxError } from "./main.ts";
import { Expr } from "./types/Expr.ts";
import { ParseLayer, stack } from "./types/ParseLayer.ts";
import { Stmt } from "./types/Stmt.ts";
import { Token, TokenType } from "./types/Token.ts";
import { Sub } from "./types/utils.ts";

const PARSER_ERROR = Symbol("Parser Error");

export function parse(tokens: Token[]): Stmt[] {
    let current = 0;

    function primary(): Expr {
        if (match("FALSE")) return { type: "Literal", value: false };
        if (match("TRUE")) return { type: "Literal", value: true };
        if (match("NIL")) return { type: "Literal", value: null };

        const maybeLiteral = match("NUMBER", "STRING");
        if (maybeLiteral) {
            return { type: "Literal", value: maybeLiteral.literal };
        }

        const maybeVariable = match("IDENTIFIER");
        if (maybeVariable) {
            return { type: "Variable", name: maybeVariable };
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

    const unary: ParseLayer<Expr> = (precedent, self) => () => {
        const operator = match("BANG", "MINUS");
        if (operator) {
            const right = self();
            return {
                type: "Unary",
                operator,
                right,
            };
        }
        return precedent();
    };

    const assignment: ParseLayer<Expr> = (precedent, self) => () => {
        const expr = precedent();

        const maybeEquals = match("EQUAL");
        if (maybeEquals) {
            const value = self();
            if (expr.type === "Variable") {
                const { name } = expr;
                return { type: "Assign", name, value };
            }
            error(maybeEquals, "Invalid assignment target.");
        }

        return expr;
    };

    const expression = stack(
        primary,
        unary,
        leftAssocBinary(["SLASH", "STAR"]),
        leftAssocBinary(["MINUS", "PLUS"]),
        leftAssocBinary(["GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL"]),
        leftAssocBinary(["BANG_EQUAL", "EQUAL_EQUAL"]),
        assignment,
    );

    function statement(): Stmt {
        if (match("PRINT")) return printStatement();
        if (match("LEFT_BRACE")) return block();
        return expressionStatement();
    }

    function block(): Stmt {
        const statements: Stmt[] = [];
        while (!check("RIGHT_BRACE") && !isAtEnd()) {
            const s = declaration();
            s && statements.push(s);
        }
        consume("RIGHT_BRACE", "Expect '}' after block.");
        return {
            type: "Block",
            statements,
        };
    }

    function printStatement(): Stmt {
        const value = expression();
        consume("SEMICOLON", "Expect ';' after value.");
        return {
            type: "Print",
            expression: value,
        };
    }

    function expressionStatement(): Stmt {
        const value = expression();
        consume("SEMICOLON", "Expect ';' after expression.");
        return {
            type: "Expression",
            expression: value,
        };
    }

    function varDeclaration(): Stmt {
        const name = consume("IDENTIFIER", "Expect variable name.");
        const initializer = match("EQUAL") ? expression() : undefined;
        consume("SEMICOLON", "Expect ';' after variable declaration");
        return {
            type: "Var",
            name,
            initializer,
        };
    }

    function declaration(): Stmt | null {
        try {
            if (match("VAR")) return varDeclaration();
            return statement();
        } catch (e) {
            if (e !== PARSER_ERROR) throw e;
            synchronize();
            return null;
        }
    }

    //////// Actual entry point

    const statements: Stmt[] = [];
    while (!isAtEnd()) {
        const s = declaration();
        s && statements.push(s);
    }
    return statements;

    // try {
    //     return expression();
    // } catch {
    //     return null;
    // }

    function leftAssocBinary(
        types: Sub<Expr, "Binary">["operator"]["type"][],
    ): ParseLayer<Expr> {
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
        return PARSER_ERROR;
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
