export class KongProviders {
    static GATEWAY_NAME = process.env.KONG_GATEWAY_NAME || 'Kong';

    static GATEWAY_PORT = process.env.GATEWAY_PORT || '8001';

    static SERVICE_NAME = process.env.SERVICE_NAME || 'user-service';

}
