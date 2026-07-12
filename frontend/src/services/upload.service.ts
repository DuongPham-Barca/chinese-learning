import api from "@/lib/api"

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("image", file)
  const response = await api.post<{ success: boolean; data: { url: string } }>("/admin/upload", formData)
  return response.data.data.url
}
