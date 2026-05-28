#!/usr/bin/env python3
"""
fix-design-issues.py — Patches confetti-live.html to fix design issues.
Reads the bundled HTML, extracts manifest + template, applies fixes, re-encodes, writes back.

Key insight: The template JSON uses \\u002F to escape / in </script> tags.
json.dumps does NOT preserve this, so we must post-process the output.
"""

import json, base64, gzip, os, sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(SCRIPT_DIR, 'public', 'confetti-live.html')
ROOT_COPY = os.path.join(SCRIPT_DIR, 'confetti-live.html')

M_OPEN = '<script type="__bundler/manifest">'
T_OPEN = '<script type="__bundler/template">'

changes_log = []

def log(msg):
    changes_log.append(msg)
    print(f"  [FIX] {msg}")

def safe_replace(src, old, new, label=""):
    if old not in src:
        print(f"  [WARN] Pattern not found for '{label}': {old[:60]}...")
        return src
    n = src.count(old)
    result = src.replace(old, new)
    log(f"{label} ({n}x)")
    return result

def decode_manifest_entry(manifest, uuid):
    entry = manifest[uuid]
    raw = base64.b64decode(entry['data'])
    if entry.get('compressed'):
        raw = gzip.decompress(raw)
    return raw.decode('utf-8')

def encode_manifest_entry(manifest, uuid, src_text):
    entry = manifest[uuid]
    raw = src_text.encode('utf-8')
    if entry.get('compressed'):
        raw = gzip.compress(raw, compresslevel=9)
    entry['data'] = base64.b64encode(raw).decode('ascii')

def find_uuid(manifest, prefix):
    for uuid in manifest:
        if uuid.startswith(prefix):
            return uuid
    raise ValueError(f"No UUID starting with {prefix}")

def safe_json_for_html(json_str):
    """Replace </ with <\\u002F so </script> inside JSON doesn't close the HTML script tag."""
    return json_str.replace('</', '<\\u002F')

# ══════════════════════════════════════════════════════════════════════
# 1. READ
# ══════════════════════════════════════════════════════════════════════
print("Reading confetti-live.html...")
with open(HTML_PATH, 'r', encoding='utf-8') as f:
    content = f.read()
original_size = len(content)
print(f"  File size: {original_size:,} chars")

# ══════════════════════════════════════════════════════════════════════
# 2. EXTRACT
# ══════════════════════════════════════════════════════════════════════
print("Extracting manifest and template...")

m_start = content.find(M_OPEN)
m_tag_end = m_start + len(M_OPEN)
m_close = content.find('</script>', m_start)
manifest = json.loads(content[m_tag_end:m_close].strip())
print(f"  Manifest: {len(manifest)} entries")

t_start = content.find(T_OPEN)
t_tag_end = t_start + len(T_OPEN)
t_close = content.find('</script>', t_start)
template = json.loads(content[t_tag_end:t_close].strip())
print(f"  Template: {len(template):,} chars")

# Save the prefix (everything before manifest data) and suffix (everything after template close)
prefix = content[:m_tag_end]                 # up to and including manifest open tag
between_m_t = content[m_close:t_tag_end]      # </script>...template open tag
suffix = content[t_close:]                    # </script> and everything after

# ══════════════════════════════════════════════════════════════════════
# 3. CSS FIXES — inject into template's <style> block
# ══════════════════════════════════════════════════════════════════════
print("\nApplying CSS fixes...")

CSS_FIXES = """
/* === DESIGN FIX CSS === */
.cf-explore-card::before,
[class*="venue-card"]::before,
[class*="reel"]::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 120px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.45), transparent);
  pointer-events: none;
  z-index: 1;
}
.cf-send-btn {
  background: var(--accent-1, #ff5b3d) !important;
  color: var(--ink, #130b0d) !important;
  border-color: var(--ink, #130b0d) !important;
}
.cf-send-btn:disabled {
  background: var(--bg, #faf9f5) !important;
  opacity: 0.45 !important;
}
.cf-how-label {
  opacity: 1 !important;
  color: var(--ink) !important;
  background: var(--paper);
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1.5px solid var(--ink);
}
.cf-draft-badge {
  position: absolute;
  top: 8px; right: 8px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--cf-mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
  padding: 3px 8px;
  border-radius: 6px;
  z-index: 2;
}
.cf-scrapbook-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  font-size: 18px;
  font-weight: 900;
  color: var(--ink);
  opacity: 0.5;
}
/* === END DESIGN FIX CSS === */
"""

style_close = template.find('</style>')
if style_close >= 0:
    template = template[:style_close] + CSS_FIXES + template[style_close:]
    log("Injected CSS fixes into template <style>")
else:
    head_end = template.find('>', template.find('<head')) + 1
    template = template[:head_end] + '\n<style>' + CSS_FIXES + '</style>\n' + template[head_end:]
    log("Added new <style> block with CSS fixes")

# ══════════════════════════════════════════════════════════════════════
# 4. TEMPLATE FIXES
# ══════════════════════════════════════════════════════════════════════
print("\nApplying template fixes...")

# 4a. Expand showTabBar
template = safe_replace(template,
    "const showTabBar = ['hub', 'explore', 'profile', 'trips'].includes(screen);",
    "const showTabBar = ['hub', 'explore', 'profile', 'trips', 'crew-map', 'events', 'event-detail', 'settings', 'wallet', 'night'].includes(screen);",
    "Expand showTabBar screen list")

# 4b. Settings back → hub
template = safe_replace(template,
    "<SettingsScreen onBack={() => go('profile')} />",
    "<SettingsScreen onBack={() => go('hub')} />",
    "Settings back → hub")

# 4c. Add onSettings to ProfileScreen
template = safe_replace(template,
    "<ProfileScreen\n                    onBack={() => go('hub')}\n                    onOpenWallet={() => go('wallet')}\n                  />",
    "<ProfileScreen\n                    onBack={() => go('hub')}\n                    onOpenWallet={() => go('wallet')}\n                    onSettings={() => go('settings')}\n                  />",
    "Add onSettings prop to ProfileScreen")

# 4d. Add onBack to PassScreen
template = safe_replace(template,
    "<PassScreen\n                    planState={planState}\n                    onStart={() => go('night')}\n                  />",
    "<PassScreen\n                    planState={planState}\n                    onStart={() => go('night')}\n                    onBack={() => go('plan')}\n                  />",
    "Add onBack to PassScreen")

# 4e. Add onBack to NightOfScreen
template = safe_replace(template,
    "<NightOfScreen\n                    planState={planState}\n                    onRestart={() => go('finished')}\n                    onNotify={notify}\n                  />",
    "<NightOfScreen\n                    planState={planState}\n                    onRestart={() => go('finished')}\n                    onNotify={notify}\n                    onBack={() => go('pass')}\n                  />",
    "Add onBack to NightOfScreen")

# 4f. localStorage onboarding skip
template = safe_replace(template,
    "const [screen, setScreen] = useState(t.startScreen || 'welcome');",
    "const [screen, setScreen] = useState(() => { try { if (localStorage.getItem('confetti:onboarded') === '1') return 'hub'; } catch(e) {} return t.startScreen || 'welcome'; });",
    "localStorage onboarding skip")

# 4g. Mark onboarding complete
template = safe_replace(template,
    "const go = (s) => setScreen(s);",
    "const go = (s) => { if (s === 'hub') { try { localStorage.setItem('confetti:onboarded', '1'); } catch(e) {} } setScreen(s); };",
    "Mark onboarding complete on hub")

# 4h. Browser history script
HISTORY_SCRIPT = """<script>
(function(){var cs='welcome';var ob=new MutationObserver(function(){var r=document.querySelector('[data-screen]');if(r){var s=r.getAttribute('data-screen');if(s&&s!==cs){cs=s;if(history.state&&history.state.screen===s)return;history.pushState({screen:s},'','#'+s)}}});ob.observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-screen']});window.addEventListener('popstate',function(e){if(e.state&&e.state.screen){window.dispatchEvent(new CustomEvent('confetti:nav',{detail:{screen:e.state.screen}}))}})})();
<""" + """/script>"""

body_close = template.rfind('</body>')
if body_close >= 0:
    template = template[:body_close] + HISTORY_SCRIPT + template[body_close:]
    log("Added browser history management script")

# ══════════════════════════════════════════════════════════════════════
# 5. JSX SOURCE FIXES
# ══════════════════════════════════════════════════════════════════════
print("\nApplying JSX source fixes...")

# --- extras.jsx (28b1ea77) ---
extras_uuid = find_uuid(manifest, '28b1ea77')
extras_src = decode_manifest_entry(manifest, extras_uuid)

extras_src = safe_replace(extras_src,
    "<button onClick={sendInput} disabled={!input.trim() || typing} style={{",
    "<button onClick={sendInput} disabled={!input.trim() || typing} className=\"cf-send-btn\" style={{",
    "H2: chat send button class")

extras_src = safe_replace(extras_src,
    '<ChunkyButton variant="primary" icon={Icons.arrow}\n          onClick={() => page < 2 ? setPage(page + 1) : onDone()}>',
    '<ChunkyButton variant="accent" icon={Icons.arrow}\n          onClick={() => page < 2 ? setPage(page + 1) : onDone()}>',
    "L1: explainer button → accent")

encode_manifest_entry(manifest, extras_uuid, extras_src)

# --- auth.jsx (564d732e) ---
auth_uuid = find_uuid(manifest, '564d732e')
auth_src = decode_manifest_entry(manifest, auth_uuid)

auth_src = safe_replace(auth_src,
    "step 04 \xb7 permissions",
    "step 05 \xb7 permissions",
    "Fix step 5 label")

encode_manifest_entry(manifest, auth_uuid, auth_src)

# --- profile.jsx (3b9a92e3) ---
profile_uuid = find_uuid(manifest, '3b9a92e3')
profile_src = decode_manifest_entry(manifest, profile_uuid)

profile_src = safe_replace(profile_src,
    "ProfileScreen({ onBack, onOpenWallet })",
    "ProfileScreen({ onBack, onOpenWallet, onSettings })",
    "Add onSettings prop")

profile_src = safe_replace(profile_src,
    """<button style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)',
          background: 'var(--paper)', color: 'var(--ink)',
          fontSize: 16, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>⚙</button>""",
    """<button onClick={onSettings} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)',
          background: 'var(--paper)', color: 'var(--ink)',
          fontSize: 16, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>⚙</button>""",
    "Wire gear → onSettings")

profile_src = safe_replace(profile_src,
    """              {p.active && (
                <span style={{ color: 'var(--paper)',
                              background: 'var(--ink)',
                              padding: '0 6px', borderRadius: 4 }}>
                  IN WALLET ↗
                </span>
              )}
            </div>
          </div>
        </div>""",
    """              {p.active && (
                <span style={{ color: 'var(--paper)',
                              background: 'var(--ink)',
                              padding: '0 6px', borderRadius: 4 }}>
                  IN WALLET ↗
                </span>
              )}
            </div>
          </div>
          <div className="cf-scrapbook-chevron">›</div>
        </div>""",
    "M6: scrapbook chevron")

encode_manifest_entry(manifest, profile_uuid, profile_src)

# --- screens.jsx (2af8264b) ---
screens_uuid = find_uuid(manifest, '2af8264b')
screens_src = decode_manifest_entry(manifest, screens_uuid)

screens_src = safe_replace(screens_src,
    "PassScreen({ onStart, planState })",
    "PassScreen({ onStart, planState, onBack })",
    "PassScreen onBack prop")

# Insert back button after first DotsBg in PassScreen
pass_fn_idx = screens_src.find("PassScreen({ onStart, planState, onBack })")
if pass_fn_idx >= 0:
    dots_idx = screens_src.find("DotsBg", pass_fn_idx)
    if dots_idx >= 0:
        line_end = screens_src.find('\n', dots_idx)
        back_btn = "\n      {onBack && <button onClick={onBack} style={{position:'absolute',top:52,left:18,zIndex:10,appearance:'none',cursor:'pointer',width:36,height:36,borderRadius:999,border:'2.5px solid var(--ink)',background:'var(--paper)',color:'var(--ink)',fontSize:14,fontWeight:900,boxShadow:'3px 3px 0 var(--ink)'}}>←</button>}"
        screens_src = screens_src[:line_end] + back_btn + screens_src[line_end:]
        log("PassScreen back button")

screens_src = safe_replace(screens_src,
    "NightOfScreen({ onRestart, planState, onNotify })",
    "NightOfScreen({ onRestart, planState, onNotify, onBack })",
    "NightOfScreen onBack prop")

night_fn_idx = screens_src.find("NightOfScreen({ onRestart, planState, onNotify, onBack })")
if night_fn_idx >= 0:
    dots_idx = screens_src.find("DotsBg", night_fn_idx)
    if dots_idx < 0:
        dots_idx = screens_src.find("cf-screen", night_fn_idx)
    if dots_idx >= 0:
        line_end = screens_src.find('\n', dots_idx)
        back_btn = "\n      {onBack && <button onClick={onBack} style={{position:'absolute',top:52,left:18,zIndex:10,appearance:'none',cursor:'pointer',width:36,height:36,borderRadius:999,border:'2.5px solid var(--ink)',background:'var(--paper)',color:'var(--ink)',fontSize:14,fontWeight:900,boxShadow:'3px 3px 0 var(--ink)'}}>←</button>}"
        screens_src = screens_src[:line_end] + back_btn + screens_src[line_end:]
        log("NightOfScreen back button")

encode_manifest_entry(manifest, screens_uuid, screens_src)

# --- promoters/influencer (25200d68) ---
promo_uuid = find_uuid(manifest, '25200d68')
promo_src = decode_manifest_entry(manifest, promo_uuid)

promo_src = safe_replace(promo_src,
    ">HOW IT WORKS</div>",
    ' className="cf-how-label">HOW IT WORKS</div>',
    "M4: HOW IT WORKS contrast")

promo_src = safe_replace(promo_src,
    """{t.status === 'draft' && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 14,
                backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 8px, transparent 8px 16px)`,
                pointerEvents: 'none',
              }} />
            )}""",
    """{t.status === 'draft' && (
              <div className="cf-draft-badge">DRAFT</div>
            )}""",
    "L3: draft stripes → badge")

encode_manifest_entry(manifest, promo_uuid, promo_src)

# ══════════════════════════════════════════════════════════════════════
# 6. RECONSTRUCT FILE
# ══════════════════════════════════════════════════════════════════════
print("\nReconstructing file...")

new_manifest_json = json.dumps(manifest, separators=(',', ':'))
new_template_json = safe_json_for_html(json.dumps(template))

# Rebuild: prefix + manifest + between + template + suffix
new_content = prefix + '\n' + new_manifest_json + '\n' + between_m_t[len('</script>'):] 
# Wait, between_m_t starts with </script> of manifest. We need:
# prefix (up to manifest open tag end) + manifest data + rest of file with template replaced

# Simpler approach: just replace the two regions
new_content = (
    content[:m_tag_end] +          # everything up to manifest data start
    '\n' + new_manifest_json + '\n' +  # manifest data
    content[m_close:t_tag_end] +   # </script> ... template open tag
    '\n' + new_template_json + '\n' +  # template data
    content[t_close:]              # </script> and rest
)

# ══════════════════════════════════════════════════════════════════════
# 7. WRITE
# ══════════════════════════════════════════════════════════════════════
print("Writing patched file...")
with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(new_content)
new_size = len(new_content)
print(f"  {HTML_PATH}")
print(f"  Size: {original_size:,} → {new_size:,} (delta: {new_size - original_size:+,})")

if os.path.exists(ROOT_COPY):
    with open(ROOT_COPY, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"  Copied to: {ROOT_COPY}")

# ══════════════════════════════════════════════════════════════════════
# 8. VERIFY
# ══════════════════════════════════════════════════════════════════════
print("\nVerifying...")
with open(HTML_PATH, 'r', encoding='utf-8') as f:
    check = f.read()

# Manifest
cm_start = check.find(M_OPEN)
cm_end = cm_start + len(M_OPEN)
cm_close = check.find('</script>', cm_start)
try:
    cm = json.loads(check[cm_end:cm_close].strip())
    print(f"  Manifest JSON: OK ({len(cm)} entries)")
except Exception as e:
    print(f"  Manifest JSON: FAILED — {e}")
    sys.exit(1)

# Template
ct_start = check.find(T_OPEN)
ct_end = ct_start + len(T_OPEN)
ct_close = check.find('</script>', ct_start)
try:
    ct = json.loads(check[ct_end:ct_close].strip())
    print(f"  Template JSON: OK ({len(ct):,} chars)")
except Exception as e:
    print(f"  Template JSON: FAILED — {e}")
    sys.exit(1)

# Decode modified entries
for pfx in ['28b1ea77', '564d732e', '3b9a92e3', '2af8264b', '25200d68']:
    uuid = find_uuid(cm, pfx)
    try:
        s = decode_manifest_entry(cm, uuid)
        print(f"  {pfx}... OK ({len(s):,} chars)")
    except Exception as e:
        print(f"  {pfx}... FAILED — {e}")
        sys.exit(1)

# Verify key fixes are present
assert 'crew-map' in ct[ct.find('showTabBar'):ct.find('showTabBar')+200], "showTabBar fix missing"
assert "go('hub')" in ct[ct.find('SettingsScreen'):ct.find('SettingsScreen')+200], "Settings back fix missing"
assert "onSettings" in ct[ct.find('ProfileScreen'):ct.find('ProfileScreen')+200], "onSettings fix missing"
print("  Content assertions: OK")

# ══════════════════════════════════════════════════════════════════════
# 9. SUMMARY
# ══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print(f"SUMMARY: {len(changes_log)} fixes applied successfully")
print(f"{'='*60}")
for i, msg in enumerate(changes_log, 1):
    print(f"  {i:2d}. {msg}")
print()
