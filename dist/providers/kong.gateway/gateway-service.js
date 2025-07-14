"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayService = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@nestjs/common");
const providers_1 = require("../kong.provider/providers");
class GatewayService {
    static addRoute(route) {
        this.logger.log(`Registering route in memory: ${route.name}`);
        GatewayService.routes.push(route);
    }
    static async gatewayExecution(portFromMain) {
        this.authPort = portFromMain;
        this.logger.log(`Starting Kong gateway registration for service: ${this.serviceName}`);
        try {
            await this.kongServiceCreate();
            await this.createUpdateGatewayRoute();
            await this.gatewayPluginsJWT();
            this.logger.log(`Gateway configuration completed for service: ${this.serviceName}`);
        }
        catch (err) {
            this.logger.error(`Gateway configuration failed:`, err);
        }
    }
    static async kongServiceCreate() {
        const url = `http://${this.kongGateway}:${this.kongPort}/services/${this.serviceName}`;
        const dto = { host: this.serviceName, port: this.authPort };
        try {
            this.logger.log(`Creating or updating Kong service at ${url}`);
            await axios_1.default.put(url, dto);
            this.logger.log(`Kong service '${this.serviceName}' created or updated.`);
        }
        catch (err) {
            this.logger.error(`Failed to create/update Kong service '${this.serviceName}': ${err.message}`);
            this.responseError(err.response);
        }
    }
    static async createUpdateGatewayRoute() {
        await Promise.all(this.routes.map(async (route) => {
            const dto = this.mapRoute(route);
            const url = `http://${this.kongGateway}:${this.kongPort}/services/${this.serviceName}/routes/${route.name}`;
            this.logger.log(`Creating or updating Kong route: ${dto.name}`);
            this.logger.debug(`Route config: ${JSON.stringify(dto)}`);
            try {
                await axios_1.default.put(url, dto);
                this.logger.log(`Route '${dto.name}' registered with Kong.`);
            }
            catch (err) {
                this.logger.error(`Failed to create/update route '${dto.name}': ${err.message}`);
                this.responseError(err.response);
            }
        }));
    }
    static async gatewayPluginsJWT() {
        await Promise.all(this.routes.map(async (route) => {
            if (!route.auth)
                return;
            const dto = this.mapJwtToRoute(route);
            const url = `http://${this.kongGateway}:${this.kongPort}/plugins`;
            this.logger.log(`Checking for existing JWT plugin on route '${route.name}'`);
            try {
                const existingPluginsUrl = `http://${this.kongGateway}:${this.kongPort}/routes/${route.name}/plugins`;
                const { data } = await axios_1.default.get(existingPluginsUrl);
                const jwtPluginExists = data.data.some((plugin) => plugin.name === "jwt");
                if (jwtPluginExists) {
                    this.logger.log(`JWT plugin already exists for route '${route.name}', skipping.`);
                    return;
                }
                this.logger.log(`Attaching JWT plugin to route '${route.name}'`);
                await axios_1.default.post(url, dto);
                this.logger.log(`JWT plugin attached to route '${route.name}'`);
            }
            catch (err) {
                this.logger.error(`Failed to attach JWT plugin to route '${route.name}': ${err.message}`);
                this.responseError(err.response);
            }
        }));
    }
    static mapRoute(route) {
        return {
            name: route.name,
            service: { name: this.serviceName },
            methods: [route.method],
            paths: [`/${route.path}`.replace(/\/+/g, "/")],
            strip_path: false,
        };
    }
    static mapJwtToRoute(route) {
        return {
            name: "jwt",
            config: {
                key_claim_name: "kid",
                claims_to_verify: ["exp"],
            },
            enabled: true,
            route: { name: route.name },
        };
    }
    static responseError(response) {
        if (!response) {
            this.logger.error("No response received from Kong.");
            return false;
        }
        const status = response.status;
        if (status < 300) {
            this.logger.log(`Kong responded with a success code: ${status}`);
            return true;
        }
        switch (status) {
            case common_1.HttpStatus.BAD_REQUEST:
                this.logger.warn("Bad request sent to Kong.");
                break;
            case common_1.HttpStatus.NOT_FOUND:
                this.logger.warn("Kong endpoint not found. Check your URL or Kong config.");
                break;
            default:
                this.logger.warn(`Kong returned status ${status}: ${JSON.stringify(response.data)}`);
        }
        return false;
    }
}
exports.GatewayService = GatewayService;
GatewayService.logger = new common_1.Logger(GatewayService.name);
GatewayService.serviceName = providers_1.KongProviders.SERVICE_NAME;
GatewayService.kongGateway = providers_1.KongProviders.GATEWAY_NAME;
GatewayService.kongPort = providers_1.KongProviders.GATEWAY_PORT;
GatewayService.routes = [];
//# sourceMappingURL=gateway-service.js.map