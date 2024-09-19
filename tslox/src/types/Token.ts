export type TokenType =
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

export type Token = {
    type: Exclude<TokenType, "NUMBER" | "STRING">;
    lexeme: string;
    line: number;
    literal?: never;
} | {
    type: "NUMBER";
    lexeme: string;
    line: number;
    literal: number;
} | {
    type: "STRING";
    lexeme: string;
    line: number;
    literal: string;
};

export function tokenToString({ type, lexeme, literal }: Token) {
    return `${type} ${lexeme} ${literal ?? ""}`;
}
