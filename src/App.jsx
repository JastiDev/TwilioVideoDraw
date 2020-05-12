import React, { useState, useEffect } from 'react';
import { styled } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';

import EditCapture from './components/EditCapture/EditCapture';
import Controls from './components/Controls/Controls';
import LocalVideoPreview from './components/LocalVideoPreview/LocalVideoPreview';
import MenuBar from './components/MenuBar/MenuBar';
import ReconnectingNotification from './components/ReconnectingNotification/ReconnectingNotification';
import Room from './components/Room/Room';

import useHeight from './hooks/useHeight/useHeight';
import useRoomState from './hooks/useRoomState/useRoomState';

import { getSocket, username, room } from './Socket';

const Container = styled('div')({
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
});

const Main = styled('main')({
  overflow: 'hidden',
});

let videoWidth, videoHeight;

export default function App() {
  const roomState = useRoomState();

  // Here we would like the height of the main container to be the height of the viewport.
  // On some mobile browsers, 'height: 100vh' sets the height equal to that of the screen,
  // not the viewport. This looks bad when the mobile browsers location bar is open.
  // We will dynamically set the height with 'window.innerHeight', which means that this
  // will look good on mobile browsers even after the location bar opens or closes.
  const height = useHeight();

  const [isModal, setIsModal] = useState(false);
  const [captureURL, setCaptureURL] = useState("");

  let socket = getSocket();

  useEffect(() => {
    socket.on('one-joined-room', async (one) => {
      console.log(one.username);
    });
    socket.on('one-left-room', async (one) => {
      console.log(one.username);
    });
    socket.on('one-captured', async (one) => { 
      console.log('captured', one.username );
      videoWidth = one.videoWidth;
      videoHeight = one.videoHeight;
      setCaptureURL(one.captureURL);
      setIsModal(true);
    });
  }, []);

  useEffect(() => {
    if (roomState == 'connected') {
      socket.emit('i-joined-room', { username, room });     
    } else {
      socket.emit('i-left-room', { username, room });
    }
  }, [ roomState ]);

  const handleCapture = () => {
    let vvv = document.getElementById('vvv');
    videoWidth = vvv.videoWidth;
    videoHeight = vvv.videoHeight;

    let canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    let context = canvas.getContext('2d');

    let flipHori = false, flipVert = false;

    let scaleHori = flipHori ? -1 : 1, // Set horizontal scale to -1 if flip horizontal
      scaleVert = flipVert ? -1 : 1, // Set verical scale to -1 if flip vertical
      posX = flipHori ? videoWidth * -1 : 0, // Set x position to -100% if flip horizontal
      posY = flipVert ? videoHeight * -1 : 0; // Set y position to -100% if flip vertical

    context.scale(scaleHori, scaleVert);
    context.drawImage(vvv, posX, posY, videoWidth, videoHeight);

    let url = canvas.toDataURL('image/png');
    setCaptureURL(url);
    setIsModal(true);

    socket.emit('i-captured', { username, room, captureURL: url, videoWidth, videoHeight });
  }

  const handleClose = () => { 
    setIsModal(false);
  }

  const modalStyle = {
    position: "absolute",
    top: '50%',
    left: '50%',
    height: '95%',
    width: '95%',
    transform: `translate(-50%, -50%)`,
    boxShadow: '5',
    padding: '3px 3px 3px 3px',
    backgroundColor: 'black',
  };

  return (
    <Container style={{ height }}>
      <MenuBar />
      <Main>
        {(roomState === 'disconnected') ? <LocalVideoPreview /> : <Room />}
        <Controls handleCapture={handleCapture} />
      </Main>
      <ReconnectingNotification />

      <Modal open={isModal} onClose={handleClose}>
        <div style={modalStyle}>
          <EditCapture captureURL={captureURL} videoWidth={videoWidth} videoHeight={videoHeight} handleClose={handleClose}/>
        </div>
      </Modal>

    </Container>
  );
}
