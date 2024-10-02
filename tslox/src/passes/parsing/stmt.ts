import { Expr } from "../../types/Expr.ts";
import { Stmt } from "../../types/Stmt.ts";
import { Token } from "../../types/Token.ts";
import { Sub } from "../../types/utils.ts";
import { expression } from "./expr.ts";
import { ParseFunc, PARSER_ERROR } from "./types.ts";

const statement: ParseFunc<Token, Stmt> = (parser) => {
    if (parser.match("FOR")) return forStatement(parser);
    if (parser.match("IF")) return ifStatement(parser);
    if (parser.match("PRINT")) return printStatement(parser);
    if (parser.match("RETURN")) return returnStatement(parser);
    if (parser.match("WHILE")) return whileStatement(parser);
    if (parser.match("LEFT_BRACE")) return block(parser);
    return expressionStatement(parser);
};

const forStatement: ParseFunc<Token, Stmt> = (parser) => {
    parser.consume("LEFT_PAREN", "Expect '(' after 'for'.");
    let initializer: Stmt | undefined = undefined;
    if (parser.match("SEMICOLON")) {
        // skip
    } else if (parser.match("VAR")) {
        initializer = varDeclaration(parser);
    } else {
        initializer = expressionStatement(parser);
    }

    const condition: Expr = parser.check("SEMICOLON")
        ? { type: "Literal", value: true }
        : expression(parser);
    parser.consume("SEMICOLON", "Expect ';' after loop condition.");

    const increment = parser.check("RIGHT_PAREN")
        ? undefined
        : expression(parser);
    parser.consume("RIGHT_PAREN", "Expect ')' after for clauses.");

    let body = statement(parser);

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
};

const ifStatement: ParseFunc<Token, Stmt> = (parser) => {
    parser.consume("LEFT_PAREN", "Expect '(' after 'if'.");
    const condition = expression(parser);
    parser.consume("RIGHT_PAREN", "Expect ')' after condition.");

    const thenBranch = statement(parser);
    const elseBranch = parser.match("ELSE") ? statement(parser) : undefined;

    return {
        type: "If",
        condition,
        thenBranch,
        elseBranch,
    };
};

const printStatement: ParseFunc<Token, Stmt> = (parser) => {
    const value = expression(parser);
    parser.consume("SEMICOLON", "Expect ';' after value.");
    return {
        type: "Print",
        expression: value,
    };
};

const returnStatement: ParseFunc<Token, Stmt> = (parser) => {
    const keyword = parser.previous();
    const value = parser.check("SEMICOLON") ? undefined : expression(parser);
    parser.consume("SEMICOLON", "Expect ';' after return value.");
    return {
        type: "Return",
        keyword,
        value,
    };
};

const whileStatement: ParseFunc<Token, Stmt> = (parser) => {
    parser.consume("LEFT_PAREN", "Expect '(' after 'while'.");
    const condition = expression(parser);
    parser.consume("RIGHT_PAREN", "Expect ')' after condition.");

    const body = statement(parser);

    return {
        type: "While",
        condition,
        body,
    };
};

const block: ParseFunc<Token, Sub<Stmt, "Block">> = (parser) => {
    const statements: Stmt[] = [];
    while (!parser.check("RIGHT_BRACE") && !parser.isAtEnd()) {
        const s = declaration(parser);
        s && statements.push(s);
    }
    parser.consume("RIGHT_BRACE", "Expect '}' after block.");
    return {
        type: "Block",
        statements,
    };
};

const expressionStatement: ParseFunc<Token, Stmt> = (parser) => {
    const value = expression(parser);
    parser.consume("SEMICOLON", "Expect ';' after expression.");
    return {
        type: "Expression",
        expression: value,
    };
};

const func: (kind: string) => ParseFunc<Token, Sub<Stmt, "Function">> =
    (kind: string) => (parser) => {
        const name = parser.consume("IDENTIFIER", `Expect ${kind} name.`);
        parser.consume("LEFT_PAREN", `Expect '(' after ${kind} name.`);
        const params: Token[] = [];
        if (!parser.check("RIGHT_PAREN")) {
            do {
                params.push(
                    parser.consume("IDENTIFIER", "Expect parameter name."),
                );
            } while (parser.match("COMMA"));
        }
        parser.consume("RIGHT_PAREN", "Expect ')' after parameters.");
        parser.consume("LEFT_BRACE", `Expect '{' before ${kind} body.`);
        const body = block(parser).statements;
        return {
            type: "Function",
            name,
            params,
            body,
        };
    };

const classDeclaration: ParseFunc<Token, Stmt> = (parser) => {
    const name = parser.consume("IDENTIFIER", "Expect class name.");

    let superclass: Sub<Expr, "Variable"> | undefined = undefined;
    if (parser.match("LESS")) {
        superclass = {
            type: "Variable",
            name: parser.consume("IDENTIFIER", "Expect superclass name."),
        };
    }
    parser.consume("LEFT_BRACE", "Expect '{' before class body");

    const methods: Sub<Stmt, "Function">[] = [];
    while (!parser.check("RIGHT_BRACE") && !parser.isAtEnd()) {
        methods.push(func("method")(parser));
    }
    parser.consume("RIGHT_BRACE", "Expect '}' after class body");

    return {
        type: "Class",
        name,
        superclass,
        methods,
    };
};

const varDeclaration: ParseFunc<Token, Stmt> = (parser) => {
    const name = parser.consume("IDENTIFIER", "Expect variable name.");
    const initializer = parser.match("EQUAL") ? expression(parser) : undefined;
    parser.consume("SEMICOLON", "Expect ';' after variable declaration");
    return {
        type: "Var",
        name,
        initializer,
    };
};

export const declaration: ParseFunc<Token, Stmt | null> = (parser) => {
    try {
        if (parser.match("CLASS")) return classDeclaration(parser);
        if (parser.match("FUN")) return func("function")(parser);
        if (parser.match("VAR")) return varDeclaration(parser);
        return statement(parser);
    } catch (e) {
        if (e !== PARSER_ERROR) throw e;
        parser.synchronize();
        return null;
    }
};
