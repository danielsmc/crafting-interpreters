import { Token } from "./Token.ts";

export class RuntimeError extends Error {
    constructor(message: string, public token: Token) {
        super(message);
    }
}
