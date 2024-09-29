import { SubTypes } from "./utils.ts";

type TokenType =
    | "LEFT_PAREN"
    | "RIGHT_PAREN"
    | "LEFT_BRACE"
    | "RIGHT_BRACE"
    | "COMMA"
    | "DOT"
    | "MINUS"
    | "PLUS"
    | "SEMICOLON"
    | "SLASH"
    | "STAR"
    | "BANG"
    | "BANG_EQUAL"
    | "EQUAL"
    | "EQUAL_EQUAL"
    | "GREATER"
    | "GREATER_EQUAL"
    | "LESS"
    | "LESS_EQUAL"
    | "IDENTIFIER"
    | "STRING"
    | "NUMBER"
    | "AND"
    | "CLASS"
    | "ELSE"
    | "FALSE"
    | "FUN"
    | "FOR"
    | "IF"
    | "NIL"
    | "OR"
    | "PRINT"
    | "RETURN"
    | "SUPER"
    | "THIS"
    | "TRUE"
    | "VAR"
    | "WHILE"
    | "EOF";

/*
This illustrates a weakness of SubTypes: there's no way for multiple
subtypes to truly share a definition. Even if we were to use a mapped type,
TypeScript can't infer that {type: "A"|"B", foo: string} is assignable to
{type: "A", foo: string} | {type: "B", foo: string}
*/
export type Token =
    | {
        type: Exclude<TokenType, "NUMBER" | "STRING">;
        lexeme: string;
        line: number;
        literal?: never;
    }
    | SubTypes<
        {
            NUMBER: {
                lexeme: string;
                line: number;
                literal: number;
            };
            STRING: {
                lexeme: string;
                line: number;
                literal: string;
            };
        }
    >;

export function tokenToString({ type, lexeme, literal }: Token) {
    return `${type} ${lexeme} ${literal ?? ""}`;
}
