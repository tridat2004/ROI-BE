import { SetMetadata } from '@nestjs/common';

export enum AppRole {
  ADMIN = 1,
  MANAGER = 2,
  SALE = 3,
  VIEWER = 4,
}

export const Roles = (...roles: AppRole[]) => SetMetadata('roles', roles);
