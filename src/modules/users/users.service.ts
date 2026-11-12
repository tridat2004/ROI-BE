import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AppRole } from 'src/common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { successResponse } from 'src/common/response';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { RolePermission } from '../role-permissions/entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import * as bcrypt from 'bcrypt';
import { RoiProject } from '../roi-projects/entities/roi-project.entity';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,

    @InjectRepository(UserRole)
    private userRolesRepository: Repository<UserRole>,

    private readonly activityLogsService: ActivityLogsService,
  ) { }

  async create(createUserDto: CreateUserDto, currentUser: any) {
    const { email, password, fullName, companyName, phone, role } = createUserDto;

    // Check if email already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email },
      withDeleted: true,
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Kiểm tra quyền hạn dựa trên vai trò của currentUser
    const currentUserRoles = await this.userRolesRepository.find({
      where: { userId: Number(currentUser.id || currentUser.sub) },
      relations: ['role'],
    });
    const creatorRoleCodes = currentUserRoles.map((ur) =>
      ur.role.code.toLowerCase(),
    );
    const isAdmin = creatorRoleCodes.includes('admin');
    const isManager = creatorRoleCodes.includes('manager');

    // Manager không được phép tạo Admin (Hoặc tùy biến thêm logic ở đây)
    const assignedRole = await this.rolesRepository.findOne({
      where: { code: role },
    });

    if (role && !assignedRole) {
      throw new BadRequestException(`Role '${role}' không tồn tại trong hệ thống`);
    }

    if (isManager && !isAdmin && role?.toLowerCase() === 'admin') {
      throw new ForbiddenException(
        'Managers are not allowed to create Admin users',
      );
    }

    // Create user
    const user = this.usersRepository.create({
      email,
      passwordHash,
      fullName,
      companyName,
      phone,
      status: 'active',
      createBy: { id: Number(currentUser.id || currentUser.sub) } as any,
      provider: 'local',
    });

    await this.usersRepository.save(user);

    if (assignedRole) {
      await this.userRolesRepository.save({
        userId: Number(user.id),
        roleId: Number(assignedRole.id),
      });
    }

    const creatorTitle = isAdmin ? 'Admin' : 'Manager';
    await this.activityLogsService.create({
      userId: currentUser.id || currentUser.sub,
      username: currentUser.fullName || currentUser.email,
      action: 'CREATE_USER',
      status: 'SUCCESS',
      desc: `${creatorTitle} created user: ${user.fullName || email}`,
    });

    const { data: createdUser } = await this.findOne(Number(user.id));
    return successResponse({
      message: 'User created successfully',
      data: createdUser,
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, roleId?: number) {
    const skip = (page - 1) * limit;

    // 1. Lấy danh sách ID người dùng có phân trang và tìm kiếm
    const queryIds = this.usersRepository
      .createQueryBuilder('user')
      .withDeleted()
      .select('user.id', 'id');

    if (search) {
      queryIds.andWhere(
        '(user.email ILIKE :search OR user.full_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (roleId) {
      queryIds
        .innerJoin(UserRole, 'ur_filter', 'ur_filter.userId = user.id')
        .andWhere('ur_filter.roleId = :roleId', { roleId });
    }

    const totalItems = await queryIds.clone().distinct(true).getCount();

    // TypeORM can drop skip/take on raw queries once joins are involved.
    const userIdsResult = await queryIds
      .clone()
      .distinct(true)
      .orderBy('user.id', 'ASC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const userIds = userIdsResult.map((u) => Number(u.id));

    if (userIds.length === 0) {
      return successResponse({
        message: 'Users retrieved successfully',
        data: [],
        meta: {
          totalItems,
          itemCount: 0,
          itemsPerPage: limit,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
        },
      });
    }

    // 2. Lấy chi tiết cho các ID đã tìm thấy
    const rows = await this.usersRepository
      .createQueryBuilder('user')
      .withDeleted()
      .leftJoin(UserRole, 'ur', 'ur.userId = user.id')
      .leftJoin(Role, 'role', 'role.id = ur.roleId')
      .leftJoin(RolePermission, 'rp', 'rp.roleId = role.id')
      .leftJoin(Permission, 'permission', 'permission.id = rp.permissionId')
      .leftJoin('user.createBy', 'creator')
      .select([
        'user.id AS user_id',
        'user.email AS user_email',
        'user.full_name AS user_full_name',
        'user.company_name AS user_company_name',
        'user.phone AS user_phone',
        'user.status AS user_status',
        'user.is_active AS user_is_active',
        'COALESCE(creator.full_name, user.full_name) AS user_registration_method',

        'user.created_at AS user_created_at',
        'user.updated_at AS user_updated_at',

        'role.id AS role_id',
        'role.code AS role_code',
        'role.name AS role_name',

        'permission.id AS permission_id',
        'permission.code AS permission_code',
      ])
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(p.id)', 'count')
          .from(RoiProject, 'p')
          .where('p.owner_user_id = user.id')
          .andWhere('p.is_active = true')
          .andWhere('p.deleted_at IS NULL');
      }, 'project_count')
      .where('user.id IN (:...userIds)', { userIds })
      .orderBy('user.id', 'ASC')
      .addOrderBy('role.id', 'ASC')
      .addOrderBy('permission.id', 'ASC')
      .getRawMany();

    const userMap = new Map<number, any>();

    for (const row of rows) {
      const userId = Number(row.user_id);

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          id: userId,
          email: row.user_email,
          fullName: row.user_full_name,
          companyName: row.user_company_name,
          phone: row.user_phone,
          status: row.user_status,
          isActive: row.user_is_active,
          registrationMethod: row.user_registration_method,
          createdAt: row.user_created_at,
          updatedAt: row.user_created_at,
          roles: [],
          projectCount: Number(row.project_count || 0),
        });
      }

      const user = userMap.get(userId);

      if (row.role_id) {
        let role = user.roles.find((r) => r.id === Number(row.role_id));

        if (!role) {
          role = {
            id: Number(row.role_id),
            code: row.role_code,
            name: row.role_name,
            permissions: [],
          };
          user.roles.push(role);
        }

        if (row.permission_id) {
          const existedPermission = role.permissions.find(
            (p) => p.id === Number(row.permission_id),
          );

          if (!existedPermission) {
            role.permissions.push({
              id: Number(row.permission_id),
              code: row.permission_code,
            });
          }
        }
      }
    }

    const data = Array.from(userMap.values());

    return successResponse({
      message: 'Users retrieved successfully',
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    });
  }

  async findOne(id: number) {
    const userEntity = await this.usersRepository.findOne({
      where: { id, isActive: true },
      relations: ['createBy'],
    });

    if (!userEntity) {
      return successResponse({
        message: 'User not found',
        data: null,
      });
    }

    const rows = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin(UserRole, 'ur', 'ur.userId = user.id')
      .leftJoin(Role, 'role', 'role.id = ur.roleId')
      .leftJoin(RolePermission, 'rp', 'rp.roleId = role.id')
      .leftJoin(Permission, 'permission', 'permission.id = rp.permissionId')
      .leftJoinAndSelect('user.createBy', 'creator')

      .select([
        'role.id AS role_id',
        'role.code AS role_code',
        'role.name AS role_name',
        'permission.id AS permission_id',
        'permission.code AS permission_code',
      ])
      .where('user.id = :id', { id })
      .orderBy('role.id', 'ASC')
      .addOrderBy('permission.id', 'ASC')
      .getRawMany();

    const user: any = {
      ...userEntity,
      roles: [],
    };
    // Remove sensitive/unwanted fields if any
    delete user.passwordHash;
    if (user.createBy) {
      user.createBy = {
        id: user.createBy.id,
        email: user.createBy.email,
        fullName: user.createBy.fullName,
      };
    }
    user.registrationMethod = user.createBy?.fullName || user.fullName || 'SELF';

    for (const row of rows) {
      if (row.role_id) {
        let role = user.roles.find((r) => r.id === Number(row.role_id));
        if (!role) {
          role = {
            id: Number(row.role_id),
            code: row.role_code,
            name: row.role_name,
            permissions: [],
          };
          user.roles.push(role);
        }
        if (row.permission_id) {
          const existedPermission = role.permissions.find(
            (p) => p.id === Number(row.permission_id),
          );
          if (!existedPermission) {
            role.permissions.push({
              id: Number(row.permission_id),
              code: row.permission_code,
            });
          }
        }
      }
    }

    return successResponse({
      message: 'User retrieved successfully',
      data: user,
    });
  }

  async findOneUser(id: number) {
    const userEntity = await this.usersRepository.findOne({
      where: { id, isActive: true },
      relations: ['createBy'],
    });

    if (!userEntity) {
      return successResponse({
        message: 'User not found',
        data: null,
      });
    }

    const rows = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin(UserRole, 'ur', 'ur.userId = user.id')
      .leftJoin(Role, 'role', 'role.id = ur.roleId')
      .leftJoin(RolePermission, 'rp', 'rp.roleId = role.id')
      .leftJoin(Permission, 'permission', 'permission.id = rp.permissionId')
      .leftJoinAndSelect('user.createBy', 'creator')

      .select([
        'role.id AS role_id',
        'role.code AS role_code',
        'role.name AS role_name',
        'permission.id AS permission_id',
        'permission.code AS permission_code',
      ])
      .where('user.id = :id', { id })
      .orderBy('role.id', 'ASC')
      .addOrderBy('permission.id', 'ASC')
      .getRawMany();

    const user: any = {
      ...userEntity,
      roles: [],
    };
    // Remove sensitive/unwanted fields if any
    delete user.passwordHash;
    if (user.createBy) {
      user.createBy = {
        id: user.createBy.id,
        email: user.createBy.email,
        fullName: user.createBy.fullName,
      };
    }
    user.registrationMethod = user.createBy?.fullName || user.fullName || 'SELF';

    for (const row of rows) {
      if (row.role_id) {
        let role = user.roles.find((r) => r.id === Number(row.role_id));
        if (!role) {
          role = {
            id: Number(row.role_id),
            code: row.role_code,
            name: row.role_name,
            permissions: [],
          };
          user.roles.push(role);
        }
        if (row.permission_id) {
          const existedPermission = role.permissions.find(
            (p) => p.id === Number(row.permission_id),
          );
          if (!existedPermission) {
            role.permissions.push({
              id: Number(row.permission_id),
              code: row.permission_code,
            });
          }
        }
      }
    }

    return successResponse({
      message: 'User retrieved successfully',
      data: user,
    });
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const { fullName, companyName, phone } = dto;
    const updateData: any = {
      fullName,
    };

    if (companyName != null) updateData.companyName = companyName;
    if (phone != null) updateData.phone = phone;

    await this.usersRepository.update(userId, updateData);

    const { data: updatedUser } = await this.findOne(userId);
    return successResponse({
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  }

  async updateRole(id: number, dto: UpdateUserRoleDto, currentUser: any) {
    const { roleId } = dto;

    const targetUser = await this.usersRepository.findOne({
      where: { id, isActive: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const role = await this.rolesRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const userRole = await this.userRolesRepository.findOne({
      where: { userId: id },
    });

    if (userRole) {
      await this.userRolesRepository.update({ userId: id }, { roleId });
    } else {
      await this.userRolesRepository.insert({ userId: id, roleId });
    }

    await this.activityLogsService.create({
      userId: currentUser.id || currentUser.sub,
      username: currentUser.fullName || currentUser.email,
      action: 'UPDATE_ROLE',
      status: 'SUCCESS',
      desc: `Admin updated role for user: ${targetUser.fullName || targetUser.email} to role: ${role.name}`,
    });

    const { data: updatedUser } = await this.findOne(id);
    return successResponse({
      message: 'User role updated successfully',
      data: updatedUser,
    });
  }

  async updateProfileUser(userId: number, dto: UpdateProfileDto) {
    const { fullName, companyName, phone } = dto;
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (phone !== undefined) updateData.phone = phone;

    if (Object.keys(updateData).length > 0) {
      await this.usersRepository.update(userId, updateData);
    }

    const response = await this.findOne(userId);
    return successResponse({
      message: 'Profile updated successfully',
      data: response.data,
    });
  }

  async remove(id: number, currentUser: any) {
    const user = await this.usersRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive === false) {
      throw new BadRequestException('User already deleted');
    }

    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({
        isActive: false,
        deletedAt: new Date(),
      })
      .where('id = :id', { id })
      .execute();

    await this.activityLogsService.create({
      userId: currentUser.id || currentUser.sub,
      username: currentUser.fullName || currentUser.email,
      action: 'DELETE_USER',
      status: 'SUCCESS',
      desc: `Admin deleted user: ${user.fullName || user.email || id}`,
    });

    return successResponse({
      message: 'User soft-deleted successfully',
      data: result,
    });
  }

  async restoreUser(id: number, currentUser: any) {
    const user = await this.usersRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive === true) {
      throw new BadRequestException('User is already active');
    }

    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({
        isActive: true,
        deletedAt: null as any,
      })
      .where('id = :id', { id })
      .execute();

    await this.activityLogsService.create({
      userId: currentUser.id || currentUser.sub,
      username: currentUser.fullName || currentUser.email,
      action: 'RESTORE_USER',
      status: 'SUCCESS',
      desc: `Admin restored user: ${user.fullName || user.email || id}`,
    });

    return successResponse({
      message: 'User restored successfully',
      data: result,
    });
  }
}
