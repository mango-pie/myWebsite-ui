/**
 * 轻量自检：node --experimental-strip-types src/utils/settingModules.selfcheck.ts
 * 不引入测试框架；失败 process.exit(1)。
 */
import {
  filterSettingModules,
  isSettingModuleEnabled,
  resolveSettingsModuleRoute,
} from './settingModules.ts'

function assert(cond: unknown, msg: string) {
  if (!cond) {
    throw new Error(`FAIL ${msg}`)
  }
}

const registry: API.SettingModuleVO[] = [
  { code: 'site', displayName: '站点', writable: true },
  { code: 'blog', displayName: '博客', writable: true },
  { code: 'app', displayName: '实验室', writable: true },
  { code: 'reading', displayName: '精读', writable: true },
  { code: 'integration', displayName: '集成', writable: true },
]

assert(isSettingModuleEnabled('blog', { blog: true }, true) === true, 'blog on')
assert(isSettingModuleEnabled('blog', { blog: false }, true) === false, 'blog off')
assert(isSettingModuleEnabled('site', { blog: false }, true) === true, 'site stays (platform)')
assert(isSettingModuleEnabled('app', { 'app-lab': false }, true) === false, 'app alias off')
assert(isSettingModuleEnabled('reading', { knowledge: false }, true) === false, 'reading follows knowledge')
assert(isSettingModuleEnabled('integration', { blog: false }, true) === true, 'integration platform')
assert(isSettingModuleEnabled('blog', {}, false) === true, 'not loaded yet → keep')
assert(isSettingModuleEnabled('blog', {}, true) === false, 'known module missing → off')

const allOn = filterSettingModules(
  registry,
  { blog: true, 'app-lab': true, knowledge: true },
  true,
)
assert(allOn.map((m) => m.code).join(',') === 'site,blog,app,reading,integration', 'all on order')

const blogOff = filterSettingModules(
  registry,
  { blog: false, 'app-lab': true, knowledge: true },
  true,
)
assert(!blogOff.some((m) => m.code === 'blog'), 'blog tab gone')
assert(blogOff.some((m) => m.code === 'site'), 'site remains')

const deep = resolveSettingsModuleRoute('blog', blogOff)
assert(deep.status === 'redirect' && deep.target === 'site', 'deep link blog off → site')

const ok = resolveSettingsModuleRoute('site', blogOff)
assert(ok.status === 'ok' && ok.target === 'site', 'site still ok')

const empty = resolveSettingsModuleRoute('site', [])
assert(empty.status === 'empty', 'empty registry')

const noParam = resolveSettingsModuleRoute('', blogOff)
assert(noParam.status === 'redirect' && noParam.target === 'site', 'empty param → first')

console.log('settingModules.selfcheck ok')
