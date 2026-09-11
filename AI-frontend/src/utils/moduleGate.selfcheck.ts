/**
 * 模块门闸自检（不依赖后端）。运行：
 * node --experimental-strip-types src/utils/moduleGate.selfcheck.ts
 */
import {
  decide40100Action,
  filterGatedEntries,
  isGatedEntryVisible,
  isModuleHidden,
  moduleForPath,
  moduleUnavailableLocation,
} from './moduleGate.ts'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

const allOn = { loaded: true, enabled: (name: string) => name !== '' }
const blogOff = { loaded: true, enabled: (name: string) => name !== 'blog' }
const chatOff = { loaded: true, enabled: (name: string) => name !== 'chat' }
const notLoaded = { loaded: false, enabled: () => false }

assert(moduleForPath('/blog') === 'blog', 'blog list maps to blog')
assert(moduleForPath('/blog/12') === 'blog', 'blog post maps to blog')
assert(moduleForPath('/chat') === 'chat', 'chat maps to chat')
assert(moduleForPath('/chat/abc') === 'chat', 'chat session maps to chat')
assert(moduleForPath('/lab') === 'app-lab', 'lab maps to app-lab')
assert(moduleForPath('/about') === undefined, 'about is ungated')
assert(moduleForPath('/user/login') === undefined, 'login is ungated')
assert(moduleForPath('/chatbot') === undefined, 'chat prefix must not swallow chatbot')

assert(isGatedEntryVisible('blog', allOn), 'blog visible when on')
assert(!isGatedEntryVisible('blog', blogOff), 'blog hidden when off')
assert(isGatedEntryVisible('blog', notLoaded), 'blog visible before capabilities load')
assert(!isModuleHidden(undefined, blogOff), 'ungated entry never hidden')

const rooms = [
  { label: '随笔', requireModule: 'blog' },
  { label: '对话', requireModule: 'chat' },
  { label: '关于' },
]
assert(
  filterGatedEntries(rooms, blogOff)
    .map((r) => r.label)
    .join(',') === '对话,关于',
  'home rooms drop 随笔 when blog off',
)
assert(
  filterGatedEntries(rooms, chatOff)
    .map((r) => r.label)
    .join(',') === '随笔,关于',
  'home rooms drop 对话 when chat off',
)

const footerLinks = [
  { label: '关于', path: '/about' },
  { label: '随笔', path: '/blog', requireModule: 'blog' },
  { label: '实验室', path: '/lab', requireModule: 'app-lab' },
  { label: '友链', href: '#' },
]
const footer = filterGatedEntries(footerLinks, blogOff)
assert(
  !footer.some((l) => l.label === '随笔'),
  'footer drops 随笔 when blog off',
)
assert(
  footer.some((l) => l.label === '关于'),
  'footer keeps 关于',
)

assert(
  decide40100Action({
    pathname: '/blog',
    responseUrl: 'https://api.example/blog/post/list/page/vo',
    loaded: true,
    enabled: (n) => n !== 'blog',
  }) === 'unavailable',
  'unauth + blog off → unavailable, not login',
)
assert(
  decide40100Action({
    pathname: '/blog/99',
    loaded: false,
    enabled: () => true,
  }) === 'ignore',
  'capabilities not loaded yet must not 40100-login on gated path',
)
assert(
  decide40100Action({
    pathname: '/blog',
    loaded: true,
    enabled: () => true,
  }) === 'login',
  'blog on + 40100 → login',
)
assert(
  decide40100Action({
    pathname: '/user/profile',
    loaded: true,
    enabled: () => true,
  }) === 'login',
  'ungated auth path → login',
)
assert(
  decide40100Action({
    pathname: '/about',
    responseUrl: 'https://api.example/user/get/login',
    loaded: true,
    enabled: () => true,
  }) === 'ignore',
  'login probe ignored',
)
assert(
  moduleUnavailableLocation('/blog', 'blog').includes('/module-unavailable') &&
    moduleUnavailableLocation('/blog', 'blog').includes('module=blog'),
  'unavailable url keeps module + from',
)

console.log('moduleGate.selfcheck: pass')
