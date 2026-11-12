import { Injectable } from '@nestjs/common';
import { CreateRoiFieldDefinitionDto } from './dto/create-roi-field-definition.dto';
import { UpdateRoiFieldDefinitionDto } from './dto/update-roi-field-definition.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RoiFieldDefinition } from './entities/roi-field-definition.entity';
import { Repository } from 'typeorm';
import { successResponse } from 'src/common/response';

@Injectable()
export class RoiFieldDefinitionsService {
  constructor(
    @InjectRepository(RoiFieldDefinition)
    private roiFieldDefinitionRepo: Repository<RoiFieldDefinition>,
  ) {}

  async create(dto: CreateRoiFieldDefinitionDto) {
    const entity = this.roiFieldDefinitionRepo.create(dto);
    return this.roiFieldDefinitionRepo.save(entity);
  }

  async findAll() {
    const data = await this.roiFieldDefinitionRepo.find({
      order: { sortOrder: 'ASC' },
    });
    return successResponse({
      message: 'ROI Field Definitions retrieved successfully',
      data,
    });
  }

  async findOne(id: number) {
    const data = await this.roiFieldDefinitionRepo.findOne({ where: { id } });

    if (!data) {
      throw new Error('ROI Field Definition not found');
    }

    return successResponse({
      message: 'ROI Field Definition retrieved successfully',
      data,
    });
  }

  async update(id: number, dto: UpdateRoiFieldDefinitionDto) {
    const entity = this.roiFieldDefinitionRepo.create({ id, ...dto });
    await this.roiFieldDefinitionRepo.save(entity);

    return successResponse({
      message: 'ROI Field Definition updated successfully',
      data: entity,
    });
  }

  async remove(id: number) {
    const entity = await this.roiFieldDefinitionRepo.findOne({ where: { id } });

    if (!entity) {
      throw new Error('ROI Field Definition not found');
    }

    await this.roiFieldDefinitionRepo.remove(entity);

    return successResponse({
      message: 'ROI Field Definition removed successfully',
      data: entity,
    });
  }
}
