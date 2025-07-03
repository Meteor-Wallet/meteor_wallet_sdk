/**
 * Key information returned from the Protocol. This interface is exactly the same as the `KeyInfo`, except all the fields are
 * snake cased instead of camel cased due to what the Protocol returns.
 */
export interface IKeypom_KeyInfo {
  /** Drop ID for the specific drop that the key belongs to. */
  drop_id: string;
  /** Public key for this access key. */
  public_key: string;

  /** Which use is the key currently on? For single-use keys, this is always 1.  */
  cur_key_use: number;

  /** How many uses this key has left before it's deleted.  */
  remaining_uses: number;

  /** At what timestamp was the key last used? Measured in number of non-leap-nanoseconds since January 1, 1970 0:00:00 UTC. */
  last_used: number;

  /** How much allowance does the key have left (measured in $yoctoNEAR). When the key is deleted, this is refunded to the funder's balance. */
  allowance: number;

  /** The unique ID associated to this key. IDs are *not* unique across drops but they are unique for any key in the drop. */
  key_id: number;
}

/**
 * Drop information returned from the Protocol. This interface is exactly the same as the `Drop`, except all the fields are
 * snake cased instead of camel cased due to what the Protocol returns.
 */
export interface IKeypom_Drop {
  /** Drop ID for this specific drop. */
  drop_id: string;
  /** Which account created this drop. */
  owner_id: string;
  /** How much $yoctoNEAR will be transferred anytime a key is used that is part of this drop. */
  deposit_per_use: string;
  /** For simple drops, there are specific, optional configurations. */
  simple?: IKeypom_SimpleData;
  /** For NFT drops, important information such as the token IDs, or contract need to be stored. */
  nft?: IKeypom_NFTData;
  /** For Fungible Token drops, important information such as the amount of tokens to transfer, or contract need to be stored. */
  ft?: IKeypom_FTData;
  /** For Function-Call drops, important information needs to be stored such as which methods, the attached deposit, args etc. */
  fc?: IKeypom_FCData;
  /** All drops regardless of their type can have a suite of configurations such as how many uses each key has or how often a key can be used. */
  config?: IKeypom_DropConfig;
  /** Any extra information about the drop can be stored as metadata. This is up to the drop creator and can be stringified JSON, or any other string. */
  metadata?: string;
  /** How many key uses are registered for this drop? This is only applicable to simple drops with lazy registrations, FT drops, and NFT drops. */
  registered_uses: number;
  /** In order to use an access key that's part of this drop, how much Gas *needs* to be attached to the call? */
  required_gas: string;
  /** What is the next unique ID that will be given to the next access key added to this drop. */
  next_key_id: number;
  /** If calling `getDrops` or `getDropInformation` and `withKeys` is passed in as true, an extra view call will be done to get a set of keys that are currently on the drop. */
  keys?: IKeypom_KeyInfo[];
}

/**
 * Drop config returned from the Protocol. This interface is exactly the same as the `DropConfig`, except all the fields are
 * snake cased instead of camel cased due to what the Protocol returns.
 */
export interface IKeypom_DropConfig {
  /** How many uses can each key have before it's deleted. If this isn't specified, it defaults to 1 use per key. */
  uses_per_key?: number;

  /** Any information related to time-based configurations such as a starting date for keys etc. */
  time?: IKeypom_TimeConfig;

  /** Any information related to how access keys are used such as which methods they can call or whether an empty drop should be automatically deleted etc.*/
  usage?: IKeypom_UsageConfig;

  /** Override the global root account that all created sub-accounts will have (currently `near` or `testnet`). This allows users to drops that have a custom root.
   * For example, Fayyr could specify a root of `fayyr.near` By which all sub-accounts will then be `ACCOUNT.fayyr.near`.
   * It's important to note that this root account *MUST* have a smart contract deployed that has a method `create_account`.
   */
  drop_root?: string;
}

/**
 * Time Config information returned from the Protocol. This interface is exactly the same as the `TimeConfig`, except all the fields are
 * snake cased instead of camel cased due to what the Protocol returns.
 */
export interface IKeypom_TimeConfig {
  /**
   * Minimum block timestamp before keys can be used. If this isn't specified, keys can be used immediately.
   * Measured in number of non-leap-nanoseconds since January 1, 1970 0:00:00 UTC.
   */
  start?: number;

  /**
   * Block timestamp that keys must be used before. If this isn't specified, keys can be used indefinitely.
   * Measured in number of non-leap-nanoseconds since January 1, 1970 0:00:00 UTC.
   */
  end?: number;

  /**
   * Amount of time that *must* pass in between each key use. If this isn't specified, there is no delay between key uses.
   * Measured in number of non-leap-nanoseconds since January 1, 1970 0:00:00 UTC.
   */
  throttle?: number;

  /**
   * Interval of time after the `start_timestamp` that must pass before a key can be used. If multiple intervals pass, the key can be used multiple times.
   * This has nothing to do With the throttle timestamp. It only pertains to the start timestamp and the current timestamp. The last_used timestamp is not taken into account.
   * Measured in number of non-leap-nanoseconds since January 1, 1970 0:00:00 UTC.
   */
  interval?: number;
}

/**
 * Usage Config information returned from the Protocol. This interface is exactly the same as the `UsageConfig`, except all the fields are
 * snake cased instead of camel cased due to what the Protocol returns.
 */
export interface IKeypom_UsageConfig {
  /**
   * Specify which methods can be called by the access key (either `claim` or `create_account_and_claim`). If this isn't specified, both methods can be called.
   */
  permissions?: string;
  /**
   * If the method `claim` is called rather than `create_account_and_claim`, should the `deposit_per_use` be refunded to the owner's balance?
   * If this isn't specified, it defaults to false.
   */
  refund_deposit?: boolean;
  /**
   * When a key is used and deleted, if it results in the drop being empty, should the drop automatically be deleted? If this isn't specified, it defaults to false.
   */
  auto_delete_drop?: boolean;
  /**
   * In the case where `autoDeleteDrop` is set to true and the drop is the owner's last, should their balance be automatically withdrawn? If this isn't specified, it defaults to false.
   */
  auto_withdraw?: boolean;

  /** When calling `create_account` on the root account, which linkdrop args should be attached to the payload. */
  account_creation_fields?: {
    /**
     * Specifies what field Keypom should auto-inject the account that claimed the drop's ID into when calling the `create_account` function.
     */
    account_id_field?: string;
    /**
     * Specifies what field Keypom should auto-inject the drop's ID into when calling the `create_account` function.
     */
    drop_id_field?: string;
    /**
     * Specifies what field Keypom should auto-inject the key's ID into when calling the `create_account` function.
     */
    key_id_field?: string;
    /**
     * Specifies what field Keypom should auto-inject the drop funder's account ID into when calling the `create_account` function.
     */
    funder_id_field?: string;
  };
}

export interface IKeypom_SimpleData {
  // If this is set to true, keys can be created and registered AFTER they've been created (for simple and FC drops only).
  lazy_register?: boolean;
}

/**
 * NFT Data information returned from the Protocol. This interface is exactly the same as the `NFTData`, except all the fields are
 * snake cased instead of camel cased due to what the Protocol returns.
 */
export interface IKeypom_NFTData {
  /** The account ID that the NFT contract is deployed to. This contract is where all the NFTs for the specific drop must come from. */
  contract_id: string;
  /** The account ID that will be sending any NFTs to the Keypom contract for the specific drop. Most times, this is simply the funder / drop owner. */
  sender_id: string;
}

/**
 * FT Data returned from the Protocol. This interface is exactly the same as the `FTData`, except all the fields are
 * snake cased instead of camel cased due to what the Protocol returns.
 */
export interface IKeypom_FTData {
  /**
   * Which contract do the FTs belong to?
   */
  contract_id: string;
  /**
   * Which account ID will be sending the fungible tokens to the Keypom contract in order to register key uses?
   */
  sender_id: string;
  /**
   * Amount of tokens to transfer but considering the decimal amount.
   * Example: transferring one wNEAR should be passed in as "1000000000000000000000000" and NOT "1"
   */
  balance_per_use?: string;
}

/**
 * Method information returned from the Protocol. This interface is exactly the same as the `Method`, except all the fields are
 * snake cased instead of camel cased due to what the Protocol returns.
 */
export interface IKeypom_Method {
  /**
   * The account ID that the contract is deployed to that the method will be called on.
   */
  receiver_id: string;
  /**
   * The method that should be invoked on the `receiverId`'s contract.
   */
  method_name: string;
  /**
   * What arguments should be passed to the method. This should be in stringified JSON.
   */
  args: string;
  /**
   * How much yoctoNEAR should be attached to the call.
   */
  attached_deposit: string;
  /**
   * Specifies what field Keypom should auto-inject the account that claimed the drop's ID into when calling the function.
   * As an example, if the methodName was `nft_mint` and it expected a field `receiver_id` to be passed in, indicating who should receive the token, then the `accountIdField` would be `receiver_id`.
   */
  account_id_field?: string;
  /**
   * Specifies what field Keypom should auto-inject the drops ID into when calling the function.
   * As an example, if an NFT contract expected the Keypom drop ID to be passed in as the field `keypom_drop_id` in order to gate access to who can mint NFTs, then the `dropIdField` would be `keypom_drop_id`.
   */
  drop_id_field?: string;
  /**
   * Specifies what field Keypom should auto-inject the key's ID into when calling the function.
   * As an example, if an NFT contract wanted to gate only users with an odd key ID to be able to mint an NFT and their parameter was called `keypom_key_id`, then the `keyIdField` would be `keypom_key_id`.
   */
  key_id_field?: string;
}

/**
 * FC Config information returned from the Protocol. This interface is exactly the same as the `FCConfig`, except all the fields are
 * snake cased instead of camel cased due to what the Protocol returns.
 */
export interface IKeypom_FCConfig {
  /**
   * How much Gas should be attached to the function call. If this is specified, the key can *ONLY* be used to call `claim` and cannot be used to create a new account.
   * The amount of Gas cannot exceed 90 TGas.
   */
  attached_gas?: string;
}

/**
 * FC Data returned from the Protocol. This interface is exactly the same as the `FCData`, except all the fields are
 * snake cased instead of camel cased due to what the Protocol returns.
 */
export interface IKeypom_FCData {
  /**
   * The top level array indicates a different set of methods that can be called for every key use. It is possible that for a given key use, no methods are called thus acting as a "free" key use whereby the use is reflected on-chain but no assets are transferred.
   * If a given key use does not have an undefined set of methods, when it is used, all the methods in the set will be called.
   */
  methods: Array<Array<IKeypom_Method> | undefined>;
  /**
   * Specific configurations for the Function-Call drop.
   */
  config?: IKeypom_FCConfig;
}

export interface IKeypom_NFTMetadata {
  series_id: number;
  mint_id: number;
  metadata: {
    title: string;
    description: string;
    media: string;
    media_hash?: string;
    copies?: number;
    issued_at?: number;
    expires_at?: number;
    starts_at?: number;
    updated_at?: number;
    extra?: string;
    reference?: string;
    reference_hash?: string;
  };
  royalty?: string;
  owner_id: string;
}
