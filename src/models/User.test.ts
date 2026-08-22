import test from 'node:test';
import assert from 'node:assert/strict';
import { User } from './User.js';
import { UserRole, UserStatus } from '../types/index.js';

test('active institutional users require an institution', () => {
  const user = new User({
    name: 'Learner',
    email: 'learner@example.com',
    role: UserRole.Learner,
    status: UserStatus.Active,
  });
  assert.ok(user.validateSync()?.errors['institutionId']);
});

test('independent learners cannot retain a tenant identifier', () => {
  const user = new User({
    name: 'Independent',
    email: 'independent@example.com',
    role: UserRole.IndependentLearner,
    status: UserStatus.Active,
    institutionId: '507f1f77bcf86cd799439011',
  });
  user.validateSync();
  assert.equal(user.institutionId, undefined);
});
