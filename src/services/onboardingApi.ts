import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";
const TEMPLATE_URL =
  import.meta.env.VITE_TEMPLATE_URL ||
  "https://aiforbharath-templates.s3.ap-south-1.amazonaws.com/sales_template.xlsx";

// ─── Types ──────────────────────────────────────────────────────────────

export interface SignupPayload {
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  password: string;
}

export interface SignupResponse {
  userId: string;
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  shopName: string;
  ownerName: string;
  email: string;
  trainingStatus: string;
}

export interface UploadResponse {
  message: string;
  s3Key: string;
  trainingStatus: string;
}

export interface TrainingStatusResponse {
  trainingStatus: string;
}

// ─── Mock helpers ───────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let mockUsers: Record<string, LoginResponse & { hashPass: string }> = {};

// ─── API Functions ──────────────────────────────────────────────────────

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  if (!BASE_URL) {
    await delay(800);
    const userId = "mock-" + Date.now();
    mockUsers[payload.email] = {
      userId,
      shopName: payload.shopName,
      ownerName: payload.ownerName,
      email: payload.email,
      trainingStatus: "NOT_STARTED",
      hashPass: payload.password,
    };
    return { userId, message: "User created successfully" };
  }
  const { data } = await axios.post<SignupResponse>(`${BASE_URL}/signup`, payload);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  if (!BASE_URL) {
    await delay(800);
    const user = Object.values(mockUsers).find(
      (u) => u.email === payload.email && u.hashPass === payload.password
    );
    if (user) {
      return {
        userId: user.userId,
        shopName: user.shopName,
        ownerName: user.ownerName,
        email: user.email,
        trainingStatus: user.trainingStatus,
      };
    }
    // Fallback demo user
    if (payload.email === "demo@kirana.com" && payload.password === "demo123") {
      return {
        userId: "demo-user",
        shopName: "Demo Kirana Store",
        ownerName: "Demo Owner",
        email: "demo@kirana.com",
        trainingStatus: "NOT_STARTED",
      };
    }
    throw new Error("Invalid email or password");
  }
  const { data } = await axios.post<LoginResponse>(`${BASE_URL}/login`, payload);
  return data;
}

export async function uploadSalesData(
  userId: string,
  file: File
): Promise<UploadResponse> {
  if (!BASE_URL) {
    await delay(1200);
    // Update mock user status
    const user = Object.values(mockUsers).find((u) => u.userId === userId);
    if (user) user.trainingStatus = "UPLOADED";
    // Simulate training lifecycle in background
    setTimeout(() => {
      if (user) user.trainingStatus = "TRAINING";
      setTimeout(() => {
        if (user) user.trainingStatus = "READY";
      }, 8000);
    }, 3000);
    return {
      message: "File uploaded successfully",
      s3Key: `sales-data/${userId}/sales_upload.xlsx`,
      trainingStatus: "UPLOADED",
    };
  }

  // Convert file to base64
  const reader = new FileReader();
  const fileData: string = await new Promise((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data:... prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const { data } = await axios.post<UploadResponse>(`${BASE_URL}/upload-sales`, {
    userId,
    fileData,
  });
  return data;
}

export async function getTrainingStatus(
  userId: string
): Promise<TrainingStatusResponse> {
  if (!BASE_URL) {
    await delay(400);
    const user = Object.values(mockUsers).find((u) => u.userId === userId);
    return { trainingStatus: user?.trainingStatus || "NOT_STARTED" };
  }
  const { data } = await axios.get<TrainingStatusResponse>(
    `${BASE_URL}/training-status/${userId}`
  );
  return data;
}

export function getTemplateDownloadUrl(): string {
  return TEMPLATE_URL;
}
