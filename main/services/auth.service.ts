import type { UserDto } from "../../shared/ipc";
import {
  clearSession,
  getSession,
  setSession,
  type SessionUser,
} from "../auth/session";
import { getDataSource } from "../database/data-source";
import { User } from "../database/entities";
import { AppError } from "../errors";
import { hashPassword, verifyPassword } from "../utils/password";
import { recordAudit } from "./audit.service";
import { toUserDto } from "./user.mapper";
import { asObject, asPassword } from "./validation";

// Verified against when the username does not exist, so both failure paths cost the same time.
const DUMMY_HASH = hashPassword("not-a-real-password");

export async function login(payload: unknown): Promise<UserDto> {
  const input = asObject(payload);
  const username =
    typeof input.username === "string"
      ? input.username.trim().toLowerCase()
      : "";
  const password = typeof input.password === "string" ? input.password : "";

  const user = await getDataSource()
    .getRepository(User)
    .findOneBy({ username });
  const passwordMatches = verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  // One message for "no such user" and "wrong password": never reveal which usernames exist.
  if (!user || !passwordMatches) throw new AppError("INVALID_CREDENTIALS");
  if (!user.isActive) throw new AppError("ACCOUNT_DISABLED");

  setSession({ id: user.id, role: user.role });
  await recordAudit({
    userId: user.id,
    action: "login",
    entityType: "user",
    entityId: user.id,
  });
  return toUserDto(user);
}

export async function logout(): Promise<null> {
  const session = getSession();
  if (session) {
    await recordAudit({
      userId: session.id,
      action: "logout",
      entityType: "user",
      entityId: session.id,
    });
  }
  clearSession();
  return null;
}

export async function currentUser(): Promise<UserDto | null> {
  const session = getSession();
  if (!session) return null;
  const user = await getDataSource()
    .getRepository(User)
    .findOneBy({ id: session.id });
  if (!user || !user.isActive) {
    clearSession();
    return null;
  }
  return toUserDto(user);
}

export async function changeOwnPassword(
  payload: unknown,
  session: SessionUser,
): Promise<null> {
  const input = asObject(payload);
  const newPassword = asPassword(input.newPassword, "newPassword");

  const repository = getDataSource().getRepository(User);
  const user = await repository.findOneBy({ id: session.id });
  if (!user) throw new AppError("NOT_FOUND");
  if (
    typeof input.currentPassword !== "string" ||
    !verifyPassword(input.currentPassword, user.passwordHash)
  ) {
    throw new AppError("WRONG_PASSWORD");
  }

  user.passwordHash = hashPassword(newPassword);
  await repository.save(user);
  await recordAudit({
    userId: session.id,
    action: "change_password",
    entityType: "user",
    entityId: user.id,
  });
  return null;
}
