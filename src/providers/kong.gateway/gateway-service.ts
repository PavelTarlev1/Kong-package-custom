import axios, { AxiosResponse } from "axios";
import { HttpStatus, Logger } from "@nestjs/common";
import { KongProviders } from "../kong.provider/providers";
import { JwtKongPostRequest, Route, RoutesKongUpdateCreateRequest } from "../kong.interfaces";

export class GatewayService {
    private static readonly logger = new Logger(GatewayService.name);

    private static authPort: number;
    private static serviceName: string = KongProviders.SERVICE_NAME;
    private static kongGateway: string = KongProviders.GATEWAY_NAME;
    private static kongPort: string = KongProviders.GATEWAY_PORT;
    private static routes: Route[] = [];

    public static addRoute(route: Route) {
        this.logger.log(`Registering route in memory: ${route.name}`);
        GatewayService.routes.push(route);
    }

    public static async gatewayExecution(portFromMain: number) {
        this.authPort = portFromMain;
        this.logger.log(`Starting Kong gateway registration for service: ${this.serviceName}`);
        try {
            await this.kongServiceCreate();
            await this.createUpdateGatewayRoute();
            await this.gatewayPluginsJWT();
            this.logger.log(`Gateway configuration completed for service: ${this.serviceName}`);
        } catch (err) {
            this.logger.error(`Gateway configuration failed:`, err as any);
        }
    }

    private static async kongServiceCreate() {
        const url = `http://${this.kongGateway}:${this.kongPort}/services/${this.serviceName}`;
        const dto = { host: this.serviceName, port: this.authPort };

        try {
            this.logger.log(`Creating or updating Kong service at ${url}`);
            await axios.put(url, dto);
            this.logger.log(`Kong service '${this.serviceName}' created or updated.`);
        } catch (err: any) {
            this.logger.error(`Failed to create/update Kong service '${this.serviceName}': ${err.message}`);
            this.responseError(err.response);
        }
    }

    private static async createUpdateGatewayRoute() {
        await Promise.all(
            this.routes.map(async (route) => {
                const dto = this.mapRoute(route);
                const url = `http://${this.kongGateway}:${this.kongPort}/services/${this.serviceName}/routes/${route.name}`;

                this.logger.log(`Creating or updating Kong route: ${dto.name}`);
                this.logger.debug(`Route config: ${JSON.stringify(dto)}`);

                try {
                    await axios.put(url, dto);
                    this.logger.log(`Route '${dto.name}' registered with Kong.`);
                } catch (err: any) {
                    this.logger.error(`Failed to create/update route '${dto.name}': ${err.message}`);
                    this.responseError(err.response);
                }
            }),
        );
    }

    private static async gatewayPluginsJWT() {
        await Promise.all(
            this.routes.map(async (route) => {
                if (!route.auth) return;

                const dto = this.mapJwtToRoute(route);
                const url = `http://${this.kongGateway}:${this.kongPort}/plugins`;

                this.logger.log(`Attaching JWT plugin to route '${route.name}'`);

                try {
                    await axios.post(url, dto);
                    this.logger.log(`JWT plugin attached to route '${route.name}'`);
                } catch (err: any) {
                    this.logger.error(`Failed to attach JWT plugin to route '${route.name}': ${err.message}`);
                    this.responseError(err.response);
                }
            }),
        );
    }

    private static mapRoute(route: Route): RoutesKongUpdateCreateRequest {
        return {
            name: route.name,
            service: { name: this.serviceName },
            methods: [route.method],
            paths: [`/${route.path}`.replace(/\/+/g, "/")],
            strip_path: false,
        };
    }

    private static mapJwtToRoute(route: Route): JwtKongPostRequest {
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

    private static responseError(response: AxiosResponse | undefined): boolean {
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
            case HttpStatus.BAD_REQUEST:
                this.logger.warn("Bad request sent to Kong.");
                break;
            case HttpStatus.NOT_FOUND:
                this.logger.warn("Kong endpoint not found. Check your URL or Kong config.");
                break;
            default:
                this.logger.warn(`Kong returned status ${status}: ${JSON.stringify(response.data)}`);
        }

        return false;
    }

}
