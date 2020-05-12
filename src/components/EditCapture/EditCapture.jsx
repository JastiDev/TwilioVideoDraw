import React, { useEffect } from 'react';
import CancelIcon from '@material-ui/icons/Cancel'
import { getSocket, username, room } from '../../Socket';

let isPainting = false;
let userStrokeStyle = '#0000FF';
let guestStrokeStyle = '#FF0000';
let line = [];
let newline = [];
let prevPos = { offsetX: 0, offsetY: 0 };
let position = {};


export default function EditCapture(props) {
  let { videoHeight, videoWidth } = props;
  let ratio = 1;
  let WW = window.innerWidth * 0.9, HH = window.innerHeight * 0.9;

  let width = WW, height = HH;
  if (HH && videoHeight && WW / HH > videoWidth / videoHeight) {
    ratio = HH / videoHeight;
    height = HH;
    width = videoWidth * ratio;
  } else {
    ratio = WW / videoWidth;
    width = WW;
    height = videoHeight * ratio;
  }

  useEffect(() => {
    let ctx = document.getElementById('mycanvas-1').getContext("2d");
    ctx.clearRect(0, 0, width, height);

    let socket = getSocket();
    socket.on('one-draw', async (one) => {
      drawOthersPaint(one.drawterm);
    });
  }, []);

  const drawOthersPaint = (otherDrawTerm) => { 
    for (let i = 0; i < otherDrawTerm.length; i++){
      let { start, stop } = otherDrawTerm[i];
      start = other2mine(start);
      stop = other2mine(stop);
      paint(start, stop, guestStrokeStyle);
    }
  }

  const other2mine = (offsetData) => { 
    return { offsetX: offsetData.offsetX * ratio, offsetY: offsetData.offsetY * ratio };
  }

  const mine2other = (offsetData) => {
    return { offsetX: offsetData.offsetX / ratio, offsetY: offsetData.offsetY / ratio };
  }


  const onMouseDown = ({ nativeEvent }) => { 
    const { offsetX, offsetY } = nativeEvent;
    isPainting = true;
    prevPos = { offsetX, offsetY };
    newline = [];
  }

  const onMouseMove = ({ nativeEvent }) => { 
    if (isPainting) {
      const { offsetX, offsetY } = nativeEvent;
      const offSetData = { offsetX, offsetY };
      position = {
        start: { ...prevPos },
        stop: {...offSetData}
      }
      line = line.concat(position);
      newline = newline.concat({start:mine2other(position.start), stop:mine2other(position.stop)});
      paint(prevPos, offSetData, userStrokeStyle);
    }
  }

  const endPaintEvent = () => { 
    if (isPainting) {
      isPainting = false;
      let socket = getSocket();
      socket.emit('i-draw', { username, room, drawterm:newline, ratio });
    }
  }

  const paint = (_prevPos, _currPos, _strokeStyle) => { 
    const { offsetX, offsetY } = _currPos;
    const { offsetX: x, offsetY: y } = _prevPos;

    let ctx = document.getElementById('mycanvas-1').getContext("2d");

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.strokeStyle = _strokeStyle;
    ctx.moveTo(x, y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    prevPos = { offsetX, offsetY };
  }

  const styles = {
    container: {
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      display: 'flex',
      position: 'relative'
    },
    close: {
      position: 'absolute',
      top: 0,
      right: 0,
      color: 'red',
      cursor: 'pointer'
    },
    box: {
      width: width,
      height: height,
      backgroundImage: `url(${props.captureURL})`,
      backgroundSize: `${width}px ${height}px`,
      backgroundRepeat: 'no-repeat',
      position: 'relative',
    },
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      border: '2px solid blue'
    },
  };

  return (
    <div style={styles.container}>
      <p style={styles.close}><CancelIcon style={{ fontSize: '50px' }} onClick={props.handleClose}/></p>
      <div style={styles.box}>
        <canvas
          id="mycanvas-1"
          style={styles.canvas}
          width={width}
          height={height}
          onMouseDown={onMouseDown}
          onMouseLeave={endPaintEvent}
          onMouseUp={endPaintEvent}
          onMouseMove={onMouseMove}
        />
      </div>
    </div>
  );
}
