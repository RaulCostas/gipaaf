import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@gipaaf.com' })
    @IsNotEmpty({ message: 'El correo o nombre de usuario es requerido' })
    @IsString()
    email: string;

    @ApiProperty({ example: 'Admin123!' })
    @IsString()
    @MinLength(4)
    password: string;
}
