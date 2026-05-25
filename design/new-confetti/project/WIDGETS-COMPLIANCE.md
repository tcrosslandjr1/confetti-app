# Confetti — Countdown Widgets + Store Compliance

## 1 · iOS WidgetKit (Swift) — TonightCountdownWidget

Lock screen + Home screen widget that counts down to the next stop.

### `TonightCountdownWidget.swift`
```swift
import WidgetKit
import SwiftUI

struct PassEntry: TimelineEntry {
  let date: Date
  let nextStopName: String
  let nextStopTime: Date
  let passCode: String
  let vibeColor: Color    // #ff5b3d (coral) by default
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> PassEntry {
    PassEntry(date: .now, nextStopName: "Lupa Notte",
              nextStopTime: .now.addingTimeInterval(2700),
              passCode: "#A7K2", vibeColor: Color(red: 1, green: 0.36, blue: 0.24))
  }
  func getSnapshot(in: Context, completion: @escaping (PassEntry) -> Void) {
    completion(placeholder(in: in))
  }
  func getTimeline(in: Context, completion: @escaping (Timeline<PassEntry>) -> Void) {
    // Fetch from shared UserDefaults app group: group.app.confetti
    let group = UserDefaults(suiteName: "group.app.confetti")
    let stop  = group?.string(forKey: "next_stop_name") ?? "—"
    let time  = group?.object(forKey: "next_stop_time") as? Date ?? .now
    let code  = group?.string(forKey: "active_pass_code") ?? "—"

    let entry = PassEntry(date: .now, nextStopName: stop,
                          nextStopTime: time, passCode: code,
                          vibeColor: Color(red: 1, green: 0.36, blue: 0.24))
    // Refresh every 5 min until showtime, then every minute
    let refreshAt = time.timeIntervalSinceNow > 1800
                  ? Date.now.addingTimeInterval(300)
                  : Date.now.addingTimeInterval(60)
    completion(Timeline(entries: [entry], policy: .after(refreshAt)))
  }
}

struct TonightCountdownView: View {
  let entry: PassEntry
  @Environment(\.widgetFamily) var family

  var body: some View {
    ZStack {
      entry.vibeColor
      VStack(alignment: .leading, spacing: 4) {
        HStack {
          Text("✣").font(.system(size: 14, weight: .black))
          Text("CONFETTI").font(.system(size: 10, weight: .heavy))
            .tracking(2).opacity(0.7)
          Spacer()
          Text(entry.passCode).font(.system(size: 9, weight: .bold))
            .opacity(0.6)
        }
        Spacer()
        Text("NEXT STOP").font(.system(size: 9, weight: .heavy))
          .tracking(1.5).opacity(0.65)
        Text(entry.nextStopName)
          .font(.custom("BricolageGrotesque-Black", size: 22))
          .lineLimit(2).minimumScaleFactor(0.7)
        Spacer()
        Text(entry.nextStopTime, style: .timer)
          .font(.system(size: family == .systemSmall ? 28 : 40, weight: .black))
          .monospacedDigit()
      }
      .padding(14).foregroundColor(.black)
    }
  }
}

@main
struct TonightCountdownWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TonightCountdown", provider: Provider()) { entry in
      TonightCountdownView(entry: entry)
    }
    .configurationDisplayName("Tonight's Next Stop")
    .description("Counts down to your next Confetti pass stop.")
    .supportedFamilies([.systemSmall, .systemMedium,
                        .accessoryRectangular, .accessoryCircular])
  }
}
```

### How the main app pushes data
```swift
let group = UserDefaults(suiteName: "group.app.confetti")!
group.set(stop.name, forKey: "next_stop_name")
group.set(stop.scheduledTime, forKey: "next_stop_time")
group.set(pass.code, forKey: "active_pass_code")
WidgetCenter.shared.reloadAllTimelines()
```

### Lock-screen variants
- **Rectangular** — venue name + countdown
- **Circular** — minutes remaining as a progress ring
- **Inline** — "Lupa Notte · 27m"

## 2 · Android Glance widget (Kotlin) — TonightCountdownWidget

### `TonightCountdownWidget.kt`
```kotlin
class TonightCountdownWidget : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    provideContent {
      val prefs = currentState<Preferences>()
      val name = prefs[stringPreferencesKey("next_stop_name")] ?: "—"
      val timeMillis = prefs[longPreferencesKey("next_stop_time")] ?: 0L
      val code = prefs[stringPreferencesKey("active_pass_code")] ?: "—"
      Countdown(name, timeMillis, code)
    }
  }
}

@Composable fun Countdown(name: String, target: Long, code: String) {
  val remaining = target - System.currentTimeMillis()
  val mins = (remaining / 60000).coerceAtLeast(0)
  Box(modifier = GlanceModifier.fillMaxSize()
    .background(Color(0xFFFF5B3D)).padding(14.dp)) {
    Column {
      Row {
        Text("✣ CONFETTI", style = TextStyle(fontSize = 10.sp,
          fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp))
        Spacer(GlanceModifier.defaultWeight())
        Text(code, style = TextStyle(fontSize = 9.sp))
      }
      Spacer(GlanceModifier.height(8.dp))
      Text("NEXT STOP", style = TextStyle(fontSize = 9.sp,
        fontWeight = FontWeight.Bold, letterSpacing = 1.sp))
      Text(name, style = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Black))
      Spacer(GlanceModifier.defaultWeight())
      Text("$mins min", style = TextStyle(fontSize = 36.sp,
        fontWeight = FontWeight.Black))
    }
  }
}

class TonightCountdownReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget = TonightCountdownWidget()
}
```

## 3 · App Store + Play Store compliance checklist

### Apple — required
- [ ] **Sign in with Apple** offered as an SSO option whenever other SSO providers (Google, TikTok) are offered
- [ ] **In-App Purchase (StoreKit)** for the All-Access $9.99 subscription if subscriptions are accessible from inside the iOS app (no external payment links). Stripe checkout is allowed from external web only.
- [ ] **30 % platform fee** on IAP — price All-Access at $12.99 in iOS to net $9.09, or accept the margin hit
- [ ] **App Tracking Transparency** prompt before reading IDFA. We don't track cross-app, so we declare "we don't track."
- [ ] **Privacy Nutrition Labels** filled in App Store Connect: contacts (linked to identity, optional), email, name, phone, location (only with active pass), photos (user-uploaded check-ins), purchase history.
- [ ] **App Privacy Report** support — surface our data usage in Settings
- [ ] **Account Deletion** in-app per Section 5.1.1(v) — Settings → Account → Delete
- [ ] **NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSLocationWhenInUseUsageDescription** with plain-English reasons in Info.plist
- [ ] **Age rating: 17+** because we plan venues serving alcohol. Family Mode does not change this rating.
- [ ] **No mention of competing platforms or external sub links** inside the iOS app (no "subscribe on the web for less")
- [ ] **WidgetKit:** widgets must not require ATT and cannot make autonomous network calls
- [ ] **CarPlay:** if added later, follow Driving Audio guidelines

### Google Play — required
- [ ] **Google Play Billing** for All-Access subscription
- [ ] **Data Safety form** in Play Console — match what we declare in-app
- [ ] **Foreground Service** declared for active-pass location tracking, with persistent notification ("Confetti is following your night")
- [ ] **ACCESS_BACKGROUND_LOCATION** only for active-pass users; justify with the in-product explainer
- [ ] **Target API level** ≥ 34 (Android 14)
- [ ] **AppLinks for /p/[code] referrals** in `assetlinks.json`
- [ ] **Account Deletion** in-app AND via web URL per 2024 policy
- [ ] **Personal/Sensitive Info Policy** — declare alcohol references → restricted access for some markets
- [ ] **In-App News & Magazines policy** if we add the Confetti feed-of-curators feature
- [ ] **Glance widgets** can't run JS or load remote views — pre-render in Kotlin

### Both — universal
- [ ] **COPPA flow** — verifiable parental consent for under-13 (you have the AgeGate + ParentalConsent screens; ensure backend writes to a `parental_consent_log` table with timestamp + IP + email-verification token)
- [ ] **GDPR/CCPA right-to-export + right-to-delete** working end-to-end with audit logs
- [ ] **DMCA contact** published at `confetti.app/dmca`
- [ ] **Abuse reporting** in-app on every user-generated piece of content (reels, check-in photos, captions)
- [ ] **Auto-moderation** for kid-related content; never auto-publish user reels with detected under-13 faces
- [ ] **Content Rating** filled with IARC (alcohol references, mild references, no violence)
- [ ] **Subscription terms shown before purchase**: $9.99/mo or $99/yr, auto-renews, cancel-anytime, 7-day trial then auto-charge
- [ ] **No deceptive language** ("free!" needs an asterisk if there's any paid tier; we say "7-day free trial · then $9.99/mo")

### Things to NOT do
- Don't promote external subscription URLs from inside the iOS app
- Don't auto-post to TikTok/IG without explicit user approval each time
- Don't store passwords or card numbers (Supabase + Stripe do it)
- Don't track users outside the app for ads
- Don't use a generic privacy policy template — use the bespoke one in `help.html`

## 4 · The 4 widget variants people will actually use

1. **Tonight's Next Stop** (countdown to next stop) — default
2. **Tonight's Whole Night** (medium widget, all 3 stops as a horizontal strip)
3. **Crew Live** (where crew is now — pulse dots, no countdown)
4. **Pass · Live QR** (lock-screen — taps to open Wallet directly)

All four share the `group.app.confetti` data store. The main app writes; widgets read.

## 5 · Backend hook for widget data sync

```ts
// /api/widget-sync — called by the app when the active pass changes
export async function POST(req: Request) {
  const supa = createClient()
  const { data: { user } } = await supa.auth.getUser()
  const { data: pass } = await supa.from('passes')
    .select('*, stops(*)')
    .eq('user_id', user!.id).eq('status', 'active')
    .order('printed_at', { ascending: false }).limit(1).single()

  const nextStop = pass?.stops.find((s: any) => !s.completed_at)
  return Response.json({
    pass_code: pass?.pass_code,
    next_stop_name: nextStop?.venue_name,
    next_stop_time: nextStop?.scheduled_time,
    next_stop_color: nextStop?.color,
  })
}
```

The native app polls this every 5 min while a pass is active and writes to the shared UserDefaults / DataStore so the widget always has fresh data.

Hand this whole file to your iOS dev + Android dev. Should take ~2 weeks total to ship both widgets + clear store review.
