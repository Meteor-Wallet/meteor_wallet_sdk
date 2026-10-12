/**
 * The origin this harness claims as `partnerMetadata.originUrl`. Read once at init, like
 * `?backend=`: the SDK pins its config per instance, so switching is a full navigation.
 *
 * Over the mobile bridge a partner's origin is self-declared, so it can claim any site. The Full
 * Access Key test uses that to look like an allow-listed account recovery service, or like a
 * lookalike that isn't one:
 *
 *   (default)                   this page's real origin
 *   ?partnerOrigin=nearaccounts https://nearaccounts.com (on the wallets' Full Access Key allow-list)
 *   ?partnerOrigin=lookalike    https://nearaccounts.com.evil.example (not on it)
 *   ?partnerOrigin=<url>        anything else, verbatim
 *
 * Meteor Web and the extension don't use this claim: they check the origin the browser reports,
 * which is always this page's real one.
 */
export const PARTNER_ORIGIN_PRESETS = {
  nearaccounts: "https://nearaccounts.com",
  lookalike: "https://nearaccounts.com.evil.example",
} as const;

export type TPartnerOriginPreset = keyof typeof PARTNER_ORIGIN_PRESETS;

/** Mirrors the wallets' Full Access Key allow-list, to say which outcome to expect */
export const FULL_ACCESS_KEY_ALLOW_LISTED_ORIGINS: readonly string[] = [
  "https://nearaccounts.com",
  "https://testnet.nearaccounts.com",
];

export const getPartnerOriginParam = (): string | null =>
  typeof window === "undefined"
    ? null
    : new URLSearchParams(window.location.search).get("partnerOrigin");

export const resolvePartnerOrigin = (): string => {
  const requested = getPartnerOriginParam();
  if (requested == null) return window.location.origin;
  return PARTNER_ORIGIN_PRESETS[requested as TPartnerOriginPreset] ?? requested;
};

/** Reloads the harness claiming `preset`'s origin, or its real one for `null`. */
export const switchPartnerOrigin = (preset: TPartnerOriginPreset | null) => {
  const url = new URL(window.location.href);
  if (preset == null) {
    url.searchParams.delete("partnerOrigin");
  } else {
    url.searchParams.set("partnerOrigin", preset);
  }
  window.location.assign(url.toString());
};
