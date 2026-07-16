import request from '@/request'

/** GET /admin/site-settings/bootstrap */
export async function bootstrapSiteSettings(options?: { [key: string]: unknown }) {
  return request<API.BaseResponseSiteSettingsBootstrapVO>('/admin/site-settings/bootstrap', {
    method: 'GET',
    ...(options || {}),
  })
}

/** GET /admin/site-settings/modules */
export async function listSiteSettingModules(options?: { [key: string]: unknown }) {
  return request<API.BaseResponseListSettingModuleVO>('/admin/site-settings/modules', {
    method: 'GET',
    ...(options || {}),
  })
}

/** GET /admin/site-settings/{module}/schema */
export async function getSiteSettingSchema(
  module: string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseSettingModuleSchemaVO>(
    `/admin/site-settings/${encodeURIComponent(module)}/schema`,
    {
      method: 'GET',
      ...(options || {}),
    },
  )
}

/** GET /admin/site-settings/{module} */
export async function getSiteSettingValues(
  module: string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseSettingModuleValuesVO>(
    `/admin/site-settings/${encodeURIComponent(module)}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  )
}

/** PUT /admin/site-settings/{module} */
export async function updateSiteSettingValues(
  module: string,
  body: API.SiteSettingUpdateRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseBoolean>(
    `/admin/site-settings/${encodeURIComponent(module)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data: body,
      ...(options || {}),
    },
  )
}

/** POST /admin/site-settings/{module}/reset */
export async function resetSiteSettingModule(
  module: string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseBoolean>(
    `/admin/site-settings/${encodeURIComponent(module)}/reset`,
    {
      method: 'POST',
      ...(options || {}),
    },
  )
}

/** POST /admin/site-settings/integration/test */
export async function testIntegrationConnection(
  body: API.IntegrationTestRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseIntegrationTestResultVO>(
    '/admin/site-settings/integration/test',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
      ...(options || {}),
    },
  )
}

/** GET /admin/site-settings/audit */
export async function pageSiteSettingAudit(
  params?: API.SiteSettingAuditQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponsePageSiteSettingAuditVO>('/admin/site-settings/audit', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}

/** GET /admin/site-settings/health */
export async function listSiteSettingHealth(options?: { [key: string]: unknown }) {
  return request<API.BaseResponseListIntegrationTestResultVO>('/admin/site-settings/health', {
    method: 'GET',
    ...(options || {}),
  })
}

/** POST /admin/site-settings/health/{target} */
export async function testSiteSettingHealth(
  target: string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseIntegrationTestResultVO>(
    `/admin/site-settings/health/${encodeURIComponent(target)}`,
    {
      method: 'POST',
      ...(options || {}),
    },
  )
}
