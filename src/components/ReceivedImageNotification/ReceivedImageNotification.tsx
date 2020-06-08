import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import WallpaperIcon from '@material-ui/icons/Wallpaper';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles({
  snackbar: {
    backgroundColor: '#6db1ff',
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    marginRight: '0.8em',
  },
});

export default function ReceivedImageNotification(props: {
  isNotify: boolean;
  username: string;
  handleClose: () => {};
  handleOpen: () => {};
}) {
  const classes = useStyles();

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      open={props.isNotify}
      onClose={props.handleClose}
      message={
        <span className={classes.message}>
          <WallpaperIcon className={classes.icon} />
          {props.username}
        </span>
      }
      action={
        <React.Fragment>
          <Button color="primary" size="small" onClick={props.handleOpen}>
            OPEN
          </Button>
          <IconButton size="small" aria-label="close" color="inherit" onClick={props.handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </React.Fragment>
      }
    />
  );
}
