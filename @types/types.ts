import { LatLng } from 'react-native-maps';

export type credentials = {
    email: string;
    password: string;
};

export type AuthContextType = {
    isAuthenticated: boolean;
    token: string | null;
    login: (data: credentials) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
};

export type authResponse = {
    message: string;
    data: {
        user: User;
        token: string;
    };
};

export type User = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
};

export type WaterSourceType = {
    id: number,
    name: string,
    deleted_at: string,
    created_at: string,
    updated_at: string
}

export type CreatedBy = {
    id: number,
    name: string
}

export type WaterSource = {
    id: number,
    name: string,
    description: string,
    water_source_type: WaterSourceType,
    created_by: CreatedBy,
    coordinates: LatLng[],
}

export type FormWaterSource = {
    name: string;
    description?: string | null;
    water_source_type_id: number;
    created_by: number;
    coordinates?: LatLng[]
    water_class_id: number
};

// export  type WaterSourceType = {
//     id: number,
//     name: string,
//     deleted_at: string,
//     created_at: string,
//     updated_at: string
// }
export type WaterClass = {
    id: number,
    water_class: string,
    description: string,
    deleted_at: string,
    created_at: string,
    updated_at: string
}


