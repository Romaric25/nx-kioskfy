export interface MonerooCustomer {
    email: string;
    first_name: string;
    last_name: string;
    id?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country_code?: string;
    country?: string;
    zip_code?: string;
    environment?: string;
    created_at?: string;
    updated_at?: string;
}
export interface InitializePaymentInput {
    amount: number;
    currency: string;
    description: string;
    customer: MonerooCustomer;
    return_url: string;
    metadata: Record<string, unknown>;
    methods: string[];
    withdrawalId?: number;
}
export interface MonerooPaymentResponse {
    checkout_url: string;
    payment_id: string;
    [key: string]: unknown;
}
export interface MonerooPaymentVerifyResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        status: "success" | "pending" | "failed" | "cancelled";
        is_processed: boolean;
        processed_at: string | null;
        amount: number;
        currency: string;
        amount_formatted: string;
        description: string;
        return_url: string;
        environment: string;
        initiated_at: string;
        checkout_url: string;
        payment_phone_number: string | null;
        app: {
            id: string;
            name: string;
            icon_url: string;
        };
        customer: MonerooCustomer;
        method: {
            name: string;
            code: string;
            icon_url: string;
            environment: string;
        } | null;
        gateway: {
            name: string;
            account_name: string;
            code: string;
            icon_url: string;
            environment: string;
        } | null;
        metadata: Record<string, string> | null;
        context: {
            ip: string;
            user_agent: string;
            country: string;
            local: string;
        };
    };
}
export interface InitializePayoutInput {
    amount: number;
    currency: string;
    description: string;
    customer: MonerooCustomer;
    recipient: Record<string, unknown>;
    metadata: Record<string, unknown>;
    method: string;
    withdrawalId?: number;
}
export interface PaymentResponse {
    success: boolean;
    data: unknown;
    message?: string;
}
export interface VerifyTransactionResponse {
    id: string;
    status: string;
    is_processed: boolean;
    processed_at: string;
    amount: number;
    currency: string;
    amount_formatted: string;
    description: string;
    return_url: string;
    environment: string;
    initiated_at: string;
    checkout_url: string;
    payment_phone_number?: string;
    app?: {
        id: string;
        name: string;
        icon_url: string;
    };
    customer: MonerooCustomer;
    method?: {
        name: string;
        code: string;
        icon_url: string;
        environment: string;
    };
    gateway?: {
        name: string;
        account_name: string;
        code: string;
        icon_url: string;
        environment: string;
    };
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=payment.types.d.ts.map