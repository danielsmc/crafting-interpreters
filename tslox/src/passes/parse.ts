import { loxError } from "../run.ts";
import { Expr } from "../types/Expr.ts";
import { ParseLayer, stack } from "../types/ParseLayer.ts";
import { Stmt } from "../types/Stmt.ts";
import { Token, TokenType } from "../types/Token.ts";
import { Sub } from "../types/utils.ts";

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

    const call: ParseLayer<Expr> = (precedent) => () => {
        let expr = precedent();
        while (true) {
            if (match("LEFT_PAREN")) {
                const args: Expr[] = [];
                if (!check("RIGHT_PAREN")) {
                    if (args.length >= 255) {
                        error(peek(), "Can't have more than 255 arguments.");
                    }
                    do {
                        args.push(expression());
                    } while (match("COMMA"));
                }
                const paren = consume(
                    "RIGHT_PAREN",
                    "Expect ')' after arguments.",
                );
                expr = {
                    type: "Call",
                    callee: expr,
                    paren,
                    args,
                };
            } else {
                break;
            }
        }
        return expr;
    };

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
        call,
        unary,
        leftAssocBinary(["SLASH", "STAR"]),
        leftAssocBinary(["MINUS", "PLUS"]),
        leftAssocBinary(["GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL"]),
        leftAssocBinary(["BANG_EQUAL", "EQUAL_EQUAL"]),
        leftAssocBinary(["AND"]),
        leftAssocBinary(["OR"]),
        assignment,
    );

    function statement(): Stmt {
        if (match("FOR")) return forStatement();
        if (match("IF")) return ifStatement();
        if (match("PRINT")) return printStatement();
        if (match("RETURN")) return returnStatement();
        if (match("WHILE")) return whileStatement();
        if (match("LEFT_BRACE")) return block();
        return expressionStatement();
    }

    function forStatement(): Stmt {
        consume("LEFT_PAREN", "Expect '(' after 'for'.");
        let initializer: Stmt | undefined = undefined;
        if (match("SEMICOLON")) {
            // skip
        } else if (match("VAR")) {
            initializer = varDeclaration();
        } else {
            initializer = expressionStatement();
        }

        const condition: Expr = check("SEMICOLON")
            ? { type: "Literal", value: true }
            : expression();
        consume("SEMICOLON", "Expect ';' after loop condition.");

        const increment = check("RIGHT_PAREN") ? undefined : expression();
        consume("RIGHT_PAREN", "Expect ')' after for clauses.");

        let body = statement();

        if (increment) {
            body = {
                type: "Block",
                statements: [
                    body,
                    {
                        type: "Expression",
                        expression: increment,
                    },
                ],
            };
        }

        body = { type: "While", condition, body };

        if (initializer) {
            body = { type: "Block", statements: [initializer, body] };
        }

        return body;
    }

    function ifStatement(): Stmt {
        consume("LEFT_PAREN", "Expect '(' after 'if'.");
        const condition = expression();
        consume("RIGHT_PAREN", "Expect ')' after condition.");

        const thenBranch = statement();
        const elseBranch = match("ELSE") ? statement() : undefined;

        return {
            type: "If",
            condition,
            thenBranch,
            elseBranch,
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

    function returnStatement(): Stmt {
        const keyword = previous();
        const value = check("SEMICOLON") ? undefined : expression();
        consume("SEMICOLON", "Expect ';' after return value.");
        return {
            type: "Return",
            keyword,
            value,
        };
    }

    function whileStatement(): Stmt {
        consume("LEFT_PAREN", "Expect '(' after 'while'.");
        const condition = expression();
        consume("RIGHT_PAREN", "Expect ')' after condition.");

        const body = statement();

        return {
            type: "While",
            condition,
            body,
        };
    }

    function block(): Sub<Stmt, "Block"> {
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

    function expressionStatement(): Stmt {
        const value = expression();
        consume("SEMICOLON", "Expect ';' after expression.");
        return {
            type: "Expression",
            expression: value,
        };
    }

    function func(kind: string): Stmt {
        const name = consume("IDENTIFIER", `Expect ${kind} name.`);
        consume("LEFT_PAREN", `Expect '(' after ${kind} name.`);
        const params: Token[] = [];
        if (!check("RIGHT_PAREN")) {
            do {
                if (params.length >= 255) {
                    error(peek(), "Can't have more than 255 parameters.");
                }
                params.push(
                    consume("IDENTIFIER", "Expect parameter name."),
                );
            } while (match("COMMA"));
        }
        consume("RIGHT_PAREN", "Expect ')' after parameters.");
        consume("LEFT_BRACE", `Expect '{' before ${kind} body.`);
        const body = block().statements;
        return {
            type: "Function",
            name,
            params,
            body,
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
            if (match("FUN")) return func("function");
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

    function consume<T extends TokenType>(type: T, message: string) {
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
