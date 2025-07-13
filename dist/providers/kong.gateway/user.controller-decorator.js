"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteDecorator = RouteDecorator;
exports.ControllerDecorator = ControllerDecorator;
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const gateway_service_1 = require("./gateway-service");
function RouteDecorator(path, method, jwtOption = true) {
    return (target, propertyKey, descriptor) => {
        const updatePath = path[0] === '/' ? path.substring(1) : path;
        const kongPath = updatePath.replace(/:\w+/g, '.+');
        Reflect.defineMetadata('ROUTE_NAME', `${propertyKey.toString()}`, target.constructor.prototype[propertyKey]);
        Reflect.defineMetadata('ROUTE_PATH', kongPath, target.constructor.prototype[propertyKey]);
        Reflect.defineMetadata('ROUTE_METHOD', common_1.RequestMethod[method], target.constructor.prototype[propertyKey]);
        Reflect.defineMetadata('ROUTE_JWT_ENABLED', jwtOption, target.constructor.prototype[propertyKey]);
        (0, common_1.RequestMapping)({
            [constants_1.PATH_METADATA]: path,
            [constants_1.METHOD_METADATA]: method,
        })(target, propertyKey, descriptor);
    };
}
function ControllerDecorator(path) {
    return (target) => {
        Object.getOwnPropertyNames(target.prototype).forEach((propertyKey) => {
            const route = Reflect.getMetadata('ROUTE_PATH', target.prototype[propertyKey]);
            const method = Reflect.getMetadata('ROUTE_METHOD', target.prototype[propertyKey]);
            const auth = Reflect.getMetadata('ROUTE_JWT_ENABLED', target.prototype[propertyKey]);
            const name = Reflect.getMetadata('ROUTE_NAME', target.prototype[propertyKey]);
            if (!route) {
                return;
            }
            gateway_service_1.GatewayService.addRoute({
                name,
                method,
                auth,
                path: `/${path}/${route}`,
            });
        });
        (0, common_1.Controller)(`/api/${path}`.replace('//', '/'))(target);
    };
}
//# sourceMappingURL=user.controller-decorator.js.map