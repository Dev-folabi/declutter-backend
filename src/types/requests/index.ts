
export interface UserRequest {
    fullName: string;
    email: string;
    password: string;
    schoolId: string;
    role: string;
    schoolIdCard?: string;
    nin?: string;
    accountNumber?: string;
    bankCode?: string;
    pin?: string;
  }