import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogsService } from '../../modules/activity-logs/activity-logs.service';
import { ACTIVITY_LOG_KEY } from '../decorators/activity-log.decorator';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private readonly activityLogsService: ActivityLogsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is authenticated or it's a GET request, we don't log via interceptor
    if (!user || request.method === 'GET') {
      return next.handle();
    }

    const reflectorDescription = this.reflector.getAllAndOverride<string>(
      ACTIVITY_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );
    const description = reflectorDescription || `${request.method} ${request.url}`;

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Extract entity name from response data or request body
          const data = response?.data;
          const entityName = 
            data?.projectName || 
            data?.fullName || 
            data?.name || 
            data?.title ||
            request.body?.projectName || 
            request.body?.fullName || 
            request.body?.name ||
            request.body?.title;

          let finalDesc = description;
          if (entityName && typeof entityName === 'string') {
            if (finalDesc.includes('{name}')) {
              finalDesc = finalDesc.replace('{name}', entityName);
            } else if (!finalDesc.includes(entityName)) {
              finalDesc = `${finalDesc}: ${entityName}`;
            }
          }

          let actionName = reflectorDescription || `${request.method} ${request.url}`;
          
          this.activityLogsService.create({
            userId: user.id || user.sub,
            username: user.fullName || user.email || user.username || `User #${user.id || user.sub}`,
            action: actionName,
            ip: request.ip,
            status: 'SUCCESS',
            desc: finalDesc,
          }).catch((err) => console.error('Failed to save activity log:', err));
        },
        error: (error) => {
          let errorMessage = error.message;

          // Extract detailed message from NestJS HttpException if available
          if (typeof error.getResponse === 'function') {
            const response = error.getResponse();
            if (response && typeof response === 'object' && response.message) {
              errorMessage = Array.isArray(response.message)
                ? response.message.join(', ')
                : response.message;
            } else if (typeof response === 'string') {
              errorMessage = response;
            }
          }

          let actionName = reflectorDescription || `${request.method} ${request.url}`;

          this.activityLogsService
            .create({
              userId: user.id || user.sub,
              username: user.fullName || user.email || user.username || `User #${user.id || user.sub}`,
              action: actionName,
              ip: request.ip,
              status: 'FAILURE',
              desc: errorMessage,
            })
            .catch((err) => console.error('Failed to save activity log:', err));
        },
      }),
    );
  }
}
