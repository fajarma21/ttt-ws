import { WebSocketServer, WebSocket, type VerifyClientCallbackAsync } from 'ws';
import {
  getAvailableRooms,
  randomIdNumber,
  randomRoomNumber,
} from './index.helpers';
import {
  GAME_STATUS_CREATE,
  GAME_STATUS_FIND,
  GAME_STATUS_FINISH,
  GAME_STATUS_INIT,
  GAME_STATUS_JOIN,
  GAME_STATUS_MARKING,
  GAME_STATUS_NEXT_TURN,
  GAME_STATUS_QUIT,
  GAME_STATUS_READY,
  ROOM_STATUS_ALL_READY,
  ROOM_STATUS_AVAIL,
  ROOM_STATUS_BREAK,
  ROOM_STATUS_FINISH,
  ROOM_STATUS_FINISH_BREAK,
  ROOM_STATUS_FULL,
  ROOM_STATUS_ONE_READY,
} from './index.constants';
import { Room } from './types';

// add verivy client

const wsHandleError = (e: Error) => {
  console.log(e);
};

const wsConfigure = (port: number, verifyClient: VerifyClientCallbackAsync) => {
  let room: Room[] = [];
  let users: number[] = [];

  const wss = new WebSocketServer({ port, verifyClient });

  wss.on('connection', (ws) => {
    ws.on('error', wsHandleError);

    let newUserId = randomRoomNumber();
    while (users.some((item) => item === newUserId)) {
      newUserId = randomIdNumber();
    }
    const initData = {
      type: GAME_STATUS_INIT,
      user: newUserId,
      room: 0,
      value: JSON.stringify(getAvailableRooms(room)),
    };
    ws.send(JSON.stringify(initData));

    ws.on('message', (msg) => {
      const { type, user, value } = JSON.parse(msg.valueOf().toString());
      let broadcastData = null;

      if (type === GAME_STATUS_CREATE) {
        let newRoomId = randomRoomNumber();
        while (room.some((item) => item.id === newRoomId)) {
          newRoomId = randomRoomNumber();
        }

        room = [
          {
            id: newRoomId,
            status: ROOM_STATUS_AVAIL,
            user: [user],
          },
          ...room,
        ];

        broadcastData = JSON.stringify({
          type: GAME_STATUS_CREATE,
          user,
          room: newRoomId,
          roomStatus: ROOM_STATUS_AVAIL,
          value: JSON.stringify(getAvailableRooms(room)),
        });
      } else if (type === GAME_STATUS_JOIN) {
        const { roomId } = JSON.parse(value);
        room = room.map((item) => {
          if (item.id === roomId) {
            return {
              ...item,
              status: ROOM_STATUS_FULL,
              user: [...item.user, user],
            };
          }
          return item;
        });

        broadcastData = JSON.stringify({
          type: GAME_STATUS_JOIN,
          user,
          room: roomId,
          roomStatus: ROOM_STATUS_FULL,
          value: JSON.stringify(getAvailableRooms(room)),
        });
      } else if (type === GAME_STATUS_READY) {
        const { roomId, winnerId } = JSON.parse(value);
        const roomData = room.find((item) => item.id === roomId);
        if (!roomData) return;

        const isOneReady = roomData.status === ROOM_STATUS_ONE_READY;

        const randomMark = Math.ceil(Math.random() * 10);
        const marks = roomData.user.map((item, index) => ({
          id: item,
          mark: randomMark + index,
        }));

        room = room.map((item) => {
          if (item.id === roomId) {
            return {
              ...item,
              status:
                item.status === ROOM_STATUS_ONE_READY
                  ? ROOM_STATUS_ALL_READY
                  : ROOM_STATUS_ONE_READY,
            };
          }
          return item;
        });

        broadcastData = JSON.stringify({
          type: GAME_STATUS_READY,
          user,
          room: roomId,
          roomStatus: isOneReady
            ? ROOM_STATUS_ALL_READY
            : ROOM_STATUS_ONE_READY,
          value: JSON.stringify(
            isOneReady
              ? {
                  marks,
                  firstTurn: Math.ceil(Math.random() * 2),
                }
              : {
                  winnerId,
                }
          ),
        });
      } else if (type === GAME_STATUS_MARKING) {
        const { roomId } = JSON.parse(value);
        broadcastData = JSON.stringify({
          type: GAME_STATUS_MARKING,
          user,
          room: roomId,
          roomStatus: ROOM_STATUS_ALL_READY,
          value,
        });
      } else if (type === GAME_STATUS_NEXT_TURN) {
        const { roomId } = JSON.parse(value);
        broadcastData = JSON.stringify({
          type: GAME_STATUS_NEXT_TURN,
          user,
          room: roomId,
          roomStatus: ROOM_STATUS_ALL_READY,
          value: '{}',
        });
      } else if (type === GAME_STATUS_FINISH) {
        const { roomId } = JSON.parse(value);
        room = room.map((item) => {
          if (item.id === roomId) {
            return {
              ...item,
              status: ROOM_STATUS_FINISH,
            };
          }
          return item;
        });

        broadcastData = JSON.stringify({
          type: GAME_STATUS_FINISH,
          user,
          room: roomId,
          roomStatus: ROOM_STATUS_FINISH,
          value,
        });
      } else if (type === GAME_STATUS_FIND) {
        const { roomId } = JSON.parse(value);
        room = room.map((item) => {
          if (item.id === roomId) {
            return {
              ...item,
              status: ROOM_STATUS_AVAIL,
            };
          }
          return item;
        });
        broadcastData = JSON.stringify({
          type: GAME_STATUS_CREATE,
          user,
          room,
          roomStatus: ROOM_STATUS_AVAIL,
          value: JSON.stringify(getAvailableRooms(room)),
        });
      } else if (type === GAME_STATUS_QUIT) {
        const { roomId } = JSON.parse(value);
        const roomData = room.find((item) => item.id === roomId);
        users = users.filter((item) => item !== user);
        if (!roomData) return;
        const roomUser = roomData.user.find((item) => item !== user);
        if (roomUser) {
          room = room.map((item) => {
            if (item.id === roomId) {
              return {
                ...item,
                status:
                  item.status === ROOM_STATUS_FINISH
                    ? ROOM_STATUS_FINISH_BREAK
                    : ROOM_STATUS_BREAK,
                user: [roomUser],
              };
            }
            return item;
          });
          broadcastData = JSON.stringify({
            type: GAME_STATUS_QUIT,
            user: 0,
            room: roomId,
            roomStatus:
              roomData.status === ROOM_STATUS_FINISH
                ? ROOM_STATUS_FINISH_BREAK
                : ROOM_STATUS_BREAK,
            value: JSON.stringify(getAvailableRooms(room)),
          });
        } else {
          room = room.filter((item) => item.id !== roomId);
          broadcastData = JSON.stringify({
            type: GAME_STATUS_QUIT,
            user: 0,
            room: 0,
            roomStatus: 0,
            value: JSON.stringify(getAvailableRooms(room)),
          });
        }
      }

      if (broadcastData) {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastData);
          }
        });
      }
    });

    ws.on('close', () => {
      console.log('connection closed!');
    });
  });
};

export default wsConfigure;
