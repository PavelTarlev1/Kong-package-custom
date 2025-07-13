"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KongProviders = void 0;
class KongProviders {
}
exports.KongProviders = KongProviders;
KongProviders.GATEWAY_NAME = process.env.KONG_GATEWAY_NAME || 'Kong';
KongProviders.GATEWAY_PORT = process.env.GATEWAY_PORT || '8001';
KongProviders.SERVICE_NAME = process.env.SERVICE_NAME || 'user-service';
//# sourceMappingURL=providers.js.map