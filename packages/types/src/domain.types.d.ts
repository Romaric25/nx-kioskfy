export interface NewspaperItem {
    id: string;
    issueNumber: string;
    coverImage: string;
    price: string;
    status: "published" | "draft" | "pending" | "archived";
    publishDate: string;
    pdf?: string;
    autoPublish?: boolean;
    organization?: {
        id: string;
        name: string;
        slug?: string;
        logo?: string | null;
    } | null;
    country?: {
        id: number;
        name: string;
        slug: string;
        flag: string;
    } | null;
    categories?: {
        category: {
            id: number;
            name: string;
            slug: string;
            icon: string;
            color?: string;
        };
    }[];
    coverImageUpload?: {
        id: number;
        thumbnailUrl: string;
        filename: string;
    } | null;
    pdfUpload?: {
        id: number;
        filename: string;
    } | null;
}
export interface CreateNewspaperInput {
    issueNumber: string;
    publishDate: string;
    price: number;
    status: "published" | "draft";
    organizationId: string;
    country: string;
    categoryIds?: number[];
    coverImageUploadId?: number | null;
    pdfUploadId?: number | null;
    autoPublish?: boolean;
}
export interface UpdateNewspaperInput {
    issueNumber?: string;
    publishDate?: string;
    price?: number;
    status?: "published" | "draft" | "pending" | "archived";
    organizationId?: string;
    country?: string;
    categoryIds?: number[];
    coverImageUploadId?: number | null;
    pdfUploadId?: number | null;
}
export interface OrderItem {
    id: string;
    userId: string | null;
    newspaperId: string;
    price: string;
    status: "pending" | "completed" | "failed" | "refunded";
    paymentId: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface AdminOrderResponse {
    id: string;
    userId: string | null;
    newspaperId: string;
    price: string;
    status: string;
    paymentId: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    user?: {
        name: string | null;
        email: string;
        image: string | null;
    } | null;
    newspaper?: {
        id: string;
        issueNumber: string;
        coverImage: string;
        price: string;
        publishDate: Date | string;
        organization: {
            id: string;
            name: string;
        } | null;
    } | null;
}
export interface CreateOrderInput {
    newspaperId: string;
    price: number;
}
export interface BatchOrderInput {
    orders: CreateOrderInput[];
}
export interface OrganizationItem {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    email?: string | null;
    phone: string;
    country: string;
    address: string;
    description: string;
    price?: number | null;
    suspended?: boolean;
    metadata?: Record<string, unknown> | string | null;
    logoUpload?: {
        id: number;
        filename: string;
        thumbnailUrl: string;
    } | null;
}
export interface PublicAgency {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    country: string;
    description: string;
    metadata: Record<string, unknown> | string | null;
    logoUpload?: {
        id: number;
        filename: string;
        thumbnailUrl: string;
    } | null;
}
export interface CreateOrganizationInput {
    name: string;
    slug: string;
    email: string;
    phone: string;
    country: string;
    address: string;
    description: string;
    price?: number;
    metadata?: string;
    logoFile?: File;
    logoUploadId?: number;
}
export interface UpdateOrganizationInput {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    address?: string;
    description?: string;
    price?: number;
    metadata?: string;
    logoFile?: File;
    logoUploadId?: number;
}
export type WithdrawalStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export interface WithdrawalItem {
    id: number;
    organizationId: string;
    amount: number;
    currency: string;
    status: WithdrawalStatus;
    paymentMethod: string | null;
    paymentDetails: string | null;
    externalReference: string | null;
    userId: string | null;
    notes: string | null;
    requestedAt: string;
    user?: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    organization?: {
        id: string;
        name: string;
        slug: string;
    };
}
export interface CreateWithdrawalInput {
    organizationId: string;
    amount: number;
    paymentMethod?: string;
    paymentDetails?: string;
    notes?: string;
    currency?: string;
    externalReference?: string;
    status?: WithdrawalStatus;
    userId?: string;
}
export interface CategoryItem {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color?: string;
}
export interface CountryItem {
    id: number;
    name: string;
    slug: string;
    flag: string;
    currency: string;
    code: string;
    host?: string | null;
}
export interface CountryWithFavoriteStatus extends CountryItem {
    isFavorite: boolean;
}
export interface UserProfile {
    id: string;
    name: string;
    lastName: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    phone: string | null;
    role?: string | null;
    typeUser?: string;
    isActive: boolean;
    banned?: boolean;
    createdAt: string;
}
export interface UploadItem {
    id: number;
    filename: string;
    thumbnailS3Key: string;
    thumbnailUrl: string;
}
export interface PresignedUploadResult {
    id: number;
    s3Key: string;
    url: string;
    filename: string;
    thumbnailS3Key?: string;
    thumbnailUrl?: string;
}
export interface SiteSetting {
    key: string;
    value: unknown;
    label: string;
    description?: string;
    type: "string" | "boolean" | "number" | "json";
    group: string;
    isPublic: boolean;
}
//# sourceMappingURL=domain.types.d.ts.map