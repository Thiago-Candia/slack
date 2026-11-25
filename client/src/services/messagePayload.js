// Sin archivos el mensaje viaja como JSON; con archivos, como multipart/form-data.
export const messagePayload = (body, files = []) => {
  if (!files.length) return { body };

  const formData = new FormData();
  formData.append("body", body ?? "");
  files.forEach((file) => formData.append("files[]", file));

  return formData;
};
