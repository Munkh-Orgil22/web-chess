import React, { useEffect, useState, useRef } from 'react';
import Peer from "simple-peer";
import styled from "styled-components";
import { BsFillCameraVideoFill, BsFillCameraVideoOffFill, BsMicFill, BsMicMuteFill } from "react-icons/bs"
import Button from '@material-ui/core/Button';

const socket = require('../connection/socket').socket


const Container = styled.div`
 
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  width: 100%;
`;

const Video = styled.video`
  max-width: 80%;
  border-radius: 1rem;
  // margin-left: 2.5rem;
`;

// const Button = styled.button`
//   display: flex;
//   flex-direction: column;
//   margin: 20px 0 0 170px;
// `


function VideoChatApp(props) {

  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [isCalling, setIsCalling] = useState(false)
  const [isStop, setStopVideo] = useState(false)
  const [audio, setStopAudio] = useState(false)
  const userVideo = useRef();
  const partnerVideo = useRef();

  // let myVideoStream;
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      // myVideoStream = stream;
      setStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    })

    socket.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    })
  }, []);

  function callPeer(id) {
    setIsCalling(true)
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", data => {
      socket.emit("callUser", { userToCall: id, signalData: data, from: props.mySocketId })
    })

    peer.on("stream", stream => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.on("callAccepted", signal => {
      setCallAccepted(true);
      peer.signal(signal);
    })

  }

  function acceptCall() {
    setCallAccepted(true);
    setIsCalling(false)
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", data => {
      socket.emit("acceptCall", { signal: data, to: caller })
    })

    peer.on("stream", stream => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  }

  let UserVideo;
  if (stream) {
    const stopVideo = () => {
      const enabled = stream.getVideoTracks()[0].enabled;
      if (enabled) {
        stream.getVideoTracks()[0].enabled = false;
        setStopVideo(true);
      }
      else {
        stream.getVideoTracks()[0].enabled = true;
        setStopVideo(false);
      }
    }

    const stopAudio = () => {
      const enabled = stream.getAudioTracks()[0].enabled;
      if (enabled) {
        stream.getAudioTracks()[0].enabled = false;
        setStopAudio(true);
      } else {
        stream.getAudioTracks()[0].enabled = true;
        setStopAudio(false);
      }
    }

    const buttonContainer = {
      display: 'flex',
      flexDirection: 'row',
      paddingBottom: '20px'
    }

    const optionButton = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isStop ? 'red' : '#3f51b5',
      height: "40px",
      width: "40px",
      borderRadius: '5px',
      fontSize: '1.5rem',
      margin: '20px 0 0 160px',
      color: '#eeeeee',
      cursor: 'pointer'
    }
    const muteButton = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: audio ? 'red' : '#3f51b5',
      height: "40px",
      width: "40px",
      borderRadius: '5px',
      fontSize: '1.5rem',
      margin: '20px 0 0 120px',
      color: '#eeeeee',
      cursor: 'pointer'
    }
    UserVideo = (
      <div>
        <Video playsInline muted ref={userVideo} autoPlay />
        <div style={buttonContainer}>
          <div style={optionButton} onClick={stopVideo}>
            {isStop ? <BsFillCameraVideoOffFill /> : <BsFillCameraVideoFill />}
          </div>
          <div style={muteButton} onClick={stopAudio}>
            {audio ? <BsMicMuteFill /> : <BsMicFill />}
          </div>
        </div>
      </div>
    );
  }

  let mainView;

  const videoButtonPos = {
    margin: '20px 0 0 216px'
  }

  if (callAccepted) {
    mainView = (
      <Video playsInline ref={partnerVideo} autoPlay />
    );
  } else if (receivingCall) {
    mainView = (
      <div>
        <div>{props.opponentUserName} залгаж байна...</div>
        <Button style={videoButtonPos} variant="contained" color="primary" onClick={acceptCall}>Зөвшөөрөх</Button>
      </div>
    )
  } else if (isCalling) {
    mainView = (
      <div>
        <div>{props.opponentUserName} дуудлага хийж байна...</div>
      </div>
    )
  } else {
    mainView = (
      <Button style={videoButtonPos} variant="contained" color="primary" onClick={() => {
        callPeer(props.opponentSocketId)
      }}>Залгах</Button>
    )
  }



  return (<Container>
    <Row>
      {UserVideo}
      {mainView}
    </Row>
  </Container>);
}

export default VideoChatApp;