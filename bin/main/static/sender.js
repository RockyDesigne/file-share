
class WebSocketMessage {
    constructor(type, senderUsername, receiverUsername, message) {
        this.type = type;
        this.senderUsername = senderUsername;
        this.receiverUsername = receiverUsername;
        this.message = message;
    }
}

let webSocketMessage = new WebSocketMessage(null,null,null,null);

const REGISTER = "register";
const OFFER = "offer";
const ANSWER = "answer";
const SEND_FILE_REQUEST = "sendFileRequest";
const SEND_FILE_RESPONSE = "sendFileResponse";
const FILE_RECEIVED = "fileReceived";
const ICE_CANDIDATE = "iceCandidate";
DIR_HANDLE = null;
let RECEIVED_CHUNKS = [];
let TOTAL_RECEIVED = 0;
let FILE_SIZE = 11;
const chunkSize = 16384;  // 16KB per chunk (adjust as needed)
let offset = 0;
let reader = new FileReader();
let ws = null;
const STUN_SERVERS = {
    iceServers: [
        {
            urls: ['stun:stun.l.google.com:19302','stun:stun.l.google.com:5349'],
        },
    ],
    iceCandidatePoolSize: 10,
};

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
        sendMessage(REGISTER, username, null, null);
    });

    ws.onmessage = e => {
        try {
            const message = JSON.parse(e.data);
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

}

let rtcPeerConnection = new RTCPeerConnection(STUN_SERVERS);

rtcPeerConnection.onicecandidate = event => {
    if (event.candidate) {
        webSocketMessage.message = JSON.stringify({ type: ICE_CANDIDATE, candidate: event.candidate });
        ws.send(JSON.stringify(webSocketMessage));
    } else {
        console.log("All ICE candidates have been sent.");
    }
};

let sendDataChannel = null;

function handleIceCandidate(message) {
    if (message.candidate) {
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

    setUpRtcConnection();

        rtcPeerConnection.setRemoteDescription(offer)
            .then(() => {
                return rtcPeerConnection.createAnswer();
            })
            .then((answer) => {
                return rtcPeerConnection.setLocalDescription(answer);
            })
            .then(() => {
                webSocketMessage.
                ws.send(JSON.stringify(rtcPeerConnection.localDescription));
            })
            .catch((error) => {
                console.error("Error handling offer:", error);
            });
}

function handleAnswer(answer) {
    rtcPeerConnection.setRemoteDescription(answer);
}

function initiateOffer(senderUsername, receiverUsername) {

    setUpRtcConnection();

    setUpChannel();

    rtcPeerConnection.createOffer()
        .then(offer => {
            return rtcPeerConnection.setLocalDescription(offer);
        })
        .then(() => {
            webSocketMessage.type = OFFER;
            webSocketMessage.senderUsername = senderUsername;
            webSocketMessage.receiverUsername = receiverUsername;
            webSocketMessage.message = rtcPeerConnection.localDescription;
            ws.send(JSON.stringify(webSocketMessage));
        })
        .catch(error => {
            console.error('Error creating or sending offer:', error);
        });
}

function setUpChannel() {
    sendDataChannel = rtcPeerConnection.createDataChannel("sendDataChannel");

    sendDataChannel.onmessage = handleWebRtcMessage;

    sendDataChannel.onopen = e => console.log("channel open");

    sendDataChannel.onclose = () => console.log("Data channel closed");
}

function readNextChunk(file) {
    const slice = file.slice(offset, offset + chunkSize);  // Get the next slice of the file
    reader.readAsArrayBuffer(slice);
}

async function sendFile(file) {

    offset = 0;

    readNextChunk(file);

    reader.onload = (event) => {
        // When the file slice is read, send it over the data channel
        const chunk = event.target.result;
        sendMessageViaChannel(chunk, rtcPeerConnection.dc);
        //rtcPeerConnection.dc.send(JSON.stringify(packet));
        offset += chunk.byteLength;  // Move the offset for the next chunk

        // Send the next chunk if there is more data
        if (offset < file.size) {
            readNextChunk(file);
        } else {
            console.log("File transfer complete.");
        }
    };

    reader.onerror = (error) => {
        console.error("Error reading file:", error);
    };
}

async function getFileHandle(fileName) {
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

        if (TOTAL_RECEIVED === FILE_SIZE) {
            console.log("received the whole of the file");
            const completeFile = new Blob(RECEIVED_CHUNKS);
            const file = new File([completeFile], "receivedFile");
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(file);
            downloadLink.download = file.name;
            downloadLink.click();  // Trigger file download
        }

    } else {
        console.error("Error in handleFileResponse: message.data not instance of ArrayBuffer!");
    }
}

async function handleSendFileRequest(message) {

    const fileHandle = await getFileHandle(message.fileName);
    const file = await getFile(fileHandle);

    await sendFile(file);

    console.log("file request received!");
}

function handleWebRtcMessage(event) {
    if (event.data instanceof ArrayBuffer) {
        handleSendFileResponse(event.data);
        return;
    }
    try {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case SEND_FILE_REQUEST:
                    handleSendFileRequest(message);
                    break;
                case SEND_FILE_RESPONSE:
                    handleSendFileResponse(message);
                    break;
                default:
                    console.log("Error: Unknown message type: " + message.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error, event.data);
        }
}

function setUpRtcConnection() {
    rtcPeerConnection = new RTCPeerConnection(STUN_SERVERS);

    rtcPeerConnection.ondatachannel = e => {
            rtcPeerConnection.dc = e.channel;
            rtcPeerConnection.dc.onmessage = handleWebRtcMessage;
            rtcPeerConnection.dc.onopen = e => console.log("conn opened");
            rtcPeerConnection.dc.onclose = () => console.log("Data channel closed");
        }
    rtcPeerConnection.onicecandidate = event => {
        if (event.candidate) {
            ws.send(JSON.stringify({ type: ICE_CANDIDATE, candidate: event.candidate }));
        } else {
            console.log("All ICE candidates have been sent.");
        }
    };
}

function hangUp() {
    if (sendDataChannel) {
        sendDataChannel.close();
    }
    if (rtcPeerConnection.dc) {
        rtcPeerConnection.dc.close();
    }
    rtcPeerConnection.close();
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
    sendMessageViaChannel(JSON.stringify(sendFileRequest), sendDataChannel);
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
//TO DO:
// PUSH THE FILES TO SERVER
// REPLACE ALL FILES EACH TIME BUTTON IS PRESSED
async function pickFolderToShare() {
    DIR_HANDLE = await window.showDirectoryPicker();
    const files = await getFilesFromDirectory(DIR_HANDLE);
    console.log("Files in directory:", files);
}
