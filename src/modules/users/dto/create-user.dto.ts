import { IsEmail, IsString, MinLength, IsOptional, MaxLength, IsNumberString, IsIn, Matches, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'test@gmail.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Password@123' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
        {
            message:
                'Password must include uppercase, lowercase, number and special character',
        },
    )
    password: string;

    @ApiProperty({ example: 'John Doe' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ example: 'Cinmas' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    companyName?: string;

    @ApiProperty({ example: '1234567890' })
    @IsNumberString({}, { message: 'Phone must contain only numbers' })
    @IsOptional()
    @MaxLength(20)
    phone?: string;

    @ApiProperty({ example: 'admin' })
    @IsString()
    @IsOptional()
    @IsIn(['admin', 'manager', 'sales', 'viewer'], { message: 'Role must be one of: admin, manager, sales, viewer' })
    role?: string;
}
