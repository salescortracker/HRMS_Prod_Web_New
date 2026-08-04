export interface BreakPolicy {
  breakPolicyId: number;

  companyId: number;
  regionId: number;
  userId: number;

  policyCode: string;
  policyName: string;
  breakType: string;

  durationMinutes: number;
  maxBreaksPerDay: number;
  graceMinutes: number;

  shiftId: number;

  isActive: boolean;
  isDeleted: boolean;

  createdBy?: number;
  createdDate?: Date;

  updatedBy?: number;
  updatedDate?: Date;
}