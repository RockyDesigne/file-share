class WebSocketMessage {
    constructor(type, senderUsername, receiverUsername, message) {
        this.type = type;  
        this.senderUsername = senderUsername;
        this.receiverUsername = receiverUsername;
        this.message = message;
    }
}
const PUBLIC_KEY_INIT = "publicKeyInit";
const PUBLIC_KEY_RESPONSE = "publicKeyResponse";
const DATA_CHANNEL_BUFFER_THRESHOLD = 64 * 1024; //64 KB
const DATA_CHANNEL_MAX_BUFFER_AMOUNT = 256 * 1024;
const REGISTER = "register";
const OFFER = "offer";
const ANSWER = "answer";
const SEND_FILE_REQUEST = "sendFileRequest";
const SEND_FILE_RESPONSE = "sendFileResponse";
const FILE_RECEIVED = "fileReceived";
const ICE_CANDIDATE = "iceCandidate";
let DIR_HANDLE = null;
let RECEIVED_CHUNKS = [];
let PRIVATE_KEY_RSA = null;
let TOTAL_RECEIVED = 0;
let FILE_SIZE = 0;
let FILE_NAME = null;
let PUBLISHED_FILE_HASH = null;
let PUBLISHED_FILE_SIGNATURE = null;
let IMPORTED_PUBLIC_KEY_RSA = null;
let reader = new FileReader();
let offset = 0;
const chunkSize = 16384; // 16KB chunks
let ws = null;
let folderWatchInterval = null; // Interval for polling changes
let lastKnownFiles = new Map(); // Cache of known files
let peerKeyPair = null;
let derivedSharedKey = null;

const POLL_INTERVAL = 1000; // Check every second

const STUN_SERVERS = {
    iceServers: [
        {
            urls: ['stun:stun.l.google.com:19302'],
        },
        {
            urls: ['stun:stun.l.google.com:5349'],
        }
    ],
    iceCandidatePoolSize: 10,
};

let webSocketMessage = new WebSocketMessage(REGISTER, "", "", "");

//sends a message from user A to user B
function sendMessage(type, senderUsername, receiverUsername, message) {
    webSocketMessage.type = type;
    webSocketMessage.senderUsername = senderUsername;
    webSocketMessage.receiverUsername = receiverUsername;
    webSocketMessage.message = message;
    ws.send(JSON.stringify(webSocketMessage));
}

function initWebsocket(username) {
    ws = new WebSocket("ws://localhost:8081/ws");
    ws.addEventListener("open", () => {
        sendMessage(REGISTER, username, "", "");
    });

    ws.onmessage = e => {
        try {
            const message = JSON.parse(e.data);
            console.log("Received message:", message);
            switch (message.type) {
                case OFFER:
                    handleOffer(message);
                    break;
                case ANSWER:
                    handleAnswer(message);
                    break;
                case ICE_CANDIDATE:
                    handleIceCandidate(message);
                    break;
                default:
                    console.log("Error: Unknown message type: " + message.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error, e.data);
        }
    }

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

let rtcPeerConnection = null;
let dataChannel = null;
let channelOpenResolve = null;
let channelOpenReject = null;

function handleIceCandidate(message) {
    if (message.candidate) {
        console.log("Received ICE candidate:", message.candidate);
        rtcPeerConnection.addIceCandidate(new RTCIceCandidate(message.candidate))
            .then(() => {
                console.log("Successfully added ICE candidate.");
            })
            .catch(error => {
                console.error("Error adding ICE candidate:", error);
            });
    }
}

function handleOffer(offer) {
    console.log("Handling offer from:", offer.senderUsername);
    if (rtcPeerConnection) {
        rtcPeerConnection.close();
    }
    rtcPeerConnection = new RTCPeerConnection();
    rtcPeerConnection.onicecandidate = (e) => {
        if (!e.candidate) {
            console.log("all candidates have been generated, now sending answer...");
            sendMessage(ANSWER, offer.receiverUsername, offer.senderUsername, rtcPeerConnection.localDescription);
        }
    }
    rtcPeerConnection.ondatachannel = (e) => {
        console.log("Data channel:", e);
        dataChannel = e.channel;
        setupDataChannelHandlersForSendingFile(dataChannel);
    };
    rtcPeerConnection.setRemoteDescription(offer.message).then(console.log("offer set, establishing p2p conn..."));
    rtcPeerConnection.createAnswer().then((a) => rtcPeerConnection.setLocalDescription(a).then(console.log("answer created")));    
}

function handleAnswer(answer) {
    console.log("got answer from: " + answer.senderUsername);
    console.log("answer: " + answer.message);

    rtcPeerConnection.setRemoteDescription(answer.message);

}

function initiateOffer(senderUsername, receiverUsername) {
    if (rtcPeerConnection) {
        rtcPeerConnection.close();
    }

    rtcPeerConnection = new RTCPeerConnection(STUN_SERVERS);

    dataChannel = rtcPeerConnection.createDataChannel("dataChannel");
    setupDataChannelHandlersForFileRequest(dataChannel);

    rtcPeerConnection.onicecandidate = (e) => {
        if (!e.candidate) {
            console.log("all candidates have been generated, now sending offer...");
            sendMessage(OFFER, senderUsername, receiverUsername, rtcPeerConnection.localDescription);
        }
    }
    rtcPeerConnection.createOffer().then((o) => rtcPeerConnection.setLocalDescription(o).then(console.log("offer created, establishing p2p")));

}

function setupDataChannelHandlersForSendingFile(channel) {
    channel.bufferedAmountLowThreshold = DATA_CHANNEL_BUFFER_THRESHOLD;
    channel.onmessage = handleWebRtcMessage;
    channel.onopen = () => {
        console.log("Data channel opened, p2p conn established!");
    };
    channel.onclose = () => console.log("Data channel closed!");
    channel.onerror = (error) => {
        console.error("Data channel error:", error);
    };
}

function setupDataChannelHandlersForFileRequest(channel) {
    channel.onmessage = handleWebRtcMessage;
    channel.onopen = () => {
        console.log("Data channel opened, p2p conn established!");
        startKeyExchange().then(() => console.log("key exchange started..."));
    };
    channel.onclose = () => console.log("Data channel closed");
    channel.onerror = (error) => {
        console.error("Data channel error:", error);
    };
}

function readNextChunk(file) {
    const slice = file.slice(offset, offset + chunkSize);  // Get the next slice of the file
    reader.readAsArrayBuffer(slice);
}

async function sendFile(file) {

    offset = 0;

    dataChannel.onbufferedamountlow = () => {
        console.log("buffer drained, sending...");
        readNextChunk(file);
    }

    readNextChunk(file);

    reader.onload = (event) => {
        // When the file slice is read, send it over the data channel
        const chunk = event.target.result;
        if (offset >= file.size) {
            return;
        }

        encryptChunk(derivedSharedKey, chunk)
        .then(encryptedChunk => sendMessageViaChannel(encryptedChunk, dataChannel));

        //rtcPeerConnection.dc.send(JSON.stringify(packet));
        offset += chunk.byteLength;  // Move the offset for the next chunk

        // Send the next chunk if there is more data
        if (offset < file.size) {
            if (dataChannel.bufferedAmount < DATA_CHANNEL_MAX_BUFFER_AMOUNT) {
                readNextChunk(file);
            } else {
                console.log("sending paused because buffer is full...");
            }
        } else {
            console.log("File transfer complete.");
        }
    };

    reader.onerror = (error) => {
        console.error("Error reading file:", error);
    };
}

async function getFileHandle(fileName) {
    if (DIR_HANDLE == null) {
        sendMessageViaChannel("User is no longer sharing the requested file!", dataChannel);
    }
    try {
        const fileHandle = await DIR_HANDLE.getFileHandle(fileName);
        console.log("got file handle");
        return fileHandle;
    } catch (error) {
        console.error("Error in getFileHandle: " + error);
    }
}

async function getFile(fileHandle) {
    try {
        const file = await fileHandle.getFile();
        console.log("got file");
        return file;
    } catch (error) {
        console.error("Error in getFile: " + error);
    }
}

function handleSendFileResponse(data) {
    if (data instanceof ArrayBuffer) {
        RECEIVED_CHUNKS.push(data);
        TOTAL_RECEIVED += data.byteLength;
        
        console.log(`Received chunk: ${TOTAL_RECEIVED}/${FILE_SIZE} bytes`);
        
        if (TOTAL_RECEIVED === FILE_SIZE) {
            console.log("File transfer complete, creating download");
            const completeFile = new Blob(RECEIVED_CHUNKS);
            hashFileSHA256(completeFile).then((receivedFileHash) => {
                //sign the received file hash and check against the published signed hash signature
                if (receivedFileHash === PUBLISHED_FILE_HASH) {
                    console.log("Received file hash: " + receivedFileHash + 
                        " matches published file hash: " + PUBLISHED_FILE_HASH);
                    if (verifySignedHash(IMPORTED_PUBLIC_KEY_RSA, receivedFileHash, PUBLISHED_FILE_SIGNATURE)) {  
                        console.log("Signature is valid, beggining download."); 
                        const downloadLink = document.createElement('a');
                        downloadLink.href = URL.createObjectURL(completeFile);
                        downloadLink.download = FILE_NAME;
                        downloadLink.click();
                    } else {
                        console.log("Signature is invalid, download aborted!");
                    }
                } else {
                    console.error("Received file hash: " + receivedFileHash + 
                        " doesn't match published file hash: " + PUBLISHED_FILE_HASH);
                }
            })
            
            // Reset state
            RECEIVED_CHUNKS = [];
            TOTAL_RECEIVED = 0;
            FILE_SIZE = 0;
        }
    } else {
        console.error("Error in handleFileResponse: message.data not instance of ArrayBuffer!");
    }
}

async function handleSendFileRequest(message) {
    console.log("Handling file request for:", message.fileName);
    try {
        const fileHandle = await getFileHandle(message.fileName);
        if (!fileHandle) {
            console.error("Could not get file handle for:", message.fileName);
            return;
        }
        
        const file = await getFile(fileHandle);
        if (!file) {
            console.error("Could not get file:", message.fileName);
            return;
        }
        
        console.log("Starting file transfer for:", file.name);
        await sendFile(file);
    } catch (error) {
        console.error("Error in handleSendFileRequest:", error);
    }
}

async function startKeyExchange() {
    console.log("generating Key pair...");
    peerKeyPair = await generateKeyPair();
    console.log("key pair generated: ", peerKeyPair);

    let publicKeyJwk = await exportPublicKey(peerKeyPair.publicKey);
    console.log("exported public key jwk: ", publicKeyJwk);

    sendMessageViaChannel(JSON.stringify({
        type: PUBLIC_KEY_INIT,
        publicKey: publicKeyJwk
    }), dataChannel);
}

async function handleReceivePeerPublicKeyInit(message) {

    console.log("generating Key pair...");
    peerKeyPair = await generateKeyPair();
    console.log("key pair generated: ", peerKeyPair);

    console.log("public key received: ", message.publicKey);
    let jwk = message.publicKey;
    console.log("got jwk: ", jwk);
    let remotePublicKey = await importRemotePublickKey(jwk);
    console.log(getAuthUser(), " imported peer's remote public key: ", remotePublicKey);

    derivedSharedKey = await deriveSharedKey(peerKeyPair.privateKey, remotePublicKey);
    console.log("shared key: ", derivedSharedKey);

    let publicKeyJwk = await exportPublicKey(peerKeyPair.publicKey);
    console.log("exported public key jwk: ", publicKeyJwk);

    sendMessageViaChannel(JSON.stringify({
        type: PUBLIC_KEY_RESPONSE,
        publicKey: publicKeyJwk
    }), dataChannel);
}

async function handleReceivePeerPublicKeyResponse(message) {
    console.log("public key received: ", message.publicKey);
    let jwk = message.publicKey;
    console.log("got jwk: ", jwk);
    let remotePublicKey = await importRemotePublickKey(jwk);
    console.log(getAuthUser(), " imported peer's remote public key: ", remotePublicKey);

    derivedSharedKey = await deriveSharedKey(peerKeyPair.privateKey, remotePublicKey);
    console.log("shared key: ", derivedSharedKey);

    //now that key exchange is done, we can ask for file
    console.log("key exchange completed, now asking for file: " + FILE_NAME);
    askForFile(FILE_NAME);
}

function handleWebRtcMessage(event) {
    if (event.data instanceof ArrayBuffer) {

        const {iv, ciphertext} = unpackEncryptedData(event.data);

        decryptChunk(derivedSharedKey, iv, ciphertext)
        .then(decryptedBuffer => {
            handleSendFileResponse(decryptedBuffer);
        })
        .catch(error => console.error("error decrypting: ", error));

        return;
    }
    try {
        const message = JSON.parse(event.data);
        switch (message.type) {
            case SEND_FILE_REQUEST:
                handleSendFileRequest(message)
                .then(() => {
                    console.log("handled key exchange success...")
                })
                .catch((error) => {
                    console.error("handled key exchange error...", error);
                });
                break;
            case PUBLIC_KEY_INIT:
                handleReceivePeerPublicKeyInit(message);   
                break; 
            case PUBLIC_KEY_RESPONSE:
                handleReceivePeerPublicKeyResponse(message);
                break;
            default:
                console.log("Error: Unknown message type: " + message.type);
        }
    } catch (error) {
        console.error('Error parsing message:', error, event.data);
    }
}

function sendMessageViaChannel(message, channel) {
    try {
        channel.send(message);
    } catch (error) {
        console.error("Error in sendMessageViaChannel: " + error);
    }
}

function askForFile(fileName) {
    RECEIVED_CHUNKS = [];
    TOTAL_RECEIVED = 0;
    const sendFileRequest = {type:SEND_FILE_REQUEST, fileName:fileName};
    sendMessageViaChannel(JSON.stringify(sendFileRequest), dataChannel);
}

async function getFilesFromDirectory(dir_handle) {
    const files = []; // Array to store file entries

    for await (const entry of dir_handle.values()) {
        if (entry.kind === "file") {
            // If it's a file, get the File object
            const file = await entry.getFile();
            files.push({
                name: file.name,
                size: file.size,
                type: file.type,
            });
        } else if (entry.kind === "directory") {
            // Optionally, you can recursively handle subdirectories
            console.log(`Skipping directory: ${entry.name}`);
        }
    }

    return files;
}

// Function to get file metadata
async function getFileMetadata(fileHandle) {
    const file = await fileHandle.getFile();
    return {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
    };
}

// Function to publish file metadata to server
async function publishFileMetadata(fileList, action = 'add') {
    const url = `http://localhost:8081/file-management/${action}-file`;
    const token = getAuthToken();
    
    if (!token) {
        console.error('No auth token found');
        return;
    }

        fileList = fileList.map(file => ({
            ...file,
            userName: getAuthUser()
        }));
        console.log(fileList);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fileList)
        });

}

// Function to get file fingerprint (for change detection)
async function getFileFingerprint(fileHandle) {
    const file = await fileHandle.getFile();
    const fileHash = await hashFileSHA256(file);
    const hashSignature = await signHashWithRsa(PRIVATE_KEY_RSA, fileHash);
    console.log("Signed the hash of the file with the RSA private key: ", hashSignature);
    //sign the hash before sending it
    return {
        name: file.name,
        size: file.size,
        hash: fileHash,
        signature: hashSignature,
        lastModified: file.lastModified
    };
}

// Function to detect changes in directory
async function checkForChanges(dirHandle) {
    const currentFiles = new Map();
    
    // Get all current files
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
            const fingerprint = await getFileFingerprint(entry);
            currentFiles.set(entry.name, {
                handle: entry,
                fingerprint: fingerprint
            });
        }
    }

    // Check for new and modified files
    for (const [name, fileInfo] of currentFiles) {
        const oldFile = lastKnownFiles.get(name);
        if (!oldFile) {
            // New file
            await publishFileMetadata(fileInfo.fingerprint, 'add');
        } else if (JSON.stringify(oldFile.fingerprint) !== JSON.stringify(fileInfo.fingerprint)) {
            // Modified file
            await publishFileMetadata(fileInfo.fingerprint, 'update');
        }
    }

    // Check for deleted files
    for (const [name, fileInfo] of lastKnownFiles) {
        if (!currentFiles.has(name)) {
            // File was deleted
            await publishFileMetadata(fileInfo.fingerprint, 'remove');
        }
    }

    // Update cache
    lastKnownFiles = currentFiles;
}

// Function to stop watching folder
function stopWatchingFolder() {
    if (folderWatchInterval) {
        clearInterval(folderWatchInterval);
        folderWatchInterval = null;
    }
    lastKnownFiles.clear();
}

// Function to start watching folder
async function startWatchingFolder(dirHandle) {
    stopWatchingFolder();

    // Do initial scan
    await checkForChanges(dirHandle);

    // Start polling for changes
    folderWatchInterval = setInterval(async () => {
        try {
            await checkForChanges(dirHandle);
        } catch (error) {
            console.error('Error checking for changes:', error);
            showError('Error checking for changes', error);
        }
    }, POLL_INTERVAL);
}

async function pickFolderToShare() {
    console.log("pick");
    DIR_HANDLE = await window.showDirectoryPicker();
    const files = [];
    for await (const entry of DIR_HANDLE.values()) {
        if (entry.kind === 'file') {
            const fingerprint = await getFileFingerprint(entry);
            files.push(fingerprint);
        }
    }

    console.log("Adding files");
    await publishFileMetadata(files, 'add');
    console.log("File list added");

}

// // Modified pickFolderToShare function
// async function pickFolderToShare() {
//     return safeExecute(async () => {
//         stopWatchingFolder();

//         try {
//             // Handle directory picker cancel/dismiss
//             DIR_HANDLE = await window.showDirectoryPicker().catch(e => {
//                 if (e.name === 'AbortError') {
//                     // User cancelled the picker - don't treat as error
//                     console.log('Folder picker was cancelled');
//                     return null;
//                 }
//                 throw e; // Re-throw other errors
//             });

//             // If user cancelled, just return
//             if (!DIR_HANDLE) {
//                 return;
//             }

//             // Get initial file list
//             const files = [];
//             for await (const entry of DIR_HANDLE.values()) {
//                 if (entry.kind === 'file') {
//                     const fingerprint = await getFileFingerprint(entry);
//                     files.push(fingerprint);
//                 }
//             }
            
//             // Publish initial files
//             for (const file of files) {
//                 await safeExecute(async () => {
//                     await publishFileMetadata(file, 'add');
//                 });
//             }

//             // Start watching for changes
//             await startWatchingFolder(DIR_HANDLE);
//             console.log("Started sharing folder:", DIR_HANDLE.name);
//         } catch (error) {
//             console.error("Error in pickFolderToShare:", error);
//             showError('Error sharing folder', error);
//         }
//     });
// }

// Function to show error in UI
function showError(message, error) {
    const errorDiv = document.getElementById('error-messages') || createErrorDiv();
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.cssText = `
        background-color: #ff5252;
        color: white;
        padding: 15px;
        margin: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        max-width: 400px;
        word-break: break-word;
    `;
    errorMessage.innerHTML = `
        <strong>${message}</strong>
        ${error ? `<pre style="margin: 10px 0; font-size: 12px; white-space: pre-wrap;">${error.name}: ${error.message}</pre>` : ''}
    `;
    errorDiv.appendChild(errorMessage);
    
    // Add fade out animation
    setTimeout(() => {
        errorMessage.style.transition = 'opacity 0.5s';
        errorMessage.style.opacity = '0';
        setTimeout(() => errorMessage.remove(), 500);
    }, 4500);
}

// Create error div if it doesn't exist
function createErrorDiv() {
    const div = document.createElement('div');
    div.id = 'error-messages';
    div.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000;';
    document.body.appendChild(div);
    return div;
}

// Add global error handlers to prevent page reloads
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showError('An error occurred', event.error);
    event.preventDefault();
    return true;
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showError('Unhandled promise rejection', event.reason);
    event.preventDefault();
    return true;
});

// Function to safely execute async operations
async function safeExecute(operation) {
    try {
        return await operation();
    } catch (error) {
        console.error('Operation failed:', error);
        showError('Operation failed', error);
        return null;
    }
}

function hangUp() {
    if (dataChannel) {
        dataChannel.close();
    }
    if (rtcPeerConnection) {
        rtcPeerConnection.close();
    }
}
