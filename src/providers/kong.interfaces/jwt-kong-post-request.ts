export interface JwtKongPostRequest {
    name: string;
    config: {
        key_claim_name: string;
        claims_to_verify: ['exp'];
    };
    enabled: boolean;
    route: {
        id?: string;
        name?: string;
    };
}
