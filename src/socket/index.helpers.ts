import { ROOM_STATUS_AVAIL } from "./index.constants";
import { Room } from "./types";

export const getAvailableRooms = (rooms: Room[]) => {
  return rooms.filter((item) => item.status === ROOM_STATUS_AVAIL);
};

export const randomRoomNumber = () => {
  return Math.ceil(Math.random() * 1000 * Math.random() * 1000);
};

export const randomIdNumber = () => {
  return Math.ceil(Math.random() * 10000 * Math.random() * 10000);
};
