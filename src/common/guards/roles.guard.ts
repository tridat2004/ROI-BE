import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../modules/user-roles/entities/user-role.entity';
import { AppRole } from '../decorators/roles.decorator';
import { PermissionDenied } from '../exception';
import { Observable } from 'rxjs';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<AppRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRole) return true;
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id || req.user?.sub;
    if (!userId) return false;

    const userRoles = await this.userRoleRepo.find({
      where: { userId },
    });
    const userRoleIds = userRoles.map((ur) => ur.roleId);
    const hasRole = requiredRole.some((role) => userRoleIds.includes(role));
    if (!hasRole) throw new PermissionDenied();

    return true;
  }
}
