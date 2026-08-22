import 'dotenv/config';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { UserRole, UserStatus } from '../types/index.js';
import { hashPassword } from '../utils/user.helpers.js';
import mongoose from 'mongoose';
async function main() {
  const email = process.env['PLATFORM_ADMIN_EMAIL']?.trim().toLowerCase();
  const password = process.env['PLATFORM_ADMIN_PASSWORD'];
  const name = process.env['PLATFORM_ADMIN_NAME']?.trim() || 'Platform Admin';
  if (!email || !password || password.length < 12)
    throw new Error(
      'PLATFORM_ADMIN_EMAIL and a 12+ character PLATFORM_ADMIN_PASSWORD are required'
    );
  await connectDatabase();
  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    existing.role = UserRole.PlatformAdmin;
    existing.status = UserStatus.Active;
    existing.institutionId = undefined;
    existing.isEmailVerified = true;
    if (!existing.password) existing.password = await hashPassword(password);
    await existing.save();
  } else
    await User.create({
      name,
      email,
      password: await hashPassword(password),
      role: UserRole.PlatformAdmin,
      status: UserStatus.Active,
      isEmailVerified: true,
    });
  process.stdout.write(`Platform admin ready: ${email}\n`);
  await mongoose.disconnect();
}
main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
