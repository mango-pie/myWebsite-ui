import type { usePulseDiscover } from '@/composables/usePulseDiscover'
import type { usePulsePlayer } from '@/composables/usePulsePlayer'
import type { useNeteaseLogin } from '@/design/useNeteaseLogin'

export type PulsePlayerApi = ReturnType<typeof usePulsePlayer>
export type PulseDiscoverApi = ReturnType<typeof usePulseDiscover>
export type NeteaseLoginApi = ReturnType<typeof useNeteaseLogin>
