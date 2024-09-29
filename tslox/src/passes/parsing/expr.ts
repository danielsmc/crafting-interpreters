import { Expr } from "../../types/Expr.ts";
import { Token } from "../../types/Token.ts";
import { Sub } from "../../types/utils.ts";
import { ParseFunc, ParseLayer, stack } from "./types.ts";

const primary: ParseFunc<Token, Expr> = (parser) => {
    if (parser.match("FALSE")) return { type: "Literal", value: false };
    if (parser.match("TRUE")) return { type: "Literal", value: true };
    if (parser.match("NIL")) return { type: "Literal", value: null };

    const maybeLiteral = parser.match("NUMBER", "STRING");
    if (maybeLiteral) {
        return { type: "Literal", value: maybeLiteral.literal };
    }

    const maybeVariable = parser.match("IDENTIFIER");
    if (maybeVariable) {
        return { type: "Variable", name: maybeVariable };
    }

    if (parser.match("LEFT_PAREN")) {
        const expr = expression(parser);
        parser.consume("RIGHT_PAREN", "Expect ')' after expression.");
        return {
            type: "Grouping",
            expression: expr,
        };
    }

    throw parser.error(parser.peek(), "Expect expression.");
};

const call: ParseLayer<Token, Expr> = (precedent) => (parser) => {
    let expr = precedent(parser);
    while (true) {
        if (parser.match("LEFT_PAREN")) {
            const args: Expr[] = [];
            if (!parser.check("RIGHT_PAREN")) {
                if (args.length >= 255) {
                    parser.error(
                        parser.peek(),
                        "Can't have more than 255 arguments.",
                    );
                }
                do {
                    args.push(expression(parser));
                } while (parser.match("COMMA"));
            }
            const paren = parser.consume(
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

const unary: ParseLayer<Token, Expr> = (precedent, self) => (parser) => {
    const operator = parser.match("BANG", "MINUS");
    if (operator) {
        const right = self(parser);
        return {
            type: "Unary",
            operator,
            right,
        };
    }
    return precedent(parser);
};

const assignment: ParseLayer<Token, Expr> = (precedent, self) => (parser) => {
    const expr = precedent(parser);

    const maybeEquals = parser.match("EQUAL");
    if (maybeEquals) {
        const value = self(parser);
        if (expr.type === "Variable") {
            const { name } = expr;
            return { type: "Assign", name, value };
        }
        parser.error(maybeEquals, "Invalid assignment target.");
    }

    return expr;
};

function leftAssocBinary(
    types: Sub<Expr, "Binary">["operator"]["type"][],
): ParseLayer<Token, Expr> {
    return (precedent) => (parser) => {
        let expr = precedent(parser);

        while (true) {
            const operator = parser.match(...types);
            if (!operator) break;
            const right = precedent(parser);
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

export const expression = stack(
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
