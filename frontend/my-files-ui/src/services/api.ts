import axios from 'axios';

// Adjust the backend base URL here. If the React dev server (localhost:5173) is on a different port than the backend
// you will probably need to enable CORS on the backend as well.
const api = axios.create({
  baseURL: 'http://localhost:8081/main-controller',
});

export interface UserDTO {
  username: string;
  password: string;
  address: string;
}

export interface FileDataDTO {
  id: number;
  name: string;
  // include other props from backend if necessary
}

// Generic Page interface mirroring Spring's Page object
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page index (0-based)
  size: number;
}

export const registerUser = async (user: UserDTO) => {
  const { data } = await api.post<string>('/register-user', user);
  return data;
};

export const loginUser = async (user: UserDTO): Promise<string> => {
  const { data } = await api.post<string>('/login', user);
  return data; // JWT token
};

export const updateUser = async (user: UserDTO): Promise<string> => {
  const { data } = await api.post<string>('/update-user', user);
  return data;
};

export const getUserFiles = async (username: string, page = 0, size = 10) => {
  const { data } = await api.get<Page<FileDataDTO>>(`/published-files-page`, {
    params: { username, page, size },
  });
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

export const getAllUsers = async (page = 0, size = 10) => {
  const { data } = await api.get<Page<UserDTO>>('/user-list-page', {
    params: { page, size },
  });
  return data;
};

export const downloadFile = async (fileName: string, username: string) => {
  const { data } = await api.get<ArrayBuffer>(`/download`, {
    params: { file_name: fileName, user_name: username },
    responseType: 'arraybuffer',
  });
  return data;
};
