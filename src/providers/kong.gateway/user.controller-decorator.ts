import { Controller, RequestMapping, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { GatewayService } from "./gateway-service";

export function RouteDecorator(
  path: string,
  method: RequestMethod,
  jwtOption = true
): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const updatePath = path[0] === '/' ? path.substring(1) : path;
    const kongPath = updatePath.replace(/:\w+/g, '.+');

    Reflect.defineMetadata('ROUTE_NAME', `${propertyKey.toString()}`, target.constructor.prototype[propertyKey]);
    Reflect.defineMetadata('ROUTE_PATH', kongPath, target.constructor.prototype[propertyKey]);
    Reflect.defineMetadata('ROUTE_METHOD', RequestMethod[method], target.constructor.prototype[propertyKey]);
    Reflect.defineMetadata('ROUTE_JWT_ENABLED', jwtOption, target.constructor.prototype[propertyKey]);

    RequestMapping({
      [PATH_METADATA]: path,
      [METHOD_METADATA]: method,
    })(target, propertyKey, descriptor);
  };
}


export function ControllerDecorator(path: string): ClassDecorator {
  return (target: any) => {
    Object.getOwnPropertyNames(target.prototype).forEach((propertyKey) => {

      const route = Reflect.getMetadata('ROUTE_PATH', target.prototype[propertyKey]);
      const method: string = Reflect.getMetadata('ROUTE_METHOD', target.prototype[propertyKey]);
      const auth: boolean = Reflect.getMetadata('ROUTE_JWT_ENABLED', target.prototype[propertyKey]);
      const name: string = Reflect.getMetadata('ROUTE_NAME', target.prototype[propertyKey]);

      if (!route) {
        return;
      }

      GatewayService.addRoute({
        name,
        method,
        auth,
        path: `/${path}/${route}`,
      });
    });
    Controller(`/api/${path}`.replace('//', '/'))(target);
  };
}
