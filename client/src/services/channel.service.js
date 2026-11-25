import { api } from "./httpClient";
import { messagePayload } from "./messagePayload";

export const channelService = {
  getByWorkspace: (workspaceId) => api.get(`/workspaces/${workspaceId}/channels`),
  create: (workspaceId, name) => api.post(`/workspaces/${workspaceId}/channels`, { name }),
  getMessages: (channelId) => api.get(`/channels/${channelId}/messages`),
  sendMessage: (channelId, body, files) => api.post(`/channels/${channelId}/messages`, messagePayload(body, files))
};
