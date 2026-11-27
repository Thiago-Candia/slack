import { api } from "./httpClient";
import { messagePayload } from "./messagePayload";

export const directMessageService = {
  getMessages: (workspaceId, userId) => api.get(`/workspaces/${workspaceId}/direct_messages/${userId}`),
  sendMessage: (workspaceId, userId, body, files) =>
    api.post(`/workspaces/${workspaceId}/direct_messages/${userId}`, messagePayload(body, files))
};
