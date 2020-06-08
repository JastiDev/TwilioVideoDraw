import io from 'socket.io-client';

// export const server_url = "https://video-app-3336-dev.twil.io";
export const server_url = '';

let socket = null;

export const getSocket = () => {
  if (socket == null)
    socket = io(
      `${server_url}/twilio-draw`
      // , {
      // reconnectionDelay: 1000,
      // reconnection: true,
      // reconnectionAttemps: 10,
      // transports: ['websocket'],
      // agent: false,
      // upgrade: false,
      // rejectUnauthorized: false
      // }
    );
  return socket;
};

export let username = '';
export let room = '';
export const setUsername = _username => (username = _username);
export const setRoom = _room => (room = _room);
