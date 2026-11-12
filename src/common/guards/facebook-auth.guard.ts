// facebook-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Trả null thay vì redirect — để controller xử lý
    if (err || !user) return null;
    return user;
  }
}