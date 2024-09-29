import { LoxVal } from "./LoxTypes.ts";
import { Token } from "./Token.ts";

export class RuntimeError extends Error {
    constructor(message: string, public token: Token) {
        super(message);
    }
}

export class Return {
    constructor(public value: LoxVal) {}
}
