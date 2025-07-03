import { Middleware } from "koa";
import koaBody from "koa-body";
import { match } from "node-match-path";
import { ServerConfig } from "../../../../../configs/ServerConfig";
import { notNullEmpty } from "../../../../data_type_utils/StringUtils";
import { SerializationUtils } from "../../../../javascript_helpers/SerializationUtils";
import { TFRFailure } from "../../../task_function/TaskFunctionResponses";
import {
  ETaskFunctionEndId,
  ITaskFunctionResponse,
} from "../../../task_function/TaskFunctionTypes";
import { TaskFunctionError, TaskFunctionUtils } from "../../../task_function/TaskFunctionUtils";
import { ActionRunnerContextualCore } from "../../ActionRunnerContextualCore";
import { getApiRunnerClient } from "../../ApiRunnerClient";

const bodyParser = koaBody({ multipart: true });

const fakeNext = async () => {};

type TAllowedMethods = "POST" | "GET";

interface IOCreateApiActionMiddleware_Input {
  allowMethods?: TAllowedMethods[];
}

export function createEndpointMiddleware({
  allowMethods = ["POST"],
}: IOCreateApiActionMiddleware_Input = {}): Middleware {
  const {
    api: { apiBasePath },
  } = ServerConfig.getConfig();

  return async (ctx, next) => {
    const baseMatch = match(`${apiBasePath}*`, ctx.path);
    console.log(ctx.path);

    if (baseMatch.matches) {
      const matchPath = match(`${apiBasePath}/:actionId`, ctx.path);
      const allowedOrigin = ctx.origin;

      if (matchPath.matches) {
        if (allowMethods!.includes(ctx.method as TAllowedMethods)) {
          await bodyParser(ctx, fakeNext);

          let { inputs = {}, pluginState = {}, formActionInput } = ctx.request.body ?? {};
          const actionId = matchPath.params!.actionId;

          if (notNullEmpty(formActionInput)) {
            const files = ctx.request.files;

            const _files: any = {};

            if (files != null) {
              for (const fileKey of Object.keys(files)) {
                if (Array.isArray(files[fileKey])) {
                  _files[fileKey] = files[fileKey];
                } else {
                  _files[fileKey] = [files[fileKey]];
                }
              }
            }

            const body = JSON.parse(
              formActionInput,
              SerializationUtils.JsonRevivers.reviveDateObjects,
            );
            inputs = body.inputs;
            inputs._files = _files;
          }

          const ActionClient = getApiRunnerClient();
          const ActionContextCore = new ActionRunnerContextualCore({
            contexts: [
              /* {
                 pluginId: "cookies",
                 initializer: CookiePlugin_Context_Koa.initialize,
                 inputs: ctx,
               } as TCookiePlugin_ExecutionContext,*/
            ],
            pluginState,
            client: getApiRunnerClient(),
          });

          try {
            const response = await ActionContextCore.execute(
              ActionClient.getAction(actionId),
              inputs,
            );

            // Remove Internal Error Payload for client responses
            delete response.errorPayload;

            response.taskId = actionId;
            ctx.response.body = JSON.stringify(response);
            ctx.type = "application/json";
            ctx.status = TaskFunctionUtils.getHttpStatusCodeForEndId(response.endId);
          } catch (e) {
            console.error(e);
            let response: ITaskFunctionResponse;

            if (e instanceof TaskFunctionError) {
              response = e.taskFunctionResponse;
            } else {
              response = TFRFailure(ETaskFunctionEndId.THROWN_ERROR, `Action ID: ${actionId}`);
            }

            response.taskId = actionId;

            ctx.response.body = JSON.stringify(response);
            ctx.type = "application/json";
            ctx.status = TaskFunctionUtils.getHttpStatusCodeForEndId(response.endId);
          }
        } else {
          await next();
        }
      } else {
        const response = TFRFailure(
          ETaskFunctionEndId.NOT_FOUND,
          `API matched on base of path "${ctx.path}"- but couldn't resolve any action ID to run`,
        );
        ctx.response.body = JSON.stringify(response);
        ctx.type = "application/json";
        ctx.status = TaskFunctionUtils.getHttpStatusCodeForEndId(response.endId);
      }
    } else {
      await next();
    }
  };
}
