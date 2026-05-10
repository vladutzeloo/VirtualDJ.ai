import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

const CRED_STORAGE_KEY = 'vdj.vault.credential';
const RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const RP_NAME = 'VirtualDJ.AI Neural Vault';

function randomChallenge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomUserId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface BiometricSupport {
  supported: boolean;
  platformAvailable: boolean;
}

export const checkBiometricSupport = async (): Promise<BiometricSupport> => {
  if (!browserSupportsWebAuthn()) {
    return { supported: false, platformAvailable: false };
  }
  const platformAvailable = await platformAuthenticatorIsAvailable();
  return { supported: true, platformAvailable };
};

export const isVaultRegistered = (): boolean => {
  return Boolean(localStorage.getItem(CRED_STORAGE_KEY));
};

export const registerBiometric = async (username = 'vdj-operator') => {
  const userId = randomUserId();
  const options: PublicKeyCredentialCreationOptionsJSON = {
    rp: { id: RP_ID, name: RP_NAME },
    user: {
      id: userId,
      name: username,
      displayName: username,
    },
    challenge: randomChallenge(),
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
  };

  const credential = await startRegistration({ optionsJSON: options });
  localStorage.setItem(
    CRED_STORAGE_KEY,
    JSON.stringify({ id: credential.id, userId }),
  );
  return credential;
};

export const authenticateBiometric = async () => {
  const stored = localStorage.getItem(CRED_STORAGE_KEY);
  const allow = stored ? [JSON.parse(stored).id] : [];

  const options: PublicKeyCredentialRequestOptionsJSON = {
    rpId: RP_ID,
    challenge: randomChallenge(),
    timeout: 60000,
    userVerification: 'required',
    allowCredentials: allow.map((id) => ({ id, type: 'public-key' as const })),
  };

  return startAuthentication({ optionsJSON: options });
};

export const resetVaultCredential = () => {
  localStorage.removeItem(CRED_STORAGE_KEY);
};
