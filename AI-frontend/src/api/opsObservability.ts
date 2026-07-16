import request from '@/request'

/** GET /admin/ops/usage/summary */
export async function getOpsUsageSummary(
  params?: API.OpsUsageSummaryQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseOpsUsageSummaryVO>('/admin/ops/usage/summary', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}

/** GET /admin/ops/usage/logs */
export async function pageOpsUsageLogs(
  params?: API.OpsUsageLogQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponsePageOpsUsageLogVO>('/admin/ops/usage/logs', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}

/** GET /admin/ops/audit */
export async function pageOpsAuditLogs(
  params?: API.OpsAuditLogQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponsePageOpsAuditLogVO>('/admin/ops/audit', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}

/** GET /admin/ops/stats/overview */
export async function getOpsBizStatsOverview(
  params?: API.OpsBizStatsQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseOpsBizStatsOverviewVO>('/admin/ops/stats/overview', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}

/** GET /admin/ops/stats/series */
export async function getOpsBizStatsSeries(
  params: API.OpsBizStatsSeriesQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseListOpsBizStatsPointVO>('/admin/ops/stats/series', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}

/** GET /admin/ops/access-logs */
export async function pageOpsAccessLogs(
  params?: API.OpsAccessLogQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponsePageOpsAccessLogVO>('/admin/ops/access-logs', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}
