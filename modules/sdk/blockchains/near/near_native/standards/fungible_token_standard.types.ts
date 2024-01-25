export enum EFunctionCallMethod_FungibleTokenStandard {
  /**
   *  Simple transfer to a receiver.
   *
   *  Requirements:
   *  * Caller of the method must attach a deposit of 1 yoctoⓃ for security purposes
   *  * Caller must have greater than or equal to the `amount` being requested
   *
   *  Arguments:
   *  * `receiver_id`: the valid NEAR account receiving the fungible tokens.
   *  * `amount`: the number of tokens to transfer, wrapped in quotes and treated
   *    like a string, although the number will be stored as an unsigned integer
   *    with 128 bits.
   *  * `memo` (optional): for use cases that may benefit from indexing or
   *     providing information for a transfer.
   */
  ft_transfer = "ft_transfer",
  /**
   * Transfer tokens and call a method on a receiver contract. A successful
   * workflow will end in a success execution outcome to the callback on the same
   * contract at the method `ft_resolve_transfer`.
   *
   * You can think of this as being similar to attaching native NEAR tokens to a
   * function call. It allows you to attach any Fungible Token in a call to a
   * receiver contract.
   *
   * Requirements:
   * * Caller of the method must attach a deposit of 1 yoctoⓃ for security
   *   purposes
   * * Caller must have greater than or equal to the `amount` being requested
   * * The receiving contract must implement `ft_on_transfer` according to the
   *   standard. If it does not, FT contract's `ft_resolve_transfer` MUST deal
   *   with the resulting failed cross-contract call and roll back the transfer.
   * * Contract MUST implement the behavior described in `ft_resolve_transfer`
   *
   * Arguments:
   * * `receiver_id`: the valid NEAR account receiving the fungible tokens.
   * * `amount`: the number of tokens to transfer, wrapped in quotes and treated
   *   like a string, although the number will be stored as an unsigned integer
   *   with 128 bits.
   * * `memo` (optional): for use cases that may benefit from indexing or
   *    providing information for a transfer.
   * * `msg`: specifies information needed by the receiving contract in
   *    order to properly handle the transfer. Can indicate both a function to
   *    call and the parameters to pass to that function.
   */
  ft_transfer_call = "ft_transfer_call",
  /**
   * This function is implemented on the receiving contract.
   * As mentioned, the `msg` argument contains information necessary for the receiving
   * contract to know how to process the request. This may include method names and/or arguments.
   * Returns a value, or a promise which resolves with a value. The value is the
   * number of unused tokens in string form. For instance, if `amount` is 10 but only 9 are
   * needed, it will return "1".
   */
  ft_on_transfer = "ft_on_transfer",
  /**
   Returns the total supply of fungible tokens as a string representing the value
   as an unsigned 128-bit integer.
   */
  ft_total_supply = "ft_total_supply",
  /**
   * Returns the balance of an account in string form representing a value as an
   * unsigned 128-bit integer. If the account doesn't exist must returns `"0"`.
   */
  ft_balance_of = "ft_balance_of",
}

export enum EFunctionCallMethod_FungibleTokenStandard_Metadata {
  ft_metadata = "ft_metadata",
}

export interface INearFungibleTokenMetadata {
  /**
   *  Should be ft-1.0.0 to indicate that a Fungible Token contract adheres to the current versions
   *  of this Metadata and the Fungible Token Core specs. This will allow consumers of the Fungible
   *  Token to know if they support the features of a given contract.
   */
  spec: string;
  /**
   * the human-readable name of the token.
   */
  name: string;
  /**
   * the abbreviation, like wETH or AMPL.
   */
  symbol: string;
  /**
   * used in frontends to show the proper significant digits of a token.
   */
  decimals: number;
  /**
   * a small image associated with this token. Must be a data URL, to help consumers display
   * it quickly while protecting user data. Recommendation: use optimized SVG, which can result
   * in high-resolution images with only 100s of bytes of storage cost. (Note that these storage
   * costs are incurred to the token owner/deployer, but that querying these icons is a very cheap
   * & cacheable read operation for all consumers of the contract and the RPC nodes that serve the
   * data.)
   *
   * Recommendation: create icons that will work well with both light-mode and dark-mode websites
   * by either using middle-tone color schemes, or by embedding media queries in the SVG.
   */
  icon: string | null;
  /**
   * a link to a valid JSON file containing various keys offering supplementary details on the
   * token. Example: /ipfs/QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm,
   * https://example.com/token.json, etc. If the information given in this document conflicts
   * with the on-chain attributes, the values in reference shall be considered the source of truth.
   */
  reference: string | null;
  /**
   * the base64-encoded sha256 hash of the JSON file contained in the reference field.
   * This is to guard against off-chain tampering.
   */
  reference_hash: string | null;
}
