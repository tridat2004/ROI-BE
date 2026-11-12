import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateRoiProjectVersionDto {
  @IsNumber()
  @IsNotEmpty()
  projectId: number;
}
