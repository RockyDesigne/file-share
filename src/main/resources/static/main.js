'use strict';

let localConnection;
let remoteConnection;
let sendChannel;
let receiveChannel;
let fileReader;
const bitrateDiv = document.querySelector('div#bitrate');
const fileInput = document.querySelector('input#fileInput');
const abortButton = document.querySelector('button#abortButton');
const downloadAnchor = document.querySelector('a#download');
const sendProgress = document.querySelector('progress#sendProgress');
const receiveProgress = document.querySelector('progress#receiveProgress');
const statusMessage = document.querySelector('span#status');
const sendFileButton = document.querySelector('button#sendFile');

let receiveBuffer = [];
let receivedSize = 0;
let bytesPrev = 0;
let timestampPrev = 0;
let timestampStart;
let statsInterval = null;
let bitrateMax = 0;

// WebSocket setup
const signalingServer = 'ws://localhost:8080/ws';
const socket = new WebSocket(signalingServer);

// Wait for WebSocket connection
socket.onopen = () => {
    console.log('Connected to signaling server');
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.offer) {
        // Received an offer, accept it and send an answer
        handleOffer(message.offer);
    } else if (message.answer) {
        // Received an answer from the other peer
        handleAnswer(message.answer);
    } else if (message.iceCandidate) {
        // Received an ICE candidate
        handleIceCandidate(message.iceCandidate);
    }
};

// Handle file input change
fileInput.addEventListener('change', handleFileInputChange, false);
abortButton.addEventListener('click', () => {
    if (fileReader && fileReader.readyState === 1) {
        fileReader.abort();
    }
});

sendFileButton.addEventListener('click', () => createConnection());

// Handle file input change
async function handleFileInputChange() {
    const file = fileInput.files[0];
    if (!file) {
        console.log('No file chosen');
    } else {
        sendFileButton.disabled = false;
    }
    }
}

// Create a WebRTC connection and send offer
async function createConnection() {
    abortButton.disabled = false;
    sendFileButton.disabled = true;
    localConnection = new RTCPeerConnection();
    console.log('Created local peer connection object localConnection');

    sendChannel = localConnection.createDataChannel('sendDataChannel');
    sendChannel.binaryType = 'arraybuffer';
    console.log('Created send data channel');

    sendChannel.addEventListener('open', onSendChannelStateChange);
    sendChannel.addEventListener('close', onSendChannelStateChange);
    sendChannel.addEventListener('error', onError);

    localConnection.addEventListener('icecandidate', async event => {
        if (event.candidate) {
            // Send ICE candidate to the remote peer via WebSocket
            socket.send(JSON.stringify({ iceCandidate: event.candidate }));
        }
    });

    remoteConnection = new RTCPeerConnection();
    remoteConnection.addEventListener('icecandidate', async event => {
        if (event.candidate) {
            // Send ICE candidate to the local peer via WebSocket
            socket.send(JSON.stringify({ iceCandidate: event.candidate }));
        }
    });
    remoteConnection.addEventListener('datachannel', receiveChannelCallback);

    try {
        const offer = await localConnection.createOffer();
        await localConnection.setLocalDescription(offer);
        console.log('Created and sent offer');
        socket.send(JSON.stringify({ offer: offer }));
    } catch (e) {
        console.log('Failed to create session description: ', e);
    }

    fileInput.disabled = true;
}

// Handle received offer
async function handleOffer(offer) {
    resetConnections();
    await remoteConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await remoteConnection.createAnswer();
    await remoteConnection.setLocalDescription(answer);
    socket.send(JSON.stringify({ answer: answer }));
}

function resetConnections() {
    if (localConnection) {
        localConnection.close();
    }
    if (remoteConnection) {
        remoteConnection.close();
    }
    localConnection =  new RTCPeerConnection();
    remoteConnection = new RTCPeerConnection();
}

// Handle received answer
async function handleAnswer(answer) {
    if(!localConnection) {
        localConnection = new RTCPeerConnection();
    }

    if (remoteConnection.signalingState === 'stable') {
            console.log("Remote connection already in stable state, waiting for a valid offer...");
            return; // Early exit
        }

    await localConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Handle ICE candidates
function handleIceCandidate(candidate) {
    remoteConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// Send file data
function sendData() {
    const file = fileInput.files[0];
    console.log(`File is ${[file.name, file.size, file.type, file.lastModified].join(' ')}`);

    if (file.size === 0) {
        statusMessage.textContent = 'File is empty, please select a non-empty file';
        closeDataChannels();
        return;
    }

    sendProgress.max = file.size;
    receiveProgress.max = file.size;
    const chunkSize = 16384;
    fileReader = new FileReader();
    let offset = 0;

    fileReader.addEventListener('error', error => console.error('Error reading file:', error));
    fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
    fileReader.addEventListener('load', e => {
        console.log('FileRead.onload ', e);
        sendChannel.send(e.target.result);
        offset += e.target.result.byteLength;
        sendProgress.value = offset;
        if (offset < file.size) {
            readSlice(offset);
        }
    });

    const readSlice = (o) => {
        const slice = file.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
    };
    readSlice(0);
}

// Close data channels
function closeDataChannels() {
    sendChannel.close();
    if (receiveChannel) {
        receiveChannel.close();
    }
    localConnection.close();
    remoteConnection.close();
    localConnection = null;
    remoteConnection = null;
}

// Handle send channel state changes
function onSendChannelStateChange() {
    if (sendChannel) {
        const { readyState } = sendChannel;
        console.log(`Send channel state is: ${readyState}`);
        if (readyState === 'open') {
            sendData();
        }
    }
}

function onError(error) {
    console.error('Error in sendChannel:', error);
}

function receiveChannelCallback(event) {
    receiveChannel = event.channel;
    receiveChannel.binaryType = 'arraybuffer';
    receiveChannel.onmessage = onReceiveMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
    const data = event.data;
    if (data instanceof ArrayBuffer) {
        receiveBuffer.push(data);
        receivedSize += data.byteLength;
        receiveProgress.value = receivedSize;
        console.log(`Received file chunk: ${receivedSize}`);

        if (receivedSize === file.size) {
            const blob = new Blob(receiveBuffer);
            const file = new File([blob], 'received_file');
            downloadAnchor.href = URL.createObjectURL(file);
            downloadAnchor.download = 'received_file';
            downloadAnchor.textContent = 'Download File';
        }
    }
}

function onReceiveChannelStateChange() {
    const { readyState } = receiveChannel;
    console.log(`Receive channel state is: ${readyState}`);
    if (readyState === 'open') {
        console.log('Ready to receive data');
    }
}
