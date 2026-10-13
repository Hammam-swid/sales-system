import type { UserDto } from '../../shared/ipc'
import type { User } from '../database/entities'

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString()
  }
}
