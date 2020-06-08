import React, { useEffect, useState, useCallback } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import Fab from '@material-ui/core/Fab';
import Tooltip from '@material-ui/core/Tooltip';
import FlipCameraIosIcon from '@material-ui/icons/FlipCameraIos';
// import useLocalVideoToggle from '../../../hooks/useLocalVideoToggle/useLocalVideoToggle';
import useVideoContext from '../../../hooks/useVideoContext/useVideoContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      margin: theme.spacing(1),
    },
  })
);

export const CameraSwitchButton = (props: { disabled?: boolean }) => {
  const classes = useStyles();
  const {
    room: { localParticipant },
    localTracks,
    getLocalVideoTrack,
  } = useVideoContext();
  const [supportsFacingMode, setSupportsFacingMode] = useState<Boolean | null>(null);
  const videoTrack = localTracks.find(track => track.name.includes('camera'));
  const facingMode = videoTrack?.mediaStreamTrack.getSettings().facingMode;

  useEffect(() => {
    // The 'supportsFacingMode' variable determines if this component is rendered
    // If 'facingMode' exists, we will set supportsFacingMode to true.
    // However, if facingMode is ever undefined again (when the user unpublishes video), we
    // won't set 'supportsFacingMode' to false. This prevents the icon from briefly
    // disappearing when the user switches their front/rear camera.
    if (facingMode && supportsFacingMode === null) {
      setSupportsFacingMode(Boolean(facingMode));
    }
  }, [facingMode, supportsFacingMode]);

  const toggleFacingMode = useCallback(() => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';

    videoTrack!.stop();

    getLocalVideoTrack({ facingMode: newFacingMode }).then(newVideoTrack => {
      const localTrackPublication = localParticipant?.unpublishTrack(videoTrack!);
      // TODO: remove when SDK implements this event. See: https://issues.corp.twilio.com/browse/JSDK-2592
      localParticipant?.emit('trackUnpublished', localTrackPublication);

      localParticipant?.publishTrack(newVideoTrack, { priority: 'low' });
    });
  }, [facingMode, getLocalVideoTrack, localParticipant, videoTrack]);

  return (
    <Tooltip title={'Switch Camera'} placement="top" PopperProps={{ disablePortal: true }}>
      <div>
        <Fab className={classes.fab} onClick={toggleFacingMode} disabled={!videoTrack || props.disabled}>
          <FlipCameraIosIcon />
        </Fab>
      </div>
    </Tooltip>
  );
};
