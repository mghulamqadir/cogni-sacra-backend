import 'dotenv/config';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { UserRole, UserStatus } from '../types/index.js';
import mongoose from 'mongoose';
async function main() {
  await connectDatabase();
  const result = await User.collection.updateMany(
    { $or: [{ role: { $in: ['user', 'admin'] } }, { role: { $exists: false } }] },
    {
      $set: { role: UserRole.Learner, status: UserStatus.PendingInstitution },
      $unset: { institutionId: true },
    }
  );
  process.stdout.write(`Migrated ${result.modifiedCount} users\n`);
  await mongoose.disconnect();
}
main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exitCode = 1;
});
