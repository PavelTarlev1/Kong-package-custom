import { Route } from "../kong.interfaces";
export declare class GatewayService {
    private static readonly logger;
    private static authPort;
    private static serviceName;
    private static kongGateway;
    private static kongPort;
    private static routes;
    static addRoute(route: Route): void;
    static gatewayExecution(portFromMain: number): Promise<void>;
    private static kongServiceCreate;
    private static createUpdateGatewayRoute;
    private static gatewayPluginsJWT;
    private static mapRoute;
    private static mapJwtToRoute;
    private static responseError;
}
