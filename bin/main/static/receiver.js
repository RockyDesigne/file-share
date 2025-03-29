const ws = new WebSocket("ws://localhost:8080/ws")
ws.onmessage = e => console.log("sdp: " + e.data)

const rc = new RTCPeerConnection()

rc.ondatachannel = e => {
    rc.dc = e.channel
    rc.dc.onmessage = e => console.log("msg: " + e.data)
    rc.dc.onopen = e => console.log("conn opened")
}