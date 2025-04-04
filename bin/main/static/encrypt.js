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
