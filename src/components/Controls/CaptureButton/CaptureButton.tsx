import React from 'react'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import Fab from '@material-ui/core/Fab';
import Tooltip from '@material-ui/core/Tooltip';
import PhotoSizeSelectLargeIcon from '@material-ui/icons/PhotoSizeSelectLarge';
import SendIcon from '@material-ui/icons/Send';

import useLocalVideoToggle from '../../../hooks/useLocalVideoToggle/useLocalVideoToggle';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      margin: theme.spacing(1),
    },
  })
);

export const CaptureButton = (props: { disabled?: boolean, handleCapture: () => void }) => {
  const classes = useStyles();
  const [isVideoEnabled, toggleVideoEnabled] = useLocalVideoToggle();

  const onClickBtn = async () => {
    if (!isVideoEnabled) return;
    await props.handleCapture();
    // await toggleVideoEnabled(); //It's for the cost optimization
  }

  let disabled = props.disabled || !isVideoEnabled;

  return (
    <Tooltip
      title={'Caputre & Send'}
      placement="top"
      PopperProps={{ disablePortal: true }}
    >
      <Fab className={classes.fab} onClick={onClickBtn}
        disabled={disabled}
      >
        <SendIcon />
      </Fab>
    </Tooltip>
  )
}
