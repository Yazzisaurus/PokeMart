import { ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

export class LocalGuard extends AuthGuard('local') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        return (await super.canActivate(context)) as boolean
    }
}