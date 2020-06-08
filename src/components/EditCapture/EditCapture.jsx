import React, { useState } from 'react';
import { getSocket, username, room } from '../../Socket';

import CancelIcon from '@material-ui/icons/Cancel';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import SendIcon from '@material-ui/icons/Send';

import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import GestureIcon from '@material-ui/icons/Gesture';

import './Toolbar.css';

let isPainting = false;
let line = [];
let newline = [];
let prevPos = { offsetX: 0, offsetY: 0 };
let position = {};

export default function EditCapture(props) {
  let { videoHeight, videoWidth } = props.one;
  let ratio = 1;
  let WW = window.innerWidth * 0.9,
    HH = window.innerHeight * 0.9;

  let width = WW,
    height = HH;
  if (HH && videoHeight && WW / HH > videoWidth / videoHeight) {
    ratio = HH / videoHeight;
    height = HH;
    width = videoWidth * ratio;
  } else {
    ratio = WW / videoWidth;
    width = WW;
    height = videoHeight * ratio;
  }

  const [activeTool, setActiveTool] = useState('pen');
  const [activeColor, setActiveColor] = useState('#ff0000');
  const [activeStroke, setActiveStroke] = useState(5);

  const [showToolbar, setShowToolbar] = useState(true);
  const [showStrokebar, setShowStrokebar] = useState(false);

  const [isTextInput, setIsTextInput] = useState(false);
  const [textX, setTextX] = useState(0);
  const [textY, setTextY] = useState(0);
  const [textContent, setTextContent] = useState('');

  const other2mine = offsetData => {
    return { offsetX: offsetData.offsetX * ratio, offsetY: offsetData.offsetY * ratio };
  };

  const mine2other = offsetData => {
    return { offsetX: offsetData.offsetX / ratio, offsetY: offsetData.offsetY / ratio };
  };

  const onTouchStart = e => {
    let rect = e.target.getBoundingClientRect();
    let touch = e.touches[0];
    let nativeEvent = {
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    };
    onMouseDown({ nativeEvent });
  };

  const onTouchMove = e => {
    let rect = e.target.getBoundingClientRect();
    let touch = e.touches[0];
    let nativeEvent = {
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    };
    onMouseMove({ nativeEvent });
  };

  const onTouchEnd = e => {
    let rect = e.target.getBoundingClientRect();
    let touch = e.changedTouches[0];
    let nativeEvent = {
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    };
    endPaintEvent({ nativeEvent });
  };

  const onMouseDown = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    isPainting = true;
    prevPos = { offsetX, offsetY };
    newline = [];
  };

  const onMouseMove = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;

    if (isPainting) {
      const offSetData = { offsetX, offsetY };
      position = {
        start: { ...prevPos },
        stop: { ...offSetData },
      };
      line = line.concat(position);
      newline = newline.concat({ start: mine2other(position.start), stop: mine2other(position.stop) });

      if (activeTool === 'pen') paint(prevPos, offSetData, activeColor, activeStroke);
      if (activeTool === 'erase') erase(prevPos, offSetData, activeColor, activeStroke);
    }
  };

  const endPaintEvent = ({ nativeEvent }) => {
    if (isPainting) {
      isPainting = false;
      let drawterm = { activeTool, activeStroke, activeColor, data: newline };

      if (activeTool === 'pen' || activeTool === 'erase') {
      } else if (activeTool === 'rect' || activeTool === 'circle') {
        drawAtOnce(drawterm);
      } else if (activeTool === 'text') {
        let { offsetX, offsetY } = nativeEvent;
        setTextX(offsetX);
        setTextY(offsetY);
        setTextContent('');
        setIsTextInput(true);

        setTimeout(() => {
          document.getElementById('myTextInput1').focus();
        }, 200);
      }
    }
  };

  const onChangeTextContent = event => {
    let textContent = event.target.value;
    setTextContent(textContent);
  };

  const onEndTextInput = () => {
    let pp = { offsetX: textX, offsetY: textY };
    pp = mine2other(pp);
    let drawterm = { activeTool, activeStroke, activeColor, data: [pp], text: textContent };

    drawAtOnce(drawterm);

    setTextContent('');
    setIsTextInput(false);
  };

  const drawAtOnce = drawterm => {
    let ctx = document.getElementById('mycanvas-1').getContext('2d');

    if (drawterm.activeTool === 'eraseAll') {
      eraseAll();
    }
    if (drawterm.activeTool === 'pen') {
      for (let i = 0; i < drawterm.data.length; i++) {
        let { start, stop } = drawterm.data[i];
        start = other2mine(start);
        stop = other2mine(stop);
        paint(start, stop, drawterm.activeColor, drawterm.activeStroke);
      }
    } else if (drawterm.activeTool === 'erase') {
      for (let i = 0; i < drawterm.data.length; i++) {
        let { start, stop } = drawterm.data[i];
        start = other2mine(start);
        stop = other2mine(stop);
        erase(start, stop, drawterm.activeColor, drawterm.activeStroke);
      }
    } else if (drawterm.activeTool === 'circle') {
      if (drawterm.data.length === 0) return;
      let start = drawterm.data[0].start;
      let stop = drawterm.data[drawterm.data.length - 1].stop;
      let centerX = (start.offsetX + stop.offsetX) / 2;
      let centerY = (start.offsetY + stop.offsetY) / 2;
      let radius = Math.sqrt(Math.pow(start.offsetX - stop.offsetX, 2) + Math.pow(start.offsetY - stop.offsetY, 2)) / 2;

      centerX = ratio * centerX;
      centerY = ratio * centerY;
      radius = ratio * radius;

      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = drawterm.activeStroke;
      ctx.strokeStyle = drawterm.activeColor;
      ctx.fillStyle = 'transparent';

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.stroke();
    } else if (drawterm.activeTool === 'rect') {
      if (drawterm.data.length === 0) return;
      let start = drawterm.data[0].start;
      let stop = drawterm.data[drawterm.data.length - 1].stop;

      let sx = start.offsetX * ratio;
      let sy = start.offsetY * ratio;
      let ww = (stop.offsetX - start.offsetX) * ratio;
      let hh = (stop.offsetY - start.offsetY) * ratio;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'transparent';
      ctx.lineWidth = drawterm.activeStroke;
      ctx.strokeStyle = drawterm.activeColor;

      ctx.beginPath();
      ctx.rect(sx, sy, ww, hh);
      ctx.fill();
      ctx.stroke();
    } else if (drawterm.activeTool === 'text') {
      if (drawterm.data.length === 0) return;
      let stop = drawterm.data[drawterm.data.length - 1];

      let sx = stop.offsetX * ratio;
      let sy = stop.offsetY * ratio;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = drawterm.activeColor;
      // ctx.strokeStyle = activeColor;
      // ctx.lineWidth = 3;

      ctx.font = `${25 + drawterm.activeStroke * 2}px sans-serif`;

      let text = '';
      if (drawterm.text) text = drawterm.text;
      ctx.fillText(text, sx, sy);
      // ctx.strokeText(text, sx, sy);
    }
  };

  const paint = (_prevPos, _currPos, _strokeStyle, _lineWidth) => {
    const { offsetX, offsetY } = _currPos;
    const { offsetX: x, offsetY: y } = _prevPos;

    let ctx = document.getElementById('mycanvas-1').getContext('2d');

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = _strokeStyle;
    ctx.lineWidth = _lineWidth;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    prevPos = { offsetX, offsetY };
  };

  const erase = (_prevPos, _currPos, _strokeStyle, _lineWidth) => {
    const { offsetX, offsetY } = _currPos;
    const { offsetX: x, offsetY: y } = _prevPos;

    let ctx = document.getElementById('mycanvas-1').getContext('2d');

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = _lineWidth * 5;
    ctx.globalCompositeOperation = 'destination-out';

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    prevPos = { offsetX, offsetY };
  };

  const styles = {
    container: {
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      display: 'flex',
      position: 'relative',
    },
    box: {
      width: width,
      height: height,
      backgroundImage: `url(${props.one.captureURL})`,
      backgroundSize: `${width}px ${height}px`,
      backgroundRepeat: 'no-repeat',
      position: 'relative',
    },
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    textinput: {
      position: 'absolute',
      top: textY,
      left: textX,
      backgroundColor: 'transparent',
      color: activeColor,
      fontSize: 25 + activeStroke * 2,
      display: activeTool === 'text' && isTextInput ? 'block' : 'none',
      width: width / 3,
    },
    toolbarTop: {
      position: 'absolute',
      top: 0,
      height: '70px',
      width: width,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    topbtn: {
      color: 'brightblue',
      backgroundColor: 'transparent',
      marginLeft: '10px',
      marginRight: '10px',
      cursor: 'pointer',
      zIndex: 100,
    },
    toolbar: {
      position: 'absolute',
      bottom: 0,
      height: '70px',
      width: width,
      display: showToolbar ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    strokebar: {
      position: 'absolute',
      bottom: '70px',
      height: '70px',
      width: width,
      display: showStrokebar ? 'flex' : 'none',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 100,
    },
    pallette: {
      display: 'inline-block',
      backgroundColor: '#3d3e3b',
      borderRadius: '5px',
      height: '100%',
      zIndex: 100,
    },
    collapsebar: {
      position: 'absolute',
      height: '50px',
      bottom: showStrokebar ? '130px' : showToolbar ? '70px' : '0px',
      width: width,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
  };

  const onClickCollapse = () => {
    if (showToolbar) {
      setShowToolbar(false);
      setShowStrokebar(false);
    } else {
      setShowToolbar(true);
    }
  };

  const eraseAll = () => {
    let ctx = document.getElementById('mycanvas-1').getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = height;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const onClickTool = _activeTool => {
    if (_activeTool === 'erase') {
      let drawterm = { activeTool: 'eraseAll' };
      drawAtOnce(drawterm);
    } else if (activeTool !== _activeTool) {
      setActiveTool(_activeTool);
    } else {
      setShowStrokebar(showStrokebar => !showStrokebar);
    }
  };

  const arrColor = ['black', '#ffffff', '#00ff00', '#ffff00', '#ff9900', '#ff0000', '#ff00ff', '#9900ff', '#0000ff'];
  const arrStroke = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const sendEdited = e => {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');

    let img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);

      let srcCanvas = document.getElementById('mycanvas-1');
      ctx.drawImage(srcCanvas, 0, 0);

      let resultImg = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');

      let one = { username, room, videoWidth, videoHeight, captureURL: resultImg };

      let socket = getSocket();
      socket.emit('i-captured', one);
      props.handleClose();
    };
    img.setAttribute('src', props.one.captureURL);
  };

  const downloadEdited = e => {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');

    let img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);

      let srcCanvas = document.getElementById('mycanvas-1');
      ctx.drawImage(srcCanvas, 0, 0);

      let resultImg = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      let link = document.createElement('a');
      link.download = 'twilio-draw.png';
      link.href = resultImg;
      link.click();
    };
    img.setAttribute('src', props.one.captureURL);
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbarTop}>
        <p style={styles.topbtn}>
          <SendIcon style={{ fontSize: '50px' }} onClick={sendEdited} />
        </p>
        <p style={styles.topbtn}>
          <SaveAltIcon style={{ fontSize: '50px' }} onClick={downloadEdited} />
        </p>
        <p style={styles.topbtn}>
          <CancelIcon style={{ fontSize: '50px' }} onClick={props.handleClose} />
        </p>
      </div>

      <div style={styles.collapsebar}>
        <button className={'collapse' + (showToolbar ? ' down' : ' up')} onClick={onClickCollapse}></button>
      </div>

      <div style={styles.strokebar}>
        <div style={styles.pallette}>
          <div style={{ margin: '5px auto' }}>
            {arrColor.map((cc, i) => (
              <button
                key={i}
                className={'colorbtn' + (activeColor === cc ? ' active' : '')}
                onClick={e => setActiveColor(cc)}
              >
                <FiberManualRecordIcon style={{ fontSize: 20, color: cc }} />
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            {arrStroke.map((ss, i) => (
              <button
                key={i}
                className={'strokebtn' + (activeStroke === ss ? ' active' : '')}
                onClick={e => setActiveStroke(ss)}
              >
                {' '}
                <GestureIcon style={{ fontSize: 10 + ss * 2 }} />{' '}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.toolbar}>
        <button
          className={'toolbtn pen' + (activeTool === 'pen' ? ' active' : '')}
          onClick={e => onClickTool('pen')}
        ></button>

        <button
          className={'toolbtn rect' + (activeTool === 'rect' ? ' active' : '')}
          onClick={e => onClickTool('rect')}
        ></button>

        <button
          className={'toolbtn circle' + (activeTool === 'circle' ? ' active' : '')}
          onClick={e => onClickTool('circle')}
        ></button>

        <button
          className={'toolbtn text' + (activeTool === 'text' ? ' active' : '')}
          onClick={e => onClickTool('text')}
        ></button>

        <button
          className={'toolbtn erase' + (activeTool === 'erase' ? ' active' : '')}
          onClick={e => onClickTool('erase')}
        ></button>
      </div>

      <div style={styles.box}>
        <canvas
          id="mycanvas-1"
          style={styles.canvas}
          width={width}
          height={height}
          onMouseDown={onMouseDown}
          // onMouseLeave={endPaintEvent}
          onMouseUp={endPaintEvent}
          onMouseMove={onMouseMove}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
        <input
          id="myTextInput1"
          style={styles.textinput}
          value={textContent}
          onChange={onChangeTextContent}
          onKeyUp={evt => {
            if (evt.keyCode === 13) onEndTextInput();
          }}
          onBlur={() => onEndTextInput()}
        />
      </div>
    </div>
  );
}
