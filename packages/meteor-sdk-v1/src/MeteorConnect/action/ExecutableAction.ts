import { ActionUi } from "../action_ui/ActionUi";
import type { IRenderActionUi_Input } from "../action_ui/action_ui.types";
import { MeteorLogger } from "../logging/MeteorLogger";
import type { MeteorConnect } from "../MeteorConnect";
import type {
  IMeteorConnectAccount,
  IMeteorConnection_V2_BridgeMobile,
  TMeteorConnectionExecutionTarget,
  TMeteorExecutionTargetConfig,
} from "../MeteorConnect.types.ts";
import type {
  IMobileBridgeExternalWorkHold,
  IMobileBridgeSensitiveTransferSource,
  TMobileBridgeExternalWorkJournal,
  TTransferTargetPlatform,
} from "../target_clients/mobile_bridge/MeteorConnectMobileBridgeClient.types";
import type { MobileBridgeSession } from "../target_clients/mobile_bridge/MobileBridgeSession";
import { MCActionRegistryMap, type TMCActionRegistry } from "./mc_action.combined";
import type {
  IMCActionExecutionState,
  IMCActionMeta,
  TMCActionRequestUnion,
  TMCActionRequestUnionExpandedInput,
} from "./mc_action.types.ts";

export class ExecutableAction<R extends TMCActionRequestUnion<TMCActionRegistry>> {
  readonly id: R["id"];
  readonly expandedInput: any;
  private readonly meta: IMCActionMeta;

  private executionStateListeners: ((executionState: IMCActionExecutionState) => void)[] = [];
  private executingTargetedPlatform?: TMeteorConnectionExecutionTarget;

  private execute_promise?: Promise<TMCActionRegistry[R["id"]]["output"]>;
  private executeWithUi_promise?: Promise<TMCActionRegistry[R["id"]]["output"]>;
  private waitForExecutionOutput_promise?: Promise<TMCActionRegistry[R["id"]]["output"]>;

  private actionResolvers: ((output: TMCActionRegistry[R["id"]]["output"]) => void)[] = [];
  private actionRejecters: ((reason?: any) => void)[] = [];
  private preparedMobileSession?: MobileBridgeSession;
  private prepareMobilePromise?: Promise<MobileBridgeSession>;
  private cancelPromise?: Promise<void>;
  private cancelled = false;
  private settled = false;
  private unsubscribeMobile?: () => void;
  /**
   * Transfer-only sensitive payload source (§ key confinement). A true ECMAScript private field:
   * non-enumerable, invisible to JSON.stringify/spread/Object.keys — it must never appear in any
   * serialization of this action.
   */
  #sensitiveTransferSource?: IMobileBridgeSensitiveTransferSource;
  /** Transfer only: the wallet platform the user chose; refresh/re-pair reuse it. */
  private transferTargetPlatform?: TTransferTargetPlatform;
  /** New-key verify actions are pinned to the exact wallet that completed start. */
  private transferTargetWalletConnection?: IMeteorConnection_V2_BridgeMobile;
  /** Journal-before-hold seam; set only for `new_key_account_transfer_start`. */
  private externalWorkJournal?: TMobileBridgeExternalWorkJournal;
  /** Set for a verification turn that must ride the session the start turn is still holding. */
  private continueExternalWorkHold?: IMobileBridgeExternalWorkHold;
  /** Keep the prepared session alive past this action's teardown (the AddKey window). */
  private retainSessionForExternalWork = false;

  // private onCancelAction?: () => void;

  // private waitForExecutionOutput_resolve?: (output: TMCActionRegistry[R["id"]]["output"]) => void;
  // private waitForExecutionOutput_reject?: (reason?: any) => void;

  private logger = MeteorLogger.createLogger("MeteorConnect:ExecutableAction");

  constructor(
    private readonly request: R,
    expandedInput: any,
    readonly meteorConnect: MeteorConnect,
    private readonly connectionTargetConfig: {
      allExecutionTargets: TMeteorExecutionTargetConfig[];
      contextualExecutionTarget?: TMeteorConnectionExecutionTarget;
    },
  ) {
    this.id = request.id;
    this.expandedInput = expandedInput;
    this.meta = MCActionRegistryMap[this.id].meta;
    // this.onCancelAction = onCancelAction;
  }

  getAllExecutionTargetConfigs(): TMeteorExecutionTargetConfig[] {
    return this.connectionTargetConfig.allExecutionTargets;
  }

  getExpandedRequest(): TMCActionRequestUnionExpandedInput<TMCActionRegistry> {
    return { id: this.id, expandedInput: this.expandedInput } as any;
  }

  getPreparedMobileSession(): MobileBridgeSession | undefined {
    return this.preparedMobileSession;
  }

  /** Attached once by the transfer flow right after createAction; never readable back. */
  setSensitiveTransferSource(source: IMobileBridgeSensitiveTransferSource): void {
    this.#sensitiveTransferSource = source;
  }

  setTransferTarget(input: {
    /**
     * Omit to let the action UI's platform chooser pick it — the popup then calls
     * `prepareMobileBridge({ transferTargetPlatform })` with the user's choice, and
     * `getTransferTargetPlatform()` reports what was actually chosen after execution.
     */
    platform?: TTransferTargetPlatform;
    walletConnection?: IMeteorConnection_V2_BridgeMobile;
    /**
     * `new_key_account_transfer_start` only: the seam that durably journals the wallet's signed
     * result BEFORE the bounded external-work hold begins (D33). Supplying it is what keeps the
     * session open for the AddKey window instead of closing it.
     */
    externalWorkJournal?: TMobileBridgeExternalWorkJournal;
    /** Verification turn only: install this request on the session still holding that bridge. */
    continueExternalWorkHold?: IMobileBridgeExternalWorkHold;
    /** Keep the prepared session alive after this action finishes (start → AddKey → verify). */
    retainSessionForExternalWork?: boolean;
  }): void {
    if (this.prepareMobilePromise != null || this.execute_promise != null) {
      throw new Error("mobile_bridge_target_after_prepare");
    }
    this.transferTargetPlatform = input.platform;
    this.transferTargetWalletConnection = input.walletConnection;
    this.externalWorkJournal = input.externalWorkJournal;
    this.continueExternalWorkHold = input.continueExternalWorkHold;
    this.retainSessionForExternalWork = input.retainSessionForExternalWork === true;
  }

  /** The external-work hold the prepared session parked in, when it did. */
  getExternalWorkHold(): IMobileBridgeExternalWorkHold | undefined {
    return this.preparedMobileSession?.getExternalWorkHold();
  }

  private mobileBridgeTarget() {
    return {
      transferTargetPlatform: this.transferTargetPlatform,
      walletConnection: this.transferTargetWalletConnection,
      journalBeforeExternalWorkHold: this.externalWorkJournal,
      continueExternalWorkHold: this.continueExternalWorkHold,
    };
  }

  getTransferTargetPlatform(): TTransferTargetPlatform | undefined {
    return this.transferTargetPlatform;
  }

  getCompletedMobileConnection(): IMeteorConnection_V2_BridgeMobile | undefined {
    return this.preparedMobileSession?.getCompletedConnection();
  }

  async prepareMobileBridge(options?: {
    transferTargetPlatform?: TTransferTargetPlatform;
  }): Promise<MobileBridgeSession | undefined> {
    const hasMobile = this.connectionTargetConfig.allExecutionTargets.some(
      (target) => target.executionTarget === "v2_bridge_mobile",
    );
    const contextual = this.connectionTargetConfig.contextualExecutionTarget;
    if (!hasMobile || (contextual != null && contextual !== "v2_bridge_mobile")) return undefined;
    if (options?.transferTargetPlatform != null) {
      this.transferTargetPlatform = options.transferTargetPlatform;
    }
    if (this.prepareMobilePromise == null) {
      this.prepareMobilePromise = this.meteorConnect.mobileBridgeClient
        .prepareRequest(
          this.getExpandedRequest(),
          this.#sensitiveTransferSource,
          this.mobileBridgeTarget(),
        )
        .then((session) => {
          this.preparedMobileSession = session;
          this.watchMobileSession(session);
          return session;
        });
    }
    return this.prepareMobilePromise;
  }

  private watchMobileSession(session: MobileBridgeSession): void {
    this.unsubscribeMobile?.();
    this.unsubscribeMobile = session.subscribe((snapshot) => {
      // Deliberately an allowlist of the two phases that mean "the wallet now owns the request":
      // `result_ready` and `external_work` come AFTER it and must never re-trigger execution.
      if (
        !this.cancelled &&
        (snapshot.phase === "wallet_verification" || snapshot.phase === "wallet_action") &&
        this.execute_promise == null
      ) {
        void this.execute("v2_bridge_mobile").catch(() => {
          // The action's resolver/rejecter owns delivery to the SDK caller. This prevents the
          // session observer's intentionally detached execution promise from becoming unhandled.
        });
      }
    });
  }

  async refreshMobileBridge(): Promise<MobileBridgeSession> {
    if (this.execute_promise != null) throw new Error("mobile_bridge_refresh_after_commit");
    const session = await this.meteorConnect.mobileBridgeClient.refreshRequest(
      this.getExpandedRequest(),
      this.#sensitiveTransferSource,
      this.mobileBridgeTarget(),
    );
    this.preparedMobileSession = session;
    this.prepareMobilePromise = Promise.resolve(session);
    this.watchMobileSession(session);
    return session;
  }

  async resetMobileIdentityAndRePair(): Promise<MobileBridgeSession> {
    if (this.execute_promise != null) throw new Error("mobile_bridge_reset_after_commit");
    await this.meteorConnect.mobileBridgeClient.resetPartnerIdentity();
    const session = await this.meteorConnect.mobileBridgeClient.prepareRequest(
      this.getExpandedRequest(),
      this.#sensitiveTransferSource,
      this.mobileBridgeTarget(),
    );
    this.preparedMobileSession = session;
    this.prepareMobilePromise = Promise.resolve(session);
    this.watchMobileSession(session);
    return session;
  }

  getActionKnownContextualTarget(): TMeteorConnectionExecutionTarget | undefined {
    const knownContextualTarget = this.connectionTargetConfig.contextualExecutionTarget;
    if (knownContextualTarget == null) return undefined;

    const knownContextualTargetConfig = this.connectionTargetConfig.allExecutionTargets.find(
      (config) => config.executionTarget === knownContextualTarget,
    );

    if (!knownContextualTargetConfig) {
      this.logger.err(
        `Known contextual target ${knownContextualTarget} is not in the list of available execution targets`,
      );
      return undefined;
    }

    return knownContextualTarget;
  }

  getExecutionState(): IMCActionExecutionState {
    return {
      isExecuting: this.execute_promise != null,
      targetedPlatform: this.executingTargetedPlatform ?? "unset",
    };
  }

  addExecutionStateListener(listener: (executionState: IMCActionExecutionState) => void) {
    this.executionStateListeners.push(listener);

    return () => {
      this.executionStateListeners = this.executionStateListeners.filter((l) => l !== listener);
    };
  }

  private triggerExecutionStateUpdate() {
    const state = this.getExecutionState();
    this.logger.log(`Triggering execution state update for action ${this.id}`, state);
    this.executionStateListeners.forEach((listener) => listener(state));
  }

  private async _execute(
    executionTarget?: TMeteorConnectionExecutionTarget,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    const request = this.request;

    const resolvedExecutionTarget: TMeteorConnectionExecutionTarget | undefined =
      this.getActionKnownContextualTarget() ?? executionTarget;

    const executionTargetConfig = this.connectionTargetConfig.allExecutionTargets.find(
      (config) => config.executionTarget === resolvedExecutionTarget,
    );

    if (executionTargetConfig == null) {
      throw new Error(
        this.logger.formatMsg(`Couldn't execute action (targeted platform / protocol needs to be provided on execution, or otherwise targeted platform doesn't support the action)
Available targets: [${this.connectionTargetConfig.allExecutionTargets.map((c) => c.executionTarget)}]`),
      );
    }

    this.executingTargetedPlatform = executionTargetConfig.executionTarget;
    setTimeout(() => this.triggerExecutionStateUpdate(), 5);

    if (request.id === "near::sign_in" || request.id === "near::sign_in_and_sign_message") {
      const response = await this.makeTargetedActionRequest(
        {
          id: request.id,
          expandedInput: this.expandedInput,
        },
        executionTargetConfig,
      );

      const signedInAcccount: IMeteorConnectAccount = {
        connection: response.output.connection,
        identifier: response.output.identifier,
        publicKeys: response.output.publicKeys,
      };

      await this.meteorConnect.addSignedInAccount(signedInAcccount);

      return response.output;
    }

    if (request.id === "near::sign_out") {
      const response = await this.makeTargetedActionRequest(
        {
          id: request.id,
          expandedInput: this.expandedInput,
        },
        executionTargetConfig,
      );

      await this.meteorConnect.removeSignedInAccount(response.output);

      return response.output;
    }

    const response = await this.makeTargetedActionRequest(
      {
        id: request.id,
        expandedInput: this.expandedInput,
      },
      executionTargetConfig,
    );

    return response.output;
  }

  private resolveAction(value: any) {
    if (this.settled) return;
    this.settled = true;
    this.actionResolvers.forEach((resolver) => resolver(value));
    this.logger.log(`Action [${this.id}] resolved with value`, value);
  }

  private rejectAction(value: any) {
    if (this.settled) return;
    this.settled = true;
    this.actionRejecters.forEach((rejecter) => rejecter(value));
    this.logger.err(`Action [${this.id}] rejected with error`, value);
  }

  async execute(
    executionTarget?: TMeteorConnectionExecutionTarget,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.cancelled) throw new Error("Action was cancelled");
    if (this.execute_promise == null) {
      this.execute_promise = this.commitAndExecute(executionTarget)
        .then((value) => {
          this.resolveAction(value);
          return value;
        })
        .catch((err) => {
          this.rejectAction(err);
          throw err;
        });
      this.waitForExecutionOutput_promise = this.execute_promise;
    }

    return this.execute_promise;
  }

  /**
   * The account is bound to an execution target this Meteor Connect configuration does not offer,
   * so no client can carry its request to the wallet. `createAction` only lets `near::sign_out`
   * reach here — every other account-bound action throws at creation — which is what keeps the
   * local escape below narrow.
   */
  private isStrandedFromContextualTarget(): boolean {
    const contextualTarget = this.connectionTargetConfig.contextualExecutionTarget;
    if (contextualTarget == null) return false;
    return !this.connectionTargetConfig.allExecutionTargets.some(
      (config) => config.executionTarget === contextualTarget,
    );
  }

  private isLocalOnlySignOut(): boolean {
    if (this.id !== "near::sign_out") return false;
    const account = this.expandedInput.account as IMeteorConnectAccount | undefined;
    if (account == null) return false;
    // A stranded account has no reachable wallet, so local removal is all that is left. When its
    // target IS available nothing changes here and the remote sign-out below still runs, so the
    // wallet still gets the chance to revoke the dApp key.
    if (this.isStrandedFromContextualTarget()) return true;
    return account.publicKeys == null || account.publicKeys.length === 0;
  }

  private async executeLocalSignOut(): Promise<TMCActionRegistry[R["id"]]["output"]> {
    const account = this.expandedInput.account as IMeteorConnectAccount;
    await this.meteorConnect.removeSignedInAccount(account.identifier);
    return account.identifier as TMCActionRegistry[R["id"]]["output"];
  }

  private async commitAndExecute(
    executionTarget?: TMeteorConnectionExecutionTarget,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.isLocalOnlySignOut()) return this.executeLocalSignOut();
    const contextual = this.getActionKnownContextualTarget();
    const target = contextual ?? executionTarget;
    if (target !== "v2_bridge_mobile" && this.prepareMobilePromise != null) {
      const prepared = await this.prepareMobilePromise;
      const cancellation = await prepared.cancel();
      if (cancellation === "target_already_committed") {
        return this._execute("v2_bridge_mobile");
      }
    }
    if (target === "v2_bridge_mobile") await this.prepareMobileBridge();
    const output = await this._execute(target);
    // Account-connection refresh only applies to NEAR account actions. Other domains (e.g.
    // meteor_wallet_core::transfer_accounts) have no target account, and getActiveConnection()
    // throws when no paired wallet exists — they must not enter this block.
    if (
      target === "v2_bridge_mobile" &&
      this.id.startsWith("near::") &&
      this.id !== "near::sign_in" &&
      this.id !== "near::sign_in_and_sign_message" &&
      this.id !== "near::sign_out"
    ) {
      const account = this.expandedInput.account as IMeteorConnectAccount | undefined;
      const active = this.meteorConnect.mobileBridgeClient.getCurrentSession();
      const connection =
        active == null ? undefined : this.meteorConnect.mobileBridgeClient.getActiveConnection();
      if (account != null && connection != null) {
        await this.meteorConnect.updateSignedInAccountConnection({ ...account, connection });
      }
    }
    return output;
  }

  private async _promptForExecution(
    input?: Omit<IRenderActionUi_Input<this>, "action">,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    return (await ActionUi.shared.prompt({
      action: this,
      strategy: input?.strategy,
    })) as any;
  }

  async promptForExecution(
    input?: Omit<IRenderActionUi_Input<this>, "action">,
  ): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.executeWithUi_promise == null) {
      this.executeWithUi_promise = this.isLocalOnlySignOut()
        ? this.execute()
        : this._promptForExecution(input);
    }

    return this.executeWithUi_promise;
    // return this._promptForExecution(input);
  }

  private async _waitForExecutionOutput(): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.execute_promise != null) {
      return this.execute_promise;
    }

    return new Promise<TMCActionRegistry[R["id"]]["output"]>((resolve, reject) => {
      this.actionResolvers.push(resolve);
      this.actionRejecters.push(reject);
    });
  }

  async waitForExecutionOutput(): Promise<TMCActionRegistry[R["id"]]["output"]> {
    if (this.waitForExecutionOutput_promise == null) {
      this.waitForExecutionOutput_promise = this._waitForExecutionOutput();
    }

    return this.waitForExecutionOutput_promise;
  }

  async cancelAction(): Promise<void> {
    if (this.cancelPromise != null) return this.cancelPromise;
    if (this.cancelled) return;

    // Closing the UI always ends the local request immediately, even after the wallet has accepted
    // a bridge that can no longer be cancelled remotely. Remote cleanup remains best-effort.
    this.cancelled = true;
    this.unsubscribeMobile?.();
    this.rejectAction(new Error("Action was cancelled"));
    this.cancelPromise = this.cancelPreparedMobileRequest();
    return this.cancelPromise;
  }

  private async cancelPreparedMobileRequest(): Promise<void> {
    let session = this.preparedMobileSession;
    if (session == null && this.prepareMobilePromise != null) {
      try {
        session = await this.prepareMobilePromise;
      } catch {
        // Bridge creation failed before a cancellable bridge was returned. The request
        // remains terminal from the SDK caller's perspective and will expire server-side
        // if the network outcome was ambiguous.
      }
    }
    if (session == null) return;
    try {
      // Abandonment always ends in the close verb the §5.7 matrix permits for the current phase —
      // including the receipt-bound `abandonResultAndClose` for a session already holding the
      // wallet's signed result, which the old "committed means walk away" shortcut left parked.
      await session.abandon();
    } catch (error) {
      // An unknown/failed close never authorizes a legacy target. It is still terminal for this
      // caller and the idempotent bridge remains recoverable/expiring server-side.
      this.logger.err("Failed to close abandoned mobile bridge request", error);
    }
  }

  async disposePreparedMobileSession(): Promise<void> {
    this.unsubscribeMobile?.();
    this.unsubscribeMobile = undefined;
    const cancelPromise = this.cancelPromise?.catch(() => {});
    const preparedSession = this.preparedMobileSession;
    if (
      this.retainSessionForExternalWork &&
      preparedSession?.getExternalWorkHold() != null &&
      !this.cancelled
    ) {
      // The AddKey window owns this session now. Its UI is finished, but disconnecting the bridge
      // here would abandon a hold the wallet has already been told to keep — and force it to mint
      // a second destination key for the verification turn.
      preparedSession.releaseUiObservers();
      await cancelPromise;
      return;
    }
    if (preparedSession != null) {
      // releaseSession fences the old client slot synchronously; the next request can open its UI
      // while preparation waits for this disconnect to drain.
      await Promise.all([
        this.meteorConnect.mobileBridgeClient.releaseSession(preparedSession, cancelPromise),
        cancelPromise,
      ]);
      return;
    }
    await cancelPromise;
    const latePreparedSession = this.preparedMobileSession;
    if (latePreparedSession != null) {
      await this.meteorConnect.mobileBridgeClient.releaseSession(latePreparedSession);
    }
  }

  private async makeTargetedActionRequest<
    R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>,
  >(
    request: R,
    connection: TMeteorExecutionTargetConfig,
  ): Promise<{ output: TMCActionRegistry[R["id"]]["output"] }> {
    const client = this.meteorConnect.getClientByExecutionTargetId(connection.executionTarget);

    this.logger.log(
      `Requesting action [${request.id}] for connection [${connection.executionTarget}]`,
    );

    return {
      output: await client.makeRequest(request, connection),
    };
  }
}
