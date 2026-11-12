import { SetMetadata } from '@nestjs/common';

export const ACTIVITY_LOG_KEY = 'activity_log';
export const ActivityLog = (description: string) =>
  SetMetadata(ACTIVITY_LOG_KEY, description);
