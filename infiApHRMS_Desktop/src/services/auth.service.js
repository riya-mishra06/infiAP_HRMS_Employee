import apiClient from "./apiClient";

export const authService = {
  // Step 1: Login (sends OTP to email)
  login: async (email, password, role) => {
    const payload = { email, password };
    if (role) payload.role = role;
    const res = await apiClient.post("/auth/login", payload);
    return res.data;
  },

  // Step 2: Verify OTP (first login)
  verify2FA: async (userId, otp) => {
    const res = await apiClient.post("/auth/verify-2fa", { userId, otp });
    // Save token on success
    if (res.data.token) {
      localStorage.setItem("accessToken", res.data.token);
      localStorage.setItem("token", res.data.token); // For existing app usage
      localStorage.setItem("userRole", res.data.role);
    }
    return res.data;
  },

  // Resend OTP
  resendOTP: async (userId) => {
    const res = await apiClient.post("/auth/resend-2fa", { userId });
    return res.data;
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
  },
};
