import axios from "axios";

const api = axios.create()

api.defaults.baseURL = 'https://api-mananciais.yuresamarone.shop/api/v1';
api.defaults.headers.post['Content-Type'] = 'application/json'
// instance.defaults.headers.common['Authorization'] = AUTH_TOKEN;
export default api;