import type { EntityManager } from 'typeorm'
import type { UserDto } from '../../shared/ipc'
import type { SessionUser } from '../auth/session'
import { getDataSource } from '../database/data-source'
import { User } from '../database/entities'
import { AppError } from '../errors'
import { hashPassword } from '../utils/password'
import { recordAudit } from './audit.service'
import { toUserDto } from './user.mapper'
import { asBoolean, asId, asObject, asPassword, asRole, asText, asUsername } from './validation'

// Only an owner may create, edit or reset another owner.
function assertCanManage(actor: SessionUser, targetRole: User['role']): void {
  if (targetRole === 'owner' && actor.role !== 'owner') throw new AppError('FORBIDDEN')
}

async function countOtherActiveOwners(manager: EntityManager, userId: number): Promise<number> {
  return manager
    .getRepository(User)
    .createQueryBuilder('user')
    .where('user.role = :role', { role: 'owner' })
    .andWhere('user.is_active = 1')
    .andWhere('user.id != :userId', { userId })
    .getCount()
}

export async function listUsers(): Promise<UserDto[]> {
  const users = await getDataSource().getRepository(User).find({ order: { id: 'ASC' } })
  return users.map(toUserDto)
}

export async function createUser(payload: unknown, actor: SessionUser): Promise<UserDto> {
  const input = asObject(payload)
  const fullName = asText(input.fullName, 'fullName')
  const username = asUsername(input.username)
  const password = asPassword(input.password)
  const role = asRole(input.role)
  assertCanManage(actor, role)

  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(User)
    if (await repository.existsBy({ username })) throw new AppError('USERNAME_TAKEN')

    const user = await repository.save(
      repository.create({ fullName, username, role, passwordHash: hashPassword(password) })
    )
    await recordAudit(
      {
        userId: actor.id,
        action: 'create_user',
        entityType: 'user',
        entityId: user.id,
        details: { username, role }
      },
      manager
    )
    // Reload so database defaults (is_active, created_at) are populated.
    return toUserDto(await repository.findOneByOrFail({ id: user.id }))
  })
}

export async function updateUser(payload: unknown, actor: SessionUser): Promise<UserDto> {
  const input = asObject(payload)
  const id = asId(input.id)
  const fullName = asText(input.fullName, 'fullName')
  const role = asRole(input.role)
  const isActive = asBoolean(input.isActive, 'isActive')

  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(User)
    const user = await repository.findOneBy({ id })
    if (!user) throw new AppError('NOT_FOUND')

    assertCanManage(actor, user.role)
    assertCanManage(actor, role)

    // Nobody can lock themselves out or change their own role.
    if (user.id === actor.id && (!isActive || role !== user.role)) {
      throw new AppError('SELF_LOCKOUT')
    }
    // The shop must always keep at least one active owner.
    const losesOwner = user.role === 'owner' && user.isActive && (role !== 'owner' || !isActive)
    if (losesOwner && (await countOtherActiveOwners(manager, user.id)) === 0) {
      throw new AppError('LAST_OWNER')
    }

    const before = { fullName: user.fullName, role: user.role, isActive: user.isActive }
    Object.assign(user, { fullName, role, isActive })
    await repository.save(user)
    await recordAudit(
      {
        userId: actor.id,
        action: 'update_user',
        entityType: 'user',
        entityId: user.id,
        details: { before, after: { fullName, role, isActive } }
      },
      manager
    )
    return toUserDto(user)
  })
}

export async function resetPassword(payload: unknown, actor: SessionUser): Promise<null> {
  const input = asObject(payload)
  const id = asId(input.id)
  const newPassword = asPassword(input.newPassword, 'newPassword')

  await getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(User)
    const user = await repository.findOneBy({ id })
    if (!user) throw new AppError('NOT_FOUND')
    assertCanManage(actor, user.role)

    user.passwordHash = hashPassword(newPassword)
    await repository.save(user)
    await recordAudit(
      { userId: actor.id, action: 'reset_password', entityType: 'user', entityId: user.id },
      manager
    )
  })
  return null
}
