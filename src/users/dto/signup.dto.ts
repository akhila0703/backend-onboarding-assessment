import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsEnum } from 'class-validator';
import { UserRole } from '../user.entity';

export class SignupDto {

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  full_name: string;

  @IsEmail({}, { message: 'Enter valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain uppercase, lowercase and number',
  })
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}