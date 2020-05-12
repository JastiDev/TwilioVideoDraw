import io from 'socket.io-client';

// export const server_url = "https://video-app-9352-dev.twil.io:8083";
export const server_url = "";

let socket = null;

export const getSocket = () => {
  if (socket == null) socket = io(`${server_url}/twilio-draw`);
  return socket;
}

export let username = '';
export let room = '';
export const setUsername = (_username) => username = _username;
export const setRoom = (_room) => room = _room;