import { createConsumer } from "@rails/actioncable";
import ENVIRONMENT from "../config/environment";
import { getToken } from "./session";

const buildCableUrl = () => `${ENVIRONMENT.URL_CABLE}?token=${encodeURIComponent(getToken() || "")}`;

let consumer = null;

export const getConsumer = () => {
  if (!consumer) consumer = createConsumer(buildCableUrl);
  return consumer;
};

export const closeConsumer = () => {
  consumer?.disconnect();
  consumer = null;
};
