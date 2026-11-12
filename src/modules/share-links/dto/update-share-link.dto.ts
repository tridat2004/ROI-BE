import { PartialType } from '@nestjs/mapped-types';
import { CreateShareLinkDto } from './create-share-link.dto';

export class UpdateShareLinkDto extends PartialType(CreateShareLinkDto) {}
