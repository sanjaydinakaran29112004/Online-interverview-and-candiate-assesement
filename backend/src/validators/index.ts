/**
 * Backend Request Validation Utilities
 */

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true };
};

export const validateJobPayload = (body: any): { isValid: boolean; message?: string } => {
  if (!body.title || !body.title.trim()) {
    return { isValid: false, message: 'Job title is required.' };
  }
  if (!body.companyName || !body.companyName.trim()) {
    return { isValid: false, message: 'Company name is required.' };
  }
  if (!body.description || !body.description.trim()) {
    return { isValid: false, message: 'Job description is required.' };
  }
  return { isValid: true };
};

export const validateInterviewPayload = (body: any): { isValid: boolean; message?: string } => {
  if (!body.applicationId) {
    return { isValid: false, message: 'applicationId is required.' };
  }
  if (!body.scheduledStartTime || !body.scheduledEndTime) {
    return { isValid: false, message: 'scheduledStartTime and scheduledEndTime are required.' };
  }
  const start = new Date(body.scheduledStartTime).getTime();
  const end = new Date(body.scheduledEndTime).getTime();
  if (isNaN(start) || isNaN(end) || start >= end) {
    return { isValid: false, message: 'scheduledStartTime must precede scheduledEndTime.' };
  }
  return { isValid: true };
};
