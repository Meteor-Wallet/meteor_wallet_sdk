import { baseEncode, baseDecode } from '@near-js/utils';
import { ed25519 } from "@noble/curves/ed25519.js";
import secp256k1 from 'secp256k1';

import { KeySize, KeyType } from './constants'
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

function key_type_to_str(keyType: KeyType): string {
    switch (keyType) {
        case KeyType.ED25519: return 'ed25519';
        case KeyType.SECP256K1: return 'secp256k1';
        case KeyType.MLDSA65: return 'ml-dsa-65';
        default: throw new Error(`Unknown key type ${keyType}`);
    }
}

function str_to_key_type(keyType: string): KeyType {
    switch (keyType.toLowerCase()) {
        case 'ed25519': return KeyType.ED25519;
        case 'secp256k1': return KeyType.SECP256K1;
        case 'ml-dsa-65': return KeyType.MLDSA65;
        default: throw new Error(`Unknown key type ${keyType}`);
    }
}

// @ts-ignore: originated from near-api-js
class ED25519PublicKey { keyType: KeyType = KeyType.ED25519; data: Uint8Array; }
// @ts-ignore: originated from near-api-js
class SECP256K1PublicKey { keyType: KeyType = KeyType.SECP256K1; data: Uint8Array; }
// @ts-ignore: custom Meteor Wallet shim
class MLDSA65PublicKey { keyType: KeyType = KeyType.MLDSA65; data: Uint8Array; }

function resolveEnumKeyName(keyType: KeyType) {
    switch (keyType) {
        case KeyType.ED25519: {
            return 'ed25519Key';
        }
        case KeyType.SECP256K1: {
            return 'secp256k1Key';
        }
        case KeyType.MLDSA65: {
            return 'mlDsa65Key';
        }
        default: {
            throw Error(`unknown type ${keyType}`);
        }
    }
}

/**
 * DUPLICATED FROM @near-js/types - REPLACE WITH IMPORTED REFERENCE AND DELETE
 * This ends up being necessary for Wallet Selector dependencies with
 * outdated peer dependencies and should only be temporary
 */
abstract class Enum {
    abstract enum: string;

    constructor(properties: any) {
        if (Object.keys(properties).length !== 1) {
            throw new Error('Enum can only take single value');
        }
        Object.keys(properties).map((key: string) => {
            (this as any)[key] = properties[key];
        });
    }
}

/**
 * PublicKey representation that has type and bytes of the key.
 */

export class PublicKey extends Enum {
    enum: string;
    ed25519Key?: ED25519PublicKey;
    secp256k1Key?: SECP256K1PublicKey;
    mlDsa65Key?: MLDSA65PublicKey;

    constructor(publicKey: { keyType: KeyType, data: Uint8Array }) {
        const keyName = resolveEnumKeyName(publicKey.keyType);
        super({ [keyName]: publicKey });
        this[keyName] = publicKey;
        this.enum = keyName;
    }

    /**
     * Creates a PublicKey instance from a string or an existing PublicKey instance.
     * @param value The string or PublicKey instance to create a PublicKey from.
     * @returns {PublicKey} The PublicKey instance.
     */
    static from(value: string | PublicKey): PublicKey {
        if (typeof value === 'string') {
            return PublicKey.fromString(value);
        }
        return value;
    }

    /**
     * Creates a PublicKey instance from an encoded key string.
     * @param encodedKey The encoded key string.
     * @returns {PublicKey} The PublicKey instance created from the encoded key string.
     */
    static fromString(encodedKey: string): PublicKey {
        const parts = encodedKey.split(':');
        let publicKey: string;
        let keyType;
        if (parts.length === 1) {
            publicKey = parts[0];
        } else if (parts.length === 2) {
            publicKey = parts[1];
            keyType = str_to_key_type(parts[0]);
        } else {
            throw new Error('Invalid encoded key format, must be <curve>:<encoded key>');
        }
        const decodedPublicKey = baseDecode(publicKey);
        if (!keyType) {
            if (decodedPublicKey.length === KeySize.MLDSA65_PUBLIC_KEY) {
                keyType = KeyType.MLDSA65;
            } else {
                keyType = decodedPublicKey.length === KeySize.SECP256k1_PUBLIC_KEY ? KeyType.SECP256K1 : KeyType.ED25519;
            }
        }
        const keySize =
            keyType === KeyType.ED25519
                ? KeySize.ED25519_PUBLIC_KEY
                : keyType === KeyType.SECP256K1
                    ? KeySize.SECP256k1_PUBLIC_KEY
                    : KeySize.MLDSA65_PUBLIC_KEY;
        if (decodedPublicKey.length !== keySize) {
            throw new Error(`Invalid public key size (${decodedPublicKey.length}), must be ${keySize}`);
        }
        return new PublicKey({ keyType, data: decodedPublicKey });
    }

    /**
     * Returns a string representation of the public key.
     * @returns {string} The string representation of the public key.
     */
    toString(): string {
        const encodedKey = baseEncode(this.data);
        return `${key_type_to_str(this.keyType)}:${encodedKey}`;
    }

    /**
     * Verifies a message signature using the public key.
     * @param message The message to be verified.
     * @param signature The signature to be verified.
     * @returns {boolean} `true` if the signature is valid, otherwise `false`.
     */
    verify(message: Uint8Array, signature: Uint8Array): boolean {
        const keyType = this.keyType;
        const data = this.data;
        switch (keyType) {
            case KeyType.ED25519:
                return ed25519.verify(signature, message, data);
            case KeyType.SECP256K1:
                return secp256k1.ecdsaVerify(signature.subarray(0, 64), message, new Uint8Array([0x04, ...data]));
            case KeyType.MLDSA65:
                return ml_dsa65.verify(signature, message, data)
            default:
                throw new Error(`Unknown key type: ${keyType}`);
        }
    }

    get keyPair() {
        const keyPair = this.ed25519Key || this.secp256k1Key || this.mlDsa65Key
        if(!keyPair){
            throw new Error("Empty KeyPair")
        }
        return keyPair;
    }

    get keyType(): KeyType {
        return this.keyPair.keyType;
    }

    get data(): Uint8Array {
        return this.keyPair.data;
    }
}
