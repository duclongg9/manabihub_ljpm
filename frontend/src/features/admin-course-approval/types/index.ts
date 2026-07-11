export interface CourseApproval {
  id: string;
  courseName: string;
  teacherName: string;
  teacherEmail: string;
  submittedAt: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'REQUEST_CORRECTION';
}

export interface CourseApprovalDetail extends CourseApproval {
  curriculumSummary: string;
  lessonBlocksCount: number;
  finalTestIncluded: boolean;
  policyEvidence: string;
}

export interface ReviewActionPayload {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION';
  reason?: string;
}
