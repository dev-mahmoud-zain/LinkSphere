"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.glopalErrorHandler = exports.ForbiddenException = exports.UnAuthorizedException = exports.InvalidTokenException = exports.NotFoundException = exports.ConflictException = exports.BadRequestException = exports.ApplicationException = void 0;
class ApplicationException extends Error {
    statusCode;
    constructor(message, statusCode = 400, cause) {
        super(message, { cause });
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationException = ApplicationException;
class BadRequestException extends ApplicationException {
    constructor(message, cause) {
        super(message, 400, cause);
    }
}
exports.BadRequestException = BadRequestException;
class ConflictException extends ApplicationException {
    constructor(message, cause) {
        super(message, 409, cause);
    }
}
exports.ConflictException = ConflictException;
class NotFoundException extends ApplicationException {
    constructor(message = "Not Found", cause) {
        super(message, 404, cause);
    }
}
exports.NotFoundException = NotFoundException;
class InvalidTokenException extends ApplicationException {
    constructor(message = "The token is invalid or has expired", statusCode = 401, cause) {
        super(message, statusCode, cause);
    }
}
exports.InvalidTokenException = InvalidTokenException;
class UnAuthorizedException extends ApplicationException {
    constructor(message = "You are not authorized. Please login to continue.", statusCode = 401, cause) {
        super(message, statusCode, cause);
    }
}
exports.UnAuthorizedException = UnAuthorizedException;
class ForbiddenException extends ApplicationException {
    constructor(message = "You dont have permission to perform this action", statusCode = 403, cause) {
        super(message, statusCode, cause);
    }
}
exports.ForbiddenException = ForbiddenException;
const glopalErrorHandler = (error, req, res, next) => {
    res.status(error.statusCode || 500).json({
        error_message: error.message || "Something Went Wrong",
        name: error.name,
        statusCode: error.statusCode,
        cause: error.cause,
        error_stack: process.env.MOOD === "development" ? error.stack : undefined,
    });
};
exports.glopalErrorHandler = glopalErrorHandler;
