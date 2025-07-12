export interface RoutesKongUpdateCreateRequest {
    name: string;
    service: {
        name: string,
    };
    methods: string[];
    paths: [string];
    strip_path: boolean;
}
