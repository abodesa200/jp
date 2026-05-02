export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code: string = "ERROR"
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}