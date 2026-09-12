import request from '@/request'

export type WorkLogApiEntry = {
  id?: number
  userId?: number
  workDate?: string
  date?: string
  title?: string
  done?: string
  problem?: string
  summary?: string
  plan?: string
  tags?: string[]
  createdTime?: string
  updatedTime?: string
  createdAt?: number
  updatedAt?: number
}

export async function listWorkLogs(limit = 200) {
  return request<{ code?: number; data?: WorkLogApiEntry[]; message?: string }>('/worklog/list', {
    method: 'GET',
    params: { limit },
  })
}

export async function getWorkLogByDate(date: string) {
  return request<{ code?: number; data?: WorkLogApiEntry | null; message?: string }>('/worklog/by-date', {
    method: 'GET',
    params: { date },
  })
}

export async function saveWorkLog(body: {
  workDate: string
  title?: string
  done?: string
  problem?: string
  summary?: string
  plan?: string
  tags?: string[]
}) {
  return request<{ code?: number; data?: number; message?: string }>('/worklog/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

export async function deleteWorkLog(date: string) {
  return request<{ code?: number; data?: boolean; message?: string }>('/worklog/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { date },
  })
}

export async function importWorkLogs(entries: Array<{
  workDate: string
  title?: string
  done?: string
  problem?: string
  summary?: string
  plan?: string
  tags?: string[]
}>, overwrite = true) {
  return request<{ code?: number; data?: { imported?: number; skipped?: number }; message?: string }>('/worklog/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { overwrite, entries },
  })
}
