import { Request, Response, NextFunction } from "express"



interface iError extends Error {
    statusCode: number
}

export class ApplicationException extends Error {
    constructor(
        message: string,
        public statusCode: number = 400,
        cause?: unknown
    ) {
        super(message, { cause })
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor) // Safty Check 
    }
}

export class BadRequestException extends ApplicationException {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 400, cause)
    }
}

export class ConflictException extends ApplicationException {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 409, cause)
    }
}

export class NotFoundException extends ApplicationException {
    constructor(
        message: string = "Not Found",
        cause?: unknown
    ) {
        super(message, 404, cause)
    }
}

export class InvalidTokenException extends ApplicationException {
    constructor(
        message: string = "The token is invalid or has expired",
        statusCode: number = 401,
        cause?: unknown
    ) {
        super(message, statusCode, cause);
    }
}

export class UnAuthorizedException extends ApplicationException {
    constructor(
        message: string = "You are not authorized. Please login to continue.",
        statusCode: number = 401,
        cause?: unknown
    ) {
        super(message, statusCode, cause);
    }
}

export class ForbiddenException extends ApplicationException {
    constructor(
        message: string =  "You dont have permission to perform this action",
        statusCode: number = 403,
        cause?: unknown
    ) {
        super(message, statusCode, cause);
    }
}

export const globalErrorHandler = (error: iError, req: Request, res: Response, next: NextFunction) => {

    res.status(error.statusCode || 500).json({
        error_message: error.message || "Something Went Wrong",
        name: error.name,
        statusCode: error.statusCode,
        cause: error.cause,
        error_stack: process.env.MOOD === "development" ? error.stack : undefined,
    })

}