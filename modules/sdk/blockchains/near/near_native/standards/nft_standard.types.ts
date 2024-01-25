export interface INearNftMetadata {
  /**
   * required, essentially a version like "nft-2.0.0", replacing "2.0.0" with the implemented version of NEP-177
   */
  spec: string;
  /**
   * required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
   */
  name: string;
  /**
   * required, ex. "MOCHI"
   */
  symbol: string;
  /**
   * Data URL
   */
  icon: string | null;
  /**
   * Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
   */
  base_uri: string | null;
  /**
   * URL to a JSON file with more info
   */
  reference: string | null;
  /**
   * Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
   */
  reference_hash: string | null;
}

export interface INearNftTokenData {
  token_id: string;
  owner_id: string;
}

export interface INearNftTokenData_WithMetadata extends INearNftTokenData {
  metadata: INearNftTokenMetadata;
}

export interface INearNftTokenMetadata {
  /**
   * ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
   */
  title: string | null;
  /**
   * free-form description
   */
  description: string | null;
  /**
   * URL to associated media, preferably to decentralized, content-addressed storage
   */
  media: string | null;
  /**
   * Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
   */
  media_hash: string | null;
  /**
   * number of copies of this set of metadata in existence when token was minted.
   */
  copies: number | null;
  /**
   * When token was issued or minted, Unix epoch in milliseconds
   */
  issued_at: number | null;
  /**
   * When token expires, Unix epoch in milliseconds
   */
  expires_at: number | null;
  /**
   * When token starts being valid, Unix epoch in milliseconds
   */
  starts_at: number | null;
  /**
   * When token was last updated, Unix epoch in milliseconds
   */
  updated_at: number | null;
  /**
   * anything extra the NFT wants to store on-chain. Can be stringified JSON.
   */
  extra: string | null;
  /**
   * URL to an off-chain JSON file with more info.
   */
  reference: string | null;
  /**
   * Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
   */
  reference_hash: string | null;
}

export enum ENearFunctionCallMethod_NftStandard {
  /**
   * Simple transfer. Transfer a given `token_id` from current owner to
   * `receiver_id`.
   *
   * Requirements
   * * Caller of the method must attach a deposit of 1 yoctoⓃ for security purposes
   * * Contract MUST panic if called by someone other than token owner or,
   *   if using Approval Management, one of the approved accounts
   * * `approval_id` is for use with Approval Management extension, see
   *   that document for full explanation.
   * * If using Approval Management, contract MUST nullify approved accounts on
   *   successful transfer.
   *
   * Arguments:
   * * `receiver_id`: the valid NEAR account receiving the token
   * * `token_id`: the token to transfer
   * * `approval_id`: expected approval ID. A number smaller than
   *    2^53, and therefore representable as JSON. See Approval Management
   *    standard for full explanation.
   * * `memo` (optional): for use cases that may benefit from indexing or
   *    providing information for a transfer
   *
   * Returns `true` if the token was transferred from the sender's account.
   */
  nft_transfer = "nft_transfer",

  /**
   * Transfer token and call a method on a receiver contract. A successful
   * workflow will end in a success execution outcome to the callback on the NFT
   * contract at the method `nft_resolve_transfer`.
   *
   * You can think of this as being similar to attaching native NEAR tokens to a
   * function call. It allows you to attach any Non-Fungible Token in a call to a
   * receiver contract.
   *
   * Requirements:
   * * Caller of the method must attach a deposit of 1 yoctoⓃ for security
   *   purposes
   * * Contract MUST panic if called by someone other than token owner or,
   *   if using Approval Management, one of the approved accounts
   * * The receiving contract must implement `nft_on_transfer` according to the
   *   standard. If it does not, FT contract's `nft_resolve_transfer` MUST deal
   *   with the resulting failed cross-contract call and roll back the transfer.
   * * Contract MUST implement the behavior described in `nft_resolve_transfer`
   * * `approval_id` is for use with Approval Management extension, see
   *   that document for full explanation.
   * * If using Approval Management, contract MUST nullify approved accounts on
   *   successful transfer.
   *
   * Arguments:
   * * `receiver_id`: the valid NEAR account receiving the token.
   * * `token_id`: the token to send.
   * * `approval_id`: expected approval ID. A number smaller than
   *    2^53, and therefore representable as JSON. See Approval Management
   *    standard for full explanation.
   * * `memo` (optional): for use cases that may benefit from indexing or
   *    providing information for a transfer.
   * * `msg`: specifies information needed by the receiving contract in
   *    order to properly handle the transfer. Can indicate both a function to
   *    call and the parameters to pass to that function.
   */
  nft_transfer_call = "nft_transfer_call",
}

export interface INearNftTokenAttribute {
  trait_type: string;
  value: string;
}

export interface INearNftTokenReference {
  title: string;
  edition: number;
  description: string;
  attributes: INearNftTokenAttribute[];
  animation_url?: string;
}
