import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivityLog } from './entities/activity-log.entity';
import { successResponse } from 'src/common/response';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async create(data: Partial<ActivityLog>): Promise<ActivityLog> {
    const log = this.activityLogRepository.create(data);
    return await this.activityLogRepository.save(log);
  }

  async findAll(options: {
    page: number;
    limit: number;
    userId?: number;
    action?: string;
    username?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page, limit, userId, action, username, startDate, endDate } = options;
    const qb = this.activityLogRepository.createQueryBuilder('log');
    qb.leftJoin('log.user', 'user')
      .addSelect(['user.id', 'user.email', 'user.fullName']);

    if (userId) {
      qb.andWhere('log.userId = :userId', { userId });
    }

    if (action) {
      qb.andWhere('log.action LIKE :action', { action: `%${action}%` });
    }

    if (username) {
      qb.andWhere(
        '(user.fullName ILIKE :username OR user.email ILIKE :username OR log.username ILIKE :username)',
        { username: `%${username}%` },
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('log.createAt >= :startDate', { startDate: start.toISOString() });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('log.createAt <= :endDate', { endDate: end.toISOString() });
    }

    qb.orderBy('log.createAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [items, total] = await qb.getManyAndCount();
    
    // Map username from user's fullName and normalize description (desc)
    const formattedItems = items.map(log => {
      let desc = log.desc || '';
      
      // 1. Handle URL-based descriptions (old logs without @ActivityLog)
      if (desc.startsWith('GET /') || desc.startsWith('POST /') || desc.startsWith('PATCH /') || desc.startsWith('DELETE /')) {
        let action = 'View';
        if (desc.startsWith('POST ')) action = 'Create';
        else if (desc.startsWith('PATCH ') || desc.startsWith('PUT ')) action = 'Update';
        else if (desc.startsWith('DELETE ')) action = 'Delete';

        let entitySuffix = '';
        const colonIdx = desc.indexOf(': ');
        if (colonIdx !== -1) {
          entitySuffix = desc.substring(colonIdx); // ": John Doe"
          desc = desc.substring(0, colonIdx); // URL part
        }

        if (desc.includes('/api/v1/activity-logs')) desc = 'Activity logs';
        else if (desc.includes('/api/v1/auth/profile')) desc = 'User profile';
        else if (desc.includes('/api/v1/roi-projects')) desc = 'ROI Project';
        else if (desc.includes('/api/v1/roi-project-versions')) desc = 'ROI Project Version';
        else if (desc.includes('/api/v1/roi-metrics')) desc = 'ROI Metrics';
        else if (desc.includes('/api/v1/roi-field-definitions')) desc = 'ROI Field Definition';
        else if (desc.includes('/api/v1/roi-field-values')) desc = 'ROI Field Value';
        else if (desc.includes('/api/v1/roi-scenarios')) desc = 'ROI Scenario';
        else if (desc.includes('/api/v1/roi-version-scenarios')) desc = 'ROI Version Scenario';
        else if (desc.includes('/api/v1/roi-cashflows')) desc = 'ROI Cashflow';
        else if (desc.includes('/api/v1/roi-chart-points')) desc = 'ROI Chart Point';
        else if (desc.includes('/api/v1/users')) desc = 'User Account';
        else if (desc.includes('/api/v1/roles')) desc = 'Role';
        else if (desc.includes('/api/v1/permissions')) desc = 'Permission';
        else if (desc.includes('/api/v1/share-links')) desc = 'Share Link';
        else if (desc.includes('/api/v1/export-jobs')) desc = 'Export Job';
        else if (desc.includes('/api/v1/audit-logs')) desc = 'System Audit Log';
        else {
          // Generic fallback for any other v1 APIs
          const apiMatch = desc.match(/\/api\/v1\/([a-zA-Z0-9-]+)/);
          if (apiMatch && apiMatch[1]) {
            const moduleName = apiMatch[1].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            desc = `${moduleName}`;
          } else {
            desc = 'System';
          }
        }
        desc = `${action} ${desc}${entitySuffix}`;
      } 
      // 2. Handle known Vietnamese descriptions (from previous versions of decorators)
      else {
        // Handle error strings like "Description (Error: message)"
        let errorPart = '';
        let baseDesc = desc;
        if (desc.includes(' (Error: ')) {
          const parts = desc.split(' (Error: ');
          baseDesc = parts[0];
          errorPart = ` (Error: ${parts[1]}`;
        }

        const viToEnMap: Record<string, string> = {
          'Nhật ký hoạt động': 'Activity Logs',
          'Xem nhật ký hoạt động hệ thống': 'View system activity logs',
          'Xem nhật ký hoạt động của người dùng': 'View user activity logs',
          'Quản lý người dùng': 'User Management',
          'Admin tạo người dùng mới': 'Admin created new user',
          'Admin xem chi tiết người dùng': 'Admin viewed user details',
          'Cập nhật thông tin cá nhân': 'Update personal profile',
          'Cập nhật quyền hạn/vai trò người dùng': 'Update user roles/permissions',
          'Xóa tài khoản người dùng': 'Delete user account',
          'Khôi phục tài khoản người dùng': 'Restore user account',
          'Xác thực & Tài khoản': 'Authentication & Account',
          'Quản lý dự án ROI': 'ROI Project Management',
          'Tạo dự án ROI mới': 'Create new ROI project',
          'Xem danh sách dự án ROI': 'View ROI projects list',
          'Xem Dashboard dự án': 'View Project Dashboard',
          'Xem chi tiết dự án ROI': 'View ROI project details',
          'Cập nhật thông tin dự án ROI': 'Update ROI project information',
          'Xóa dự án ROI': 'Delete ROI project',
          'Quản lý phiên bản dự án': 'ROI Project Version Management',
          'Tạo phiên bản dự án mới': 'Create new ROI project version',
          'Xem danh sách phiên bản của dự án': 'View project versions list',
          'Xem chi tiết phiên bản dự án': 'View ROI project version details',
          'Cập nhật nội dung phiên bản dự án': 'Update ROI project version content',
          'Xóa phiên bản dự án': 'Delete ROI project version',
          'Quản lý vai trò (Role)': 'Role Management',
          'Tạo vai trò (Role) mới': 'Create new role',
          'Cập nhật thông tin vai trò (Role)': 'Update role information',
          'Xóa vai trò (Role)': 'Delete role',
          'Quản lý quyền hạn (Permission)': 'Permission Management',
          'Tạo quyền hạn (Permission) mới': 'Create new permission',
          'Cập nhật thông tin quyền hạn (Permission)': 'Update permission information',
          'Xóa quyền hạn (Permission)': 'Delete permission',
          'Quản lý giá trị trường ROI': 'ROI Field Value Management',
          'Lưu giá trị đầu vào ROI': 'Save ROI input values',
          'Tạo phiên bản mới từ giá trị đầu vào hiện tại': 'Create new version from current inputs',
          'Xem dữ liệu đầu vào của phiên bản dự án': 'View ROI project version input data',
          'Cập nhật giá trị đầu vào ROI': 'Update ROI input values',
          'Xóa giá trị đầu vào ROI': 'Delete ROI input values',
          'Quản lý kịch bản ROI': 'ROI Scenario Management',
          'Tạo kịch bản (Scenario) ROI mới': 'Create new ROI scenario',
          'Cập nhật thông tin kịch bản (Scenario) ROI': 'Update ROI scenario information',
          'Xóa kịch bản (Scenario) ROI': 'Delete ROI scenario',
          'Quản lý dòng tiền (Cashflow)': 'ROI Cashflow Management',
          'Tạo dòng tiền (Cashflow) cho phiên bản': 'Create ROI cashflow for version',
          'Xóa dòng tiền (Cashflow)': 'Delete ROI cashflow',
          'Quản lý điểm dữ liệu đồ thị (Chart Point)': 'ROI Chart Point Management',
          'Tạo điểm dữ liệu đồ thị (Chart Point)': 'Create ROI chart point',
          'Xóa điểm dữ liệu đồ thị (Chart Point)': 'Delete ROI chart point',
          'Quản lý liên kết chia sẻ': 'Share Link Management',
          'Tạo liên kết chia sẻ dự án': 'Create project share link',
          'Xóa liên kết chia sẻ dự án': 'Delete project share link',
          'Quản lý xuất báo cáo': 'Export Jobs Management',
          'Tạo yêu cầu xuất báo cáo': 'Create export report request',
          'Xem trạng thái yêu cầu xuất báo cáo': 'View export report status',
          'Hủy yêu cầu xuất báo cáo': 'Cancel export report request',
          'Quản lý nhật ký hệ thống (Audit Log)': 'System Audit Log Management',
          'Hệ thống': 'System',
          'Gán vai trò cho người dùng': 'Assign role to user',
          'Thu hồi vai trò của người dùng': 'Revoke user role',
          'Gán quyền hạn cho vai trò': 'Assign permission to role',
          'Thu hồi quyền hạn của vai trò': 'Revoke permission from role',
          'Quản lý chỉ số ROI': 'ROI Metrics Management',
          'Tính toán các chỉ số ROI': 'Calculate ROI metrics',
          'Xem báo cáo tổng hợp ROI': 'View ROI summary report',
          'Xem kết quả tính toán ROI theo phiên bản': 'View ROI calculation results by version',
          'So sánh các phiên bản ROI': 'Compare ROI versions',
          'Tính toán lại các chỉ số ROI': 'Recalculate ROI metrics',
        };

        if (viToEnMap[baseDesc]) {
          desc = viToEnMap[baseDesc] + errorPart;
        }
      }

      return {
        ...log,
        username: log.user?.fullName || log.username || log.user?.email || 'N/A',
        desc: desc
      };
    });

    return successResponse({
      message: 'Activity logs fetched successfully',
      data: formattedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanupOldLogs() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const result = await this.activityLogRepository.delete({
      createAt: LessThan(threeMonthsAgo),
    });

    if (result.affected && result.affected > 0) {
      console.log(
        `[ActivityLogsService] Automatically deleted ${result.affected} old activity logs (older than 3 months).`,
      );
    }
  }
}
