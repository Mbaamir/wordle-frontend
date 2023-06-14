import axios from "axios";

const localEndpoint = "https://vitoshi-backend-staging.up.railway.app/api/";

const axiosInstance = axios.create({
  baseURL: localEndpoint,
});

export default axiosInstance;
