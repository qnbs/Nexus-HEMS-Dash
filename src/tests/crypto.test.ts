import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../lib/crypto';

describe('Web Crypto AES-GCM 256-bit', () => {
  const passphrase = 'test-passphrase-2026';

  it('should encrypt and decrypt a string roundtrip', async () => {
    const plaintext = 'sk-abcdef1234567890';
    const encrypted = await encrypt(plaintext, passphrase);
    const decrypted = await decrypt(encrypted, passphrase);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for same plaintext (random IV)', async () => {
    const plaintext = 'same-key-value';
    const a = await encrypt(plaintext, passphrase);
    const b = await encrypt(plaintext, passphrase);
    expect(a).not.toBe(b);
  });

  it('should fail to decrypt with wrong passphrase', async () => {
    const encrypted = await encrypt('secret', passphrase);
    await expect(decrypt(encrypted, 'wrong-passphrase')).rejects.toThrow();
  });

  it('should handle empty string', async () => {
    const encrypted = await encrypt('', passphrase);
    const decrypted = await decrypt(encrypted, passphrase);
    expect(decrypted).toBe('');
  });

  it('should handle unicode characters', async () => {
    const plaintext = '🔑 API-Schlüssel für KI-Optimierung';
    const encrypted = await encrypt(plaintext, passphrase);
    const decrypted = await decrypt(encrypted, passphrase);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce base64-encoded output', async () => {
    const encrypted = await encrypt('test', passphrase);
    // base64 chars only
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});
