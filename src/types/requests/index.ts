
export interface UserRequest {
    fullName: string;
    email: string;
    password: string;
    schoolId: string;
    role: string;
    schoolIdCardURL?: string;
    nin?: string;
    accountNumber?: string;
    bankCode?: string;
    bankName?: string;
    pin?: string;
  }

  export interface AdminRequest {
    fullName: string;
    email: string;
    password: string;
    role: "SUPER_ADMIN" | "SUPPORT_AGENT";
  }