import { Enum } from '@near-js/types';
import { KeyType } from './constants';

// Type shells only — never constructed; Signature's constructor stores the raw
// { keyType, data } object under the matching enum key, so `data` needs no initializer.
class ED25519Signature { keyType: KeyType = KeyType.ED25519; declare data: Uint8Array; }
class SECP256K1Signature { keyType: KeyType = KeyType.SECP256K1; declare data: Uint8Array; }
class MLDsa65Signature { keyType: number = KeyType.MLDSA65; declare data: Uint8Array; }

function resolveEnumKeyName(keyType: KeyType | number) {
    switch (keyType) {
        case KeyType.ED25519: {
            return 'ed25519Signature';
        }
        case KeyType.SECP256K1: {
            return 'secp256k1Signature';
        }
        case 2: {
            return 'mlDsa65Signature';
        }
        default: {
            throw Error(`unknown type ${keyType}`);
        }
    }
}

export class Signature extends Enum {
    enum: string;
    ed25519Signature?: ED25519Signature;
    secp256k1Signature?: SECP256K1Signature;
    mlDsa65Signature?: MLDsa65Signature;

    constructor(signature: { keyType: KeyType | number, data: Uint8Array }) {
        const keyName = resolveEnumKeyName(signature.keyType);
        super({ [keyName]: signature });
        this[keyName] = signature;
        this.enum = keyName;
    }

    get signature(): ED25519Signature | SECP256K1Signature | MLDsa65Signature {
        const signature = this.ed25519Signature || this.secp256k1Signature || this.mlDsa65Signature;
        if (signature == null) {
            // Unreachable: the constructor always sets exactly one variant.
            throw new Error("Signature has no variant set");
        }
        return signature;
    }

    get signatureType(): KeyType | number {
        return this.signature.keyType;
    }

    get data(): Uint8Array {
        return this.signature.data;
    }
}
