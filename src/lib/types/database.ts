// Database table types extending Supabase generated types

export interface RequestItem {
    id: string;
    request_id: string;
    product_id: string;
    quantity_requested: number;
    created_at: string;
    product?: {
        id: string;
        product_name: string;
        sku: string;
        in_stock: number;
    };
    request?: {
        id: string;
        request_number: string;
        requester_name: string;
        status: string;
        created_at: string;
        photo_url?: string;
    };
}

export interface ClaimItem {
    id: string;
    claim_id: string;
    product_id: string;
    quantity_requested: number;
    quantity_approved?: number;
    created_at: string;
    product?: {
        id: string;
        product_name: string;
        sku: string;
        in_stock: number;
    };
}

export interface MaterialClaim {
    id: string;
    claim_number: string;
    project_id: string;
    onsite_user_id: string;
    onsite_user_name: string;
    claim_type: 'standard' | 'emergency';
    emergency_reason?: string;
    status: 'pending' | 'approved' | 'denied';
    photo_url?: string;
    notes?: string;
    created_at: string;
    claim_items?: ClaimItem[];
    project?: {
        id: string;
        name: string;
        location?: string;
    };
}

export interface ProjectStats {
    total_products_allocated: number;
    pending_requests: number;
}

export interface UserProject {
    id: string;
    user_id: string;
    project_id: string;
    role?: string;
    created_at: string;
}
