// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 GET /tts/config */
export async function config(options?: { [key: string]: any }) {
  return request<API.BaseResponseTtsConfigVO>('/tts/config', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /tts/health */
export async function health(options?: { [key: string]: any }) {
  return request<API.BaseResponseTtsHealthVO>('/tts/health', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /tts/ref/init */
export async function initRef(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.initRefParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/tts/ref/init', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /tts/synthesize */
export async function synthesize(body: API.TtsSynthesizeRequest, options?: { [key: string]: any }) {
  return request<string[]>('/tts/synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /tts/voice/add */
export async function addVoice(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.addVoiceParams,
  body: {},
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong>('/tts/voice/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      ...params,
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /tts/voice/delete */
export async function deleteVoice(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/tts/voice/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /tts/voice/get */
export async function getVoice(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getVoiceParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseTtsVoiceVO>('/tts/voice/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /tts/voice/list */
export async function listVoices(options?: { [key: string]: any }) {
  return request<API.BaseResponseListTtsVoiceVO>('/tts/voice/list', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /tts/voice/select */
export async function selectVoice(
  body: API.TtsVoiceSelectRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/tts/voice/select', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /tts/voice/update */
export async function updateVoice(
  body: API.TtsVoiceUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/tts/voice/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
