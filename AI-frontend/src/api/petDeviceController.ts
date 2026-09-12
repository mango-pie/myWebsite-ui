import request from '@/request'

/** POST /pet/devices — 绑定 EchoBot 设备，明文 token 仅返回一次 */
export async function bindPetDevice(
  body?: { deviceName?: string; clientInfo?: string },
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePetDeviceBindVO>('/pet/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body ?? {},
    ...(options || {}),
  })
}

/** GET /pet/devices */
export async function listPetDevices(options?: { [key: string]: any }) {
  return request<API.BaseResponseListPetDeviceVO>('/pet/devices', {
    method: 'GET',
    ...(options || {}),
  })
}

/** POST /pet/devices/revoke */
export async function revokePetDevice(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/pet/devices/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  })
}
