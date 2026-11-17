import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Project } from '../models/Project.js';
import { Environment } from '../models/Environment.js';
import { FeatureFlag } from '../models/FeatureFlag.js';
import { FlagEnvironmentConfig } from '../models/FlagEnvironmentConfig.js';
import { AuditLog } from '../models/AuditLog.js';
import { EvaluationMetric } from '../models/EvaluationMetric.js';
import { logger } from '../utils/logger.js';

export async function ensureIndexes(): Promise<void> {
  try {
    await Promise.all([
      User.syncIndexes(),
      Organization.syncIndexes(),
      OrganizationMember.syncIndexes(),
      Project.syncIndexes(),
      Environment.syncIndexes(),
      FeatureFlag.syncIndexes(),
      FlagEnvironmentConfig.syncIndexes(),
      AuditLog.syncIndexes(),
      EvaluationMetric.syncIndexes(),
    ]);
    logger.info('Database indexes synchronized successfully');
  } catch (error) {
    logger.warn('Index synchronization notice:', error);
  }
}
