class WebRTCFileShare {
    constructor(username, stunServerUrls) {
        this.username = username;
        this.ws = null;
        this.peerConnection = null;
        this.dirHandle = null;
        this.stunServerUrls = stunServerUrls;
    }
}