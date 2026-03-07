# Push Notifications

Overview of push notification setup, testing, and behavior.

---

## Features

- **New messages**: Push when someone sends a chat message (respects `push_messages` preference)
- **Whispers**: Push when someone whispers (respects `push_whispers` preference)
- **Stealth mode**: When `neutral_notifications` is true, shows generic "You have a new notification"
- **App icon badge**: Unread message count on app icon (native only)
- **Tab badge**: Unread count on Chat tab
- **Deep linking**: Tapping a notification opens the relevant chat or Whispers screen
- **Foreground toast**: In-app toast when new message arrives while app is open (no system notification)
- **Token refresh**: Re-registers push token when app returns from background

---

## Testing

### Prerequisites

- **Real device**: Push notifications do not work in the iOS Simulator. Use a physical device.
- **Expo Go** or **development build**: Push works in both.
- **Backend running**: Ensure the API is reachable (localhost for dev, or your deployed URL).

### Test new message push

1. Install the app on two devices (or one device + one web session).
2. Sign in as different users on each.
3. Start a conversation.
4. Put the recipient app in **background** (home screen) or **kill** it.
5. Send a message from the sender.
6. Recipient should receive a push notification.
7. Tap the notification → app opens to that chat.

### Test foreground toast

1. Keep the app **open** on the recipient device.
2. Send a message from the sender.
3. Recipient sees an in-app toast at the top (no system notification).
4. Tap "View" → navigates to the chat.

### Test with Expo Push Tool

1. Get the Expo push token from the app (log it or use a debug screen).
2. Go to [Expo Push Notification Tool](https://expo.dev/notifications).
3. Paste the token and send a test notification.
4. Verify it arrives.

### Test badge

1. Have unread messages.
2. Background the app.
3. App icon should show the unread count (iOS/Android).

---

## User Preferences

Stored in `user_profiles.preferences_json`:

| Key | Default | Description |
|-----|---------|-------------|
| `push_messages` | `true` | Push for new chat messages |
| `push_whispers` | `true` | Push for whispers |
| `neutral_notifications` | `false` | Stealth mode: generic text only |

Users control these in **Me → Notifications**.

---

## Permission Handling

- If the user denies notification permission, **Me → Notifications** shows a banner: "Notifications are off — Tap to open Settings".
- Tapping opens the system Settings app so the user can enable notifications.

---

## Privacy

- Notification content is controlled by user preferences (stealth mode).
- We never share notification data with third parties for marketing.
- Copy shown in the app: "Notifications help you stay connected. You can change these anytime. We never share your data with third parties for marketing."

---

## Backend

- Push tokens stored in `push_tokens` table.
- Expo Push API: `https://exp.host/--/api/v2/push/send`
- No FCM/APNs keys required when using Expo (Expo handles delivery).

---

## Web

- Push token registration is skipped on web.
- Web push would require service workers and Web Push API (future enhancement).
