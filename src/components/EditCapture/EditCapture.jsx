import React, { useEffect, useState } from 'react';
import CancelIcon from '@material-ui/icons/Cancel';
import { getSocket, username, room } from '../../Socket';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import GestureIcon from '@material-ui/icons/Gesture';

import "./Toolbar.css";

let isPainting = false;
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

  const [activeTool, setActiveTool] = useState('pen');
  const [activeColor, setActiveColor] = useState('#ff0000');
  const [activeStroke, setActiveStroke] = useState(5);

  const [showToolbar, setShowToolbar] = useState(true);
  const [showStrokebar, setShowStrokebar] = useState(false);

  const [isTextInput, setIsTextInput] = useState(false);
  const [textX, setTextX] = useState(0);
  const [textY, setTextY] = useState(0);
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    let ctx = document.getElementById('mycanvas-1').getContext("2d");

    let socket = getSocket();
    socket.on('one-draw', async (one) => {
      drawAtOnce(one.drawterm);
    });
  }, []);

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
        stop: { ...offSetData }
      }
      line = line.concat(position);
      newline = newline.concat({ start: mine2other(position.start), stop: mine2other(position.stop) });
      
      if (activeTool == 'pen') paint(prevPos, offSetData, activeColor, activeStroke);
      if (activeTool == 'erase') erase(prevPos, offSetData, activeColor, activeStroke);
    }
  }

  const endPaintEvent = ( { nativeEvent } ) => {
    if (isPainting) {
      isPainting = false;
      let socket = getSocket();
      let drawterm = { activeTool, activeStroke, activeColor, data: newline }

      if (activeTool == 'pen' || activeTool == 'erase') {

        socket.emit('i-draw', { username, room, drawterm });
        
      } else if (activeTool == 'rect' || activeTool == 'circle') {

        socket.emit('i-draw', { username, room, drawterm });
        drawAtOnce(drawterm);

      } else if (activeTool == 'text') { 
        let { offsetX, offsetY } = nativeEvent;
        setTextX(offsetX);
        setTextY(offsetY);
        setTextContent('');
        setIsTextInput(true);
        
        setTimeout(() => { 
          document.getElementById("myTextInput1").focus();
        }, 200);
      }

    }
  }

  const onChangeTextContent = (event) => {
    let textContent = event.target.value;
    setTextContent(textContent);
  }

  const onEndTextInput = () => {
    let pp = { offsetX: textX, offsetY: textY };
    pp = mine2other(pp);
    let drawterm = { activeTool, activeStroke, activeColor, data: [pp], text: textContent };

    let socket = getSocket();
    socket.emit('i-draw', { username, room, drawterm });
    drawAtOnce(drawterm);

    setTextContent("");
    setIsTextInput(false);
  }

  const drawAtOnce = (drawterm) => {
    if (drawterm.data.length == 0) return;

    let ctx = document.getElementById('mycanvas-1').getContext("2d");

    if (drawterm.activeTool == 'pen') {
      for (let i = 0; i < drawterm.data.length; i++) {
        let { start, stop } = drawterm.data[i];
        start = other2mine(start);
        stop = other2mine(stop);
        paint(start, stop, drawterm.activeColor, drawterm.activeStroke);
      }
    } else if (drawterm.activeTool == 'erase') {
      for (let i = 0; i < drawterm.data.length; i++) {
        let { start, stop } = drawterm.data[i];
        start = other2mine(start);
        stop = other2mine(stop);
        erase(start, stop, drawterm.activeColor, drawterm.activeStroke);
      }
    } else if (drawterm.activeTool == 'circle') {
      let start = drawterm.data[0].start;
      let stop = drawterm.data[drawterm.data.length - 1].stop;
      let centerX = (start.offsetX + stop.offsetX) / 2;
      let centerY = (start.offsetY + stop.offsetY) / 2;
      let radius = Math.sqrt(Math.pow((start.offsetX - stop.offsetX), 2) + Math.pow((start.offsetY - stop.offsetY), 2)) / 2;

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

    } else if (drawterm.activeTool == 'rect') {
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
    } else if (drawterm.activeTool == 'text') {
      let stop = drawterm.data[drawterm.data.length - 1];

      let sx = stop.offsetX * ratio;
      let sy = stop.offsetY * ratio;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = activeColor;
      // ctx.strokeStyle = activeColor;
      // ctx.lineWidth = 3;

      ctx.font = `${25+activeStroke*2}px sans-serif`;

      let text = '';
      if (drawterm.text) text = drawterm.text;
      ctx.fillText(text, sx, sy);
      // ctx.strokeText(text, sx, sy);

    }

  }


  const paint = (_prevPos, _currPos, _strokeStyle, _lineWidth) => {
    const { offsetX, offsetY } = _currPos;
    const { offsetX: x, offsetY: y } = _prevPos;

    let ctx = document.getElementById('mycanvas-1').getContext("2d");

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
  }

  const erase = (_prevPos, _currPos, _strokeStyle, _lineWidth) => {
    const { offsetX, offsetY } = _currPos;
    const { offsetX: x, offsetY: y } = _prevPos;

    let ctx = document.getElementById('mycanvas-1').getContext("2d");

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = _lineWidth * 5;
    ctx.globalCompositeOperation = 'destination-out';

    ctx.beginPath();
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
      cursor: 'pointer',
      zIndex: 100,
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
    textinput: {
      position: 'absolute',
      top: textY,
      left: textX,
      backgroundColor: 'transparent',
      color: activeColor,
      fontSize: 25 + activeStroke * 2,
      display: (activeTool == 'text' && isTextInput) ? 'block' : 'none',
      width: width/3
    },
    toolbar: {
      position: 'absolute',
      bottom: 0,
      height: '70px',
      width: width,
      display: showToolbar ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
    },
    strokebar: {
      position: 'absolute',
      bottom: '70px',
      height: '80px',
      width: width,
      display: showStrokebar ? 'flex' : 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    collapsebar: {
      position: 'absolute',
      height: '50px',
      bottom: (showStrokebar ? '150px' : (showToolbar ? '70px' : '0px')),
      width: width,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  };

  const onClickCollapse = () => { 
    if (showToolbar) {
      setShowToolbar(false);
      setShowStrokebar(false);
    } else {
      setShowToolbar(true);
    }
  }

  const onClickTool = (_activeTool) => {
    if (activeTool !== _activeTool) {
      setActiveTool(_activeTool);
    } else {
      setShowStrokebar((showStrokebar) => !showStrokebar);
    }
  }

  const arrColor = ["black", "#ffffff", "#00ff00", "#ffff00", "#ff9900", "#ff0000", "#ff00ff", "#9900ff", "#0000ff"];
  const arrStroke = [1,2,3,4,5,6,7,8,9];

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

        <div style={styles.collapsebar}>
          <button className={"collapse" + (showToolbar ? " down" : " up")}
            onClick={onClickCollapse}></button>
        </div>

        <div style={styles.strokebar}>
          <div>
            {arrColor.map((cc, i) => (
              <button key={i} className={"colorbtn" + (activeColor == cc ? " active" : "")}
                onClick={(e)=>setActiveColor(cc)}><FiberManualRecordIcon style={{ fontSize: 30, color: cc }} /></button>
            ))}
          </div>
          <div>
            {arrStroke.map((ss, i) => (
              <button key={i} className={"strokebtn" + (activeStroke == ss ? " active" : "")}
                onClick={(e) => setActiveStroke(ss)}> <GestureIcon style={{ fontSize: 18 + ss*2}}/> </button>
            ))}
          </div>
        </div>

        <div style={styles.toolbar}>
          <button className={"toolbtn pen" + (activeTool == 'pen' ? " active" : "")}
            onClick={(e) => onClickTool('pen')}></button>
          
          <button className={"toolbtn rect" + (activeTool == 'rect' ? " active" : "")}
            onClick={(e) => onClickTool('rect')}></button>

          <button className={"toolbtn circle" + (activeTool == 'circle' ? " active" : "")}
            onClick={(e) => onClickTool('circle')}></button>

          <button className={"toolbtn text" + (activeTool == 'text' ? " active" : "")}
            onClick={(e) => onClickTool('text')}></button>

          <button className={"toolbtn erase" + (activeTool == 'erase' ? " active" : "")}
            onClick={(e) => onClickTool('erase')}></button>
        </div>

        
        <input id="myTextInput1"
          style={styles.textinput}
          value={textContent} onChange={onChangeTextContent}
          onKeyUp={(evt) => { if (evt.keyCode == 13) onEndTextInput(); }}
          onBlur={() => onEndTextInput()}/>
      </div>
    </div>
  );
}
