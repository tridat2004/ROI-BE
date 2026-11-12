import { Module } from '@nestjs/common';
import { ShareLinksService } from './share-links.service';
import { ShareLinksController } from './share-links.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareLink } from './entities/share-link.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShareLink, UserRole, Role])],
  controllers: [ShareLinksController],
  providers: [ShareLinksService],
  exports: [ShareLinksService],
})
export class ShareLinksModule {}
