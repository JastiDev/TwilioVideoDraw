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
import ReceivedImageNotification from './components/ReceivedImageNotification/ReceivedImageNotification';

const Container = styled('div')({
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
});

const Main = styled('main')({
  overflow: 'hidden',
});

export default function App() {
  const roomState = useRoomState();

  // Here we would like the height of the main container to be the height of the viewport.
  // On some mobile browsers, 'height: 100vh' sets the height equal to that of the screen,
  // not the viewport. This looks bad when the mobile browsers location bar is open.
  // We will dynamically set the height with 'window.innerHeight', which means that this
  // will look good on mobile browsers even after the location bar opens or closes.
  const height = useHeight();

  const [isNotify, setIsNotify] = useState(false);
  const [receivedOne, setReceivedOne] = useState({});

  const [editingOne, setEditingOne] = useState({});

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let socket = getSocket();
    socket.on('one-joined-room', async one => {
      console.log(one.username);
    });
    socket.on('one-left-room', async one => {
      console.log(one.username);
    });
    socket.on('one-captured', async one => {
      setReceivedOne(one);
      setIsNotify(true);
    });
  }, []);

  useEffect(() => {
    let socket = getSocket();
    if (roomState === 'connected') {
      socket.emit('i-joined-room', { username, room });
    } else {
      socket.emit('i-left-room', { username, room });
    }
  }, [roomState]);

  const handleCapture = () => {
    let vvv = document.getElementById('vvv');
    let videoWidth = vvv.videoWidth;
    let videoHeight = vvv.videoHeight;

    console.log(videoHeight, videoWidth);

    let canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    let context = canvas.getContext('2d');

    let flipHori = false,
      flipVert = false;

    let scaleHori = flipHori ? -1 : 1, // Set horizontal scale to -1 if flip horizontal
      scaleVert = flipVert ? -1 : 1, // Set verical scale to -1 if flip vertical
      posX = flipHori ? videoWidth * -1 : 0, // Set x position to -100% if flip horizontal
      posY = flipVert ? videoHeight * -1 : 0; // Set y position to -100% if flip vertical

    context.scale(scaleHori, scaleVert);
    context.drawImage(vvv, posX, posY, videoWidth, videoHeight);

    let url = canvas.toDataURL('image/png');

    let one = { username, room, captureURL: url, videoWidth, videoHeight };
    setEditingOne(one);

    setIsEditing(true);

    // let socket = getSocket();
    // socket.emit('i-captured', { username, room, captureURL: url, videoWidth, videoHeight });
  };

  const handleOpenNotify = () => {
    setEditingOne(receivedOne);
    setIsEditing(true);
  };

  const modalStyle = {
    position: 'absolute',
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
        {roomState === 'disconnected' ? <LocalVideoPreview /> : <Room />}
        <Controls handleCapture={handleCapture} />
      </Main>
      <ReconnectingNotification />

      <ReceivedImageNotification
        isNotify={isNotify}
        username={receivedOne.username}
        handleClose={() => setIsNotify(false)}
        handleOpen={handleOpenNotify}
      />

      <Modal open={isEditing} onClose={() => setIsEditing(false)}>
        <div style={modalStyle}>
          <EditCapture one={editingOne} handleClose={() => setIsEditing(false)} />
        </div>
      </Modal>
    </Container>
  );
}
