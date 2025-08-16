export interface UserData {
  userId: string;
  name: string;
  email: string;
  dashboardPublished: boolean;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
  dataCounts: UserDataCounts;
}

export interface UserDataCounts {
  bloodMarkers: number;
  healthProtocols: number;
  processingJobs: number;
  total: number;
}

export interface DeleteConfirmation {
  user: UserData | null;
  isOpen: boolean;
  confirmationText: string;
}

export interface AdminUsersResponse {
  success: boolean;
  users: UserData[];
  totalCount: number;
  error?: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    deletedUser: {
      userId: string;
      name?: string;
      email?: string;
    };
    mongodb: {
      total: number;
      breakdown: {
        users: number;
        bloodMarkers: number;
        healthProtocols: number;
        processingJobs: number;
      };
    };
    s3: {
      total: number;
      breakdown: {
        uploads: number;
        data: number;
        profileImages: number;
      };
    };
    errors: string[];
  };
}

export interface AdminStats {
  totalUsers: number;
  publishedDashboards: number;
  totalBloodMarkers: number;
  totalDataPoints: number;
}

export interface UseAdminAuthReturn {
  isAdmin: boolean;
  isLoading: boolean;
  session: any;
}

export interface UseUsersDataReturn {
  users: UserData[];
  loading: boolean;
  error: string | null;
  refetchUsers: () => Promise<void>;
  stats: AdminStats;
}

export interface UseDeleteUserReturn {
  deleteUser: (user: UserData) => Promise<void>;
  deletingUserId: string | null;
  deleteConfirmation: DeleteConfirmation;
  handleDeleteClick: (user: UserData) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
  updateConfirmationText: (text: string) => void;
}
