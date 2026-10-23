const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export async function generateHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: "HMAC",
      hash: "SHA-256",
      length: 256,
    },
    true,
    ["sign", "verify"]
  );
}

export async function createHmac(
  input: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    data
  );

  return bytesToHex(new Uint8Array(signature));
}

export async function verifyHmac(
  input: string,
  hmac: string,
  key: CryptoKey
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  const signature = new Uint8Array(
    hmac.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    data
  );
}