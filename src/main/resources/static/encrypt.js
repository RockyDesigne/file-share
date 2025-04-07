// generate key for diffie hellman exchange
async function generateKeyPair() {
    const keypair = await crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"]
    );
    return keypair;
}

//export key as jwk in order to serialize it
async function exportPublicKey(publicKey) {
    const jwk = await crypto.subtle.exportKey("jwk", publicKey);
    return jwk;
}

async function importRemotePublickKey(remoteJwk) {
    const remoteKey = await crypto.subtle.importKey(
        "jwk",
        remoteJwk,
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        false,
        []
    );
    return remoteKey;
}

async function deriveSharedKey(myPrivateKey, remotePublicKey) {
    const sharedSecretKey = await crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: remotePublicKey
        },
        myPrivateKey,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );
    return sharedSecretKey;
}

async function encryptChunk(sharedKey, dataBuffer) {
    const iv = crypto.getRandomValues(new Uint8Array(12)); //96 bit iv for AES-GCM
    const ciphertext = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        sharedKey,
        dataBuffer
    );

    const ivLength = iv.byteLength;
    const ctBytes = new Uint8Array(ciphertext);
    const combined = new Uint8Array(ivLength + ctBytes.byteLength);

    combined.set(iv, 0);
    combined.set(ctBytes, ivLength);

    return combined.buffer;
}

function unpackEncryptedData(buffer) {
    const combined = new Uint8Array(buffer);
    const iv = combined.slice(0,12);
    const ciphertext = combined.slice(12);

    return {iv, ciphertext};
}

async function decryptChunk(sharedKey, iv, ciphertext) {
    const plainBuffer = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        sharedKey,
        ciphertext
    );

    return plainBuffer;
}

async function hashFileSHA256(file) {
    const arrayBuffer = await file.arrayBuffer();

    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
}  

/**
 * Generates an RSA-PSS key pair (PKCS #1 v2.2).
 */
async function generateRsaPssKeyPair() {
    return crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: { name: "SHA-256" },
      },
      true,   // key is extractable (so you can export it if desired)
      ["sign", "verify"]
    );
  }

  /**
 * Converts a hex string (e.g. "aabbcc") to a Uint8Array of bytes.
 */
function hexStringToUint8Array(hex) {
    if (hex.length % 2 !== 0) {
      throw new Error("Invalid hex string length");
    }
    const length = hex.length / 2;
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return result;
  }
  
  /**
   * Converts an ArrayBuffer to a Base64 string.
   */
  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
 * Converts a Base64 string to an ArrayBuffer.
 */
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  /**
   * Signs the given file hash (as a hex string) using the provided RSA private key (RSA-PSS).
   * 
   * @param {CryptoKey} privateKey - The RSA private key (RSA-PSS) with usage "sign".
   * @param {string} fileHashHex - The file's hash in hex string form ("abc123...").
   * @returns {Promise<string>} A Base64-encoded signature.
   */
  async function signHashWithRsa(privateKey, fileHashHex) {
    // 1. Convert the hex-encoded hash to a Uint8Array
    const hashBytes = hexStringToUint8Array(fileHashHex);
  
    // 2. Use the Web Crypto API to sign with RSA-PSS (SHA-256)
    const signatureBuffer = await crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32 // for SHA-256
      },
      privateKey,
      hashBytes
    );
  
    // 3. Convert the resulting signature (ArrayBuffer) to Base64 string
    return arrayBufferToBase64(signatureBuffer);
  }

  /**
 * Imports an RSA public key (in JWK format) as a CryptoKey for RSA-PSS (SHA-256).
 * 
 * @param {JsonWebKey} jwk - The JWK object, e.g. { kty: 'RSA', n: '...', e: '...', alg: 'PS256', ... }
 * @returns {Promise<CryptoKey>} The imported RSA public key as a CryptoKey, usable for ["verify"].
 */
async function importRsaPssPublicKey(jwk) {
    // Some JWKs include "alg": "PS256" to indicate RSA-PSS with SHA-256, 
    // but we still explicitly set the algorithm params for Web Crypto:
    return crypto.subtle.importKey(
      "jwk",       // We are importing from JWK
      jwk,         // The JWK object from your backend
      {
        name: "RSA-PSS",
        hash: { name: "SHA-256" }  // matching "PS256"
      },
      true,        // isExtractable: true if you might re-export, false if not
      ["verify"]   // usage: we only need "verify" for the public key
    );
  }

  /**
 * Verifies that signatureBase64 is a valid signature (RSA-PSS, SHA-256)
 * for the file hash represented by fileHashHex, using the provided publicKey.
 * 
 * @param {CryptoKey} publicKey - The RSA public key (RSA-PSS) for verification.
 * @param {string} fileHashHex - The file's SHA-256 hash in hex string form.
 * @param {string} signatureBase64 - Base64-encoded signature of that file hash.
 * @returns {Promise<boolean>} True if the signature is valid, false otherwise.
 */
async function verifySignedHash(publicKey, fileHashHex, signatureBase64) {
    // 1. Convert the hex-encoded file hash to bytes
    const fileHashBytes = hexStringToUint8Array(fileHashHex);
  
    // 2. Convert the Base64-encoded signature to an ArrayBuffer
    const signatureBuffer = base64ToArrayBuffer(signatureBase64);
  
    // 3. Use the Web Crypto API to verify with RSA-PSS (SHA-256)
    const isValid = await crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32 // typical for SHA-256
      },
      publicKey,
      signatureBuffer,
      fileHashBytes
    );
    
    return isValid;
  }
