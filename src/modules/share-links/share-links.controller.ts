import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ShareLinksService } from './share-links.service';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { UpdateShareLinkDto } from './dto/update-share-link.dto';

import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('share-links')
@ActivityLog('Share Link Management')
export class ShareLinksController {
  constructor(private readonly shareLinksService: ShareLinksService) {}

  @Post()
  @ActivityLog('Create project share link')
  create(
    @Body() createShareLinkDto: CreateShareLinkDto,
    @GetUser() user: User,
  ) {
    return this.shareLinksService.create(createShareLinkDto, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.shareLinksService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.shareLinksService.findOne(+id, user);
  }

  @Patch(':id')
  @ActivityLog('Update project share link')
  update(
    @Param('id') id: string,
    @Body() updateShareLinkDto: UpdateShareLinkDto,
    @GetUser() user: User,
  ) {
    return this.shareLinksService.update(+id, updateShareLinkDto, user);
  }

  @Delete(':id')
  @ActivityLog('Delete project share link')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.shareLinksService.remove(+id, user);
  }
}
