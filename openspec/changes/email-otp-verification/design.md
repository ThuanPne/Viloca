## Design

### Màn hình verify-email

Route: `app/(auth)/verify-email.tsx`  
Nhận param `email` qua `useLocalSearchParams()`.

**Layout:**
```
[Back button]

Tiêu đề: "Xác nhận email"
Phụ đề: "Nhập mã 6 số được gửi đến <email>"

[_ ] [_ ] [_ ] [_ ] [_ ] [_ ]   ← 6 TextInput riêng biệt

[Lỗi nếu có]

[Nút Xác nhận]

"Chưa nhận được mã?"
[Gửi lại (60s)] hoặc [Gửi lại]
```

### OTP Input Implementation

Dùng mảng `otp: string[]` 6 phần tử + mảng `refs: RefObject<TextInput>[]` để focus.

```
onChangeText(index, value):
  - Nếu value là digit:
      otp[index] = value
      nếu index < 5 → refs[index+1].focus()
      nếu đủ 6 số → tự động gọi handleVerify()
  - Nếu value rỗng (xóa):
      otp[index] = ''

onKeyPress(index, key):
  - Nếu key === 'Backspace' && otp[index] === '':
      refs[index-1].focus()
      otp[index-1] = ''

onChangeText với paste (6 chars):
  - Detect nếu value.length === 6 và toàn số → điền cả 6 ô
```

### Supabase verifyOtp

```ts
supabase.auth.verifyOtp({
  email,
  token: otp.join(''),
  type: 'email',
})
```

Kết quả:
- `data.session` tồn tại → `onAuthStateChange` sẽ tự redirect vào `/(app)` (không cần redirect thủ công)
- `error` → hiện inline error, clear OTP

### Resend countdown

```ts
const [countdown, setCountdown] = useState(60);

useEffect(() => {
  if (countdown === 0) return;
  const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
  return () => clearTimeout(timer);
}, [countdown]);
```

Khi nhấn "Gửi lại":
```ts
await supabase.auth.resend({ email, type: 'signup' });
setCountdown(60);
```

### Thay đổi register.tsx

Khi Supabase bật email confirmation, `data.user` luôn truthy nhưng `data.session = null`. Code hiện tại check `data.user` nên redirect nhầm vào `/(app)` trước khi user verify. Cần check `data.session`:

```ts
// CŨ (sai):
if (data.user) {
  setUser(data.user);
  router.replace('/(app)');
} else {
  router.replace('/(auth)/login');
}

// MỚI:
if (data.session) {
  setUser(data.session.user);
  router.replace('/(app)');
} else if (data.user) {
  router.replace({ pathname: '/(auth)/verify-email', params: { email } });
}
```

### Thay đổi _layout.tsx — Auth guard conflict

`onAuthStateChange` fire với null session (TOKEN_REFRESHED, app resume, v.v.) sẽ redirect về `/(auth)/welcome` ngay cả khi user đang trên màn hình `verify-email`. Cần bỏ qua redirect nếu đang ở route đó:

```ts
// Thêm import:
import { useSegments } from 'expo-router';

// Trong RootLayout, thêm:
const segments = useSegments();

// Trong onAuthStateChange callback, thay logic redirect:
if (session?.user) {
  router.replace('/(app)');
} else if (!segments.includes('verify-email')) {
  router.replace('/(auth)/welcome');
}
```

> `segments` là mảng path hiện tại, e.g. `['(auth)', 'verify-email']`. Check `includes('verify-email')` đủ để guard biết không được redirect.

### Supabase Dashboard (manual step)

Authentication → Email Templates → Enable "OTP" thay vì "Magic Link".
Hoặc: Authentication → Settings → bỏ tick "Enable email confirmations" nếu muốn test không cần OTP.

> Không cần thay đổi trong code - Supabase tự gửi OTP 6 số khi `signUp()` được gọi với email chưa xác nhận.
