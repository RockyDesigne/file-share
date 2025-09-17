import axios from 'axios';

// Adjust the backend base URL here. If the React dev server (localhost:5173) is on a different port than the backend
// you will probably need to enable CORS on the backend as well.
const api = axios.create({
  baseURL: 'http://localhost:8081/main-controller',
});

export interface UserDTO {
  username: string;
  password: string;
}

export interface FileDataDTO {
  id: number;
  name: string;
  // include other props from backend if necessary
}

export const registerUser = async (user: UserDTO) => {
  const { data } = await api.post<string>('/register-user', user);
  return data;
};

export const loginUser = async (user: UserDTO): Promise<string> => {
  const { data } = await api.post<string>('/login', user);
  return data; // JWT token
};

export const getUserFiles = async (username: string) => {
  const { data } = await api.get<FileDataDTO[]>(`/published-files`, { params: { username: username } });
  return data;
};

export const uploadFile = async (file: File, username: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('username', username);
  const { data } = await api.post<string>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getAllUsers = async () => {
  const { data } = await api.get<UserDTO[]>('/user-list');
  return data;
};

export const downloadFile = async (fileName: string, username: string) => {
  const { data } = await api.get<ArrayBuffer>(`/download`, {
    params: { file_name: fileName, user_name: username },
    responseType: 'arraybuffer',
  });
  return data;
};
