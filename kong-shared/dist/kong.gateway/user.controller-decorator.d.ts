import { RequestMethod } from '@nestjs/common';
export declare function RouteDecorator(path: string, method: RequestMethod, jwtOption?: boolean): MethodDecorator;
export declare function ControllerDecorator(path: string): ClassDecorator;
