// src/common/exceptions.ts
import { HttpException } from '@nestjs/common';

export class AppException extends HttpException {
  error: string;

  constructor(
    message: string,
    error: string,
    httpStatus: number,
    data: any = null,
  ) {
    super({ message, error, data }, httpStatus);
    this.error = error;
  }
}

// -------- AUTH --------
export class PermissionDenied extends AppException {
  constructor() {
    super('Permission denied', 'PERMISSION_DENIED', 403);
  }
}

export class Unauthorized extends AppException {
  constructor() {
    super('Unauthorized', 'UNAUTHORIZED', 401);
  }
}

export class EmailNotFound extends AppException {
  constructor() {
    super('Email not found', 'EMAIL_NOT_FOUND', 404);
  }
}

export class AccountDisabled extends AppException {
  constructor() {
    super('Account is disabled', 'ACCOUNT_DISABLED', 400);
  }
}

export class InvalidCredentials extends AppException {
  constructor() {
    super('Wrong email or password', 'INVALID_CREDENTIALS', 400);
  }
}

export class InvalidRefreshToken extends AppException {
  constructor() {
    super('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }
}

export class UserNotActive extends AppException {
  constructor() {
    super('User not found or disabled', 'USER_NOT_ACTIVE', 401);
  }
}

// -------- USER --------
export class UserNotFound extends AppException {
  constructor() {
    super('User not found', 'USER_NOT_FOUND', 404);
  }
}

export class EmailAlreadyExists extends AppException {
  constructor() {
    super('Email already exists', 'EMAIL_ALREADY_EXISTS', 400);
  }
}

export class RoleNotFound extends AppException {
  constructor() {
    super('Role not found', 'ROLE_NOT_FOUND', 404);
  }
}

export class RoleAlreadyExists extends AppException {
  constructor() {
    super('Role already exists', 'ROLE_ALREADY_EXISTS', 400);
  }
}
