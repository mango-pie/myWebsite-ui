import { ref, computed, onMounted } from 'vue';

const BASE_URL = '/netease-api';

type LoginStatus = 'logged-out' | 'logging' | 'logged-in' | 'error';

const isLoggedIn = ref(false);
const loginStatus = ref<LoginStatus>('logged-out');
const loginError = ref<string>('');
type QrStatus = 'idle' | 'waiting-scan' | 'waiting-confirm' | 'expired';
const qrStatus = ref<QrStatus>('idle');
const loginInfo = ref<{
  userId?: string;
  nickname?: string;
  avatar?: string;
}>({});
const qrCodeUrl = ref<string>('');
const COOKIE_KEY = 'netease_music_cookie';

let checkTimer: ReturnType<typeof setTimeout> | null = null;

const loginStatusText = computed(() => {
  if (loginStatus.value === 'logged-in') {
    return loginInfo.value.nickname ? `已登录：${loginInfo.value.nickname}` : '已登录';
  }
  if (loginStatus.value === 'error') {
    return loginError.value || '登录失败';
  }
  if (loginStatus.value === 'logging') {
    if (qrStatus.value === 'waiting-confirm') return '已扫码，等待确认';
    if (qrStatus.value === 'waiting-scan') return '等待扫码';
    return '准备二维码中';
  }
  if (qrStatus.value === 'expired') return '二维码已过期';
  return '未登录';
});

export function useNeteaseLogin() {
  const checkLoginStatus = async () => {
    if (loginStatus.value === 'logging') {
      return;
    }

    loginStatus.value = 'logging';
    
    // 尝试从 localStorage 读取保存的 cookie
    const savedCookie = localStorage.getItem(COOKIE_KEY);
    
    try {
      const response = await fetch(`${BASE_URL}/login/status`, savedCookie ? {
        headers: {
          'Cookie': savedCookie
        }
      } : {});
      const data = await response.json();

      console.log('登录状态检查响应:', JSON.stringify(data, null, 2));

      // api-enhanced 返回结构: { status: 200, body: { data: { ...account info } } }
      // 或者可能是: { code: 200, data: { account: {...}, profile: {...} } }
      const accountInfo = data.body?.data || data.data;
      
      // 判断是否已登录
      const hasLogin = data.code === 200 && (
        accountInfo?.profile?.userId || 
        accountInfo?.account?.id ||
        accountInfo?.account?.userId ||
        accountInfo?.userId
      );

      if (hasLogin) {
        isLoggedIn.value = true;
        loginStatus.value = 'logged-in';
        qrStatus.value = 'idle';
        loginInfo.value = {
          userId: String(accountInfo?.profile?.userId || accountInfo?.account?.id || accountInfo?.account?.userId || accountInfo?.userId || ''),
          nickname: accountInfo?.profile?.nickname || accountInfo?.nickname || '',
          avatar: accountInfo?.profile?.avatarUrl || accountInfo?.avatar || '',
        };
      } else {
        isLoggedIn.value = false;
        loginStatus.value = 'logged-out';
        qrStatus.value = 'idle';
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      loginStatus.value = 'error';
      loginError.value = '检查登录状态失败';
      qrStatus.value = 'idle';
    }
  };

  const generateQrCode = async () => {
    try {
      // 1. 获取二维码 key
      const keyResponse = await fetch(`${BASE_URL}/login/qr/key`);
      const keyData = await keyResponse.json();

      if (keyData.code !== 200 || !keyData.data?.unikey) {
        throw new Error('获取二维码key失败');
      }

      const qrKey = keyData.data.unikey;

      // 2. 获取二维码图片
      const createResponse = await fetch(
        `${BASE_URL}/login/qr/create?key=${qrKey}&platform=web&qrimg=true&timestamp=${Date.now()}`
      );
      const createData = await createResponse.json();

      if (createData.code !== 200 || !createData.data?.qrimg) {
        throw new Error('获取二维码图片失败');
      }

      qrCodeUrl.value = createData.data.qrimg;
      qrStatus.value = 'waiting-scan';

      return qrKey;
    } catch (error) {
      console.error('生成二维码失败:', error);
      throw error;
    }
  };

  const handleLogin = async () => {
    if (loginStatus.value === 'logging') {
      return;
    }

    loginStatus.value = 'logging';
    loginError.value = '';
    qrCodeUrl.value = '';
    qrStatus.value = 'idle';

    try {
      const qrKey = await generateQrCode();

      // 轮询检查扫码状态
      let attempts = 0;
      const maxAttempts = 100; // 约5分钟

      const checkStatus = async () => {
        if (attempts >= maxAttempts) {
          loginStatus.value = 'error';
          loginError.value = '登录超时，请重试';
          qrStatus.value = 'expired';
          return;
        }

        attempts++;

        try {
          const checkResponse = await fetch(
            `${BASE_URL}/login/qr/check?key=${qrKey}&timestamp=${Date.now()}`
          );
          const checkData = await checkResponse.json();

          switch (checkData.code) {
            case 800:
              loginStatus.value = 'error';
              loginError.value = '二维码已过期，请重新获取';
              qrStatus.value = 'expired';
              return;

            case 801:
              // 等待扫码
              qrStatus.value = 'waiting-scan';
              checkTimer = setTimeout(checkStatus, 2000);
              return;

            case 802:
              // 等待确认
              qrStatus.value = 'waiting-confirm';
              checkTimer = setTimeout(checkStatus, 1500);
              return;

            case 803:
              // 登录成功！code 803 表示授权成功
              isLoggedIn.value = true;
              loginStatus.value = 'logged-in';
              qrCodeUrl.value = '';
              qrStatus.value = 'idle';
              
              // 保存 cookie 到 localStorage
              if (checkData.cookie) {
                const cookieStr = Array.isArray(checkData.cookie) 
                  ? checkData.cookie.join(';') 
                  : checkData.cookie;
                localStorage.setItem(COOKIE_KEY, cookieStr);
              }
              
              // 获取用户信息
              await checkLoginStatus();
              return;

            default:
              if (checkData.code === 200) {
                // 某些情况下直接返回 200
                isLoggedIn.value = true;
                loginStatus.value = 'logged-in';
                qrCodeUrl.value = '';
                qrStatus.value = 'idle';
                await checkLoginStatus();
              } else {
                loginStatus.value = 'error';
                loginError.value = checkData.message || '登录失败';
                qrStatus.value = 'idle';
              }
              return;
          }
        } catch (error) {
          console.error('检查状态失败:', error);
          checkTimer = setTimeout(checkStatus, 3000);
        }
      };

      checkTimer = setTimeout(checkStatus, 1000);

    } catch (error) {
      console.error('登录失败:', error);
      loginStatus.value = 'error';
      loginError.value = error instanceof Error ? error.message : '登录失败';
      qrStatus.value = 'idle';
    }
  };

  const handleLogout = async () => {
    if (checkTimer) {
      clearTimeout(checkTimer);
      checkTimer = null;
    }
    
    try {
      await fetch(`${BASE_URL}/logout`);
    } catch (error) {
      console.error('退出登录失败:', error);
    }
    
    // 清除本地保存的 cookie
    localStorage.removeItem(COOKIE_KEY);
    
    isLoggedIn.value = false;
    loginStatus.value = 'logged-out';
    loginInfo.value = {};
    qrCodeUrl.value = '';
    qrStatus.value = 'idle';
  };

  onMounted(() => {
    checkLoginStatus();
  });

  return {
    isLoggedIn,
    loginStatus,
    loginError,
    loginStatusText,
    loginInfo,
    qrStatus,
    qrCodeUrl,
    handleLogin,
    handleLogout,
    checkLoginStatus,
  };
}
