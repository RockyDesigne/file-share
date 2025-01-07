const OFFER = "offer";
const ANSWER = "answer";
const ICE_CANDIDATE = "iceCandidate";

const ws = new WebSocket("ws://localhost:8080/ws");

const rtcPeerConnection = new RTCPeerConnection();

rtcPeerConnection.onicecandidate = event => {
    if (event.candidate) {
        ws.send(JSON.stringify({ type: ICE_CANDIDATE, candidate: event.candidate }));
    } else {
        console.log("All ICE candidates have been sent.");
    }
};

let sendDataChannel = null;

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
    rtcPeerConnection.ondatachannel = e => {
        rtcPeerConnection.dc = e.channel;
        rtcPeerConnection.dc.onmessage = e => console.log("msg: " + e.data);
        rtcPeerConnection.dc.onopen = e => console.log("conn opened");
        rtcPeerConnection.dc.onclose = () => console.log("Data channel closed");
    }
        rtcPeerConnection.setRemoteDescription(offer)
            .then(() => {
                return rtcPeerConnection.createAnswer();
            })
            .then((answer) => {
                return rtcPeerConnection.setLocalDescription(answer);
            })
            .then(() => {
                ws.send(JSON.stringify(rtcPeerConnection.localDescription));
            })
            .catch((error) => {
                console.error("Error handling offer:", error);
            });
}

function handleAnswer(answer) {
    rtcPeerConnection.setRemoteDescription(answer);
}

function initiateOffer() {

    setUpChannel();

    rtcPeerConnection.createOffer()
        .then(offer => {
            return rtcPeerConnection.setLocalDescription(offer);
        })
        .then(() => {
            ws.send(JSON.stringify(rtcPeerConnection.localDescription));
        })
        .catch(error => {
            console.error('Error creating or sending offer:', error);
        });
}

function setUpChannel() {
    sendDataChannel = rtcPeerConnection.createDataChannel("sendDataChannel");

    sendDataChannel.onmessage = e => console.log(e.data);

    sendDataChannel.onopen = e => console.log("channel open");

    sendDataChannel.onclose = () => console.log("Data channel closed");
}
