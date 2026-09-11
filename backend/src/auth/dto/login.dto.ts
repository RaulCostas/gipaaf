import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@gipaaf.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Admin123!' })
    @IsString()
    @MinLength(4)
    password: string;
}
