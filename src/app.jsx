// Hearth — main app: routing, tab bar, mounting

import React, { useState, useEffect } from 'react';
import { HearthMarkSmall, HearthTopbar, Icon } from './atoms.jsx';
import {
  useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect,
  TweakToggle, TweakNumber, TweakButton,
} from './tweaks-panel.jsx';
import { HEARTH_DATA } from './data.js';
import { HomeScreen, ReadingRoomScreen, GiveScreen, ReceiveScreen, YoursScreen, MeaningScreen, MeaningLogScreen, JournalScreen, JournalWriteScreen } from './screens-1.jsx';
import {
  DiscoverScreen, AttuneScreen, RitualsScreen,
  RitualDetailScreen, RitualBuilderScreen,
} from './screens-2.jsx';
import {
  OnboardingScreen, AuthScreen, LandingScreen, SettingsScreen,
  NotificationsScreen, ProfileScreen,
} from './screens-3.jsx';
import { KindleScreen } from './screens-5.jsx';
import {
  JournalArchiveScreen, EntryDetailScreen, ArticleScreen,
  BookmarksScreen, WeeklyDigestScreen, StreakBrokenScreen,
  AttuneHistoryScreen, MiniPlayer, OfflineBanner, Toast,
} from './screens-4.jsx';
import { api, getToken, clearToken } from './api.js';

// Active tab uses ink (Midnight Green); inactive uses currentColor so the
// CSS .hearth-tab.active rule still wins the color cascade.
// The three avenues to meaning are the heart of the nav (docs/MEANING.md):
// give outward, receive inward, carry steady. Today is the daily hub;
// Yours is the inner record (Journal + Nook + Meaning Mirror).
const TABS = [
  { key: 'today',   label: 'Today',   icon: (a) => <HearthMarkSmall size={18}/>,        route: 'home' },
  { key: 'give',    label: 'Give',    icon: (a) => Icon.giveHand(18, 'currentColor'),   route: 'give' },
  { key: 'receive', label: 'Receive', icon: (a) => Icon.flower(18, 'currentColor'),     route: 'receive' },
  { key: 'carry',   label: 'Carry',   icon: (a) => Icon.heart(18, 'currentColor'),      route: 'kindle' },
  { key: 'yours',   label: 'Yours',   icon: (a) => Icon.bookmark(18, 'currentColor'),   route: 'yours' },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "partOfDay": "morning",
  "streak": 23,
  "showGrain": true,
  "startingScreen": "home",
  "miniPlayer": false,
  "offline": false,
  "transition": "lift"
}/*EDITMODE-END*/;

const FULLBLEED_ROUTES = new Set(['landing', 'onboarding', 'auth', 'streak-broken']);

function App() {
  const [values, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [route, setRoute] = useState(values.startingScreen || 'home');
  const [payload, setPayload] = useState(null);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  async function refreshUser() {
    if (!getToken()) {
      setUser(null);
      return null;
    }
    try {
      const { user } = await api.auth.me();
      setUser(user);
      return user;
    } catch {
      clearToken();
      setUser(null);
      return null;
    }
  }

  function signOut() {
    clearToken();
    setUser(null);
    go('landing');
  }

  // Restore session on mount. If no token, send the visitor to the
  // landing page rather than dumping them on the (empty) home feed.
  useEffect(() => {
    (async () => {
      const token = getToken();
      const restored = await refreshUser();
      if (!token || !restored) {
        // Only redirect to landing if the route looks like a default
        // home destination. Respect direct nav to onboarding/auth.
        if (route === 'home' || route === values.startingScreen) {
          setRoute('landing');
        }
      }
      setAuthChecked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function go(r, p = null) {
    setRoute(r);
    setPayload(p);
    const el = document.getElementById('hearth-scroll');
    if (el) el.scrollTo({ top: 0, behavior: 'instant' });
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  // tab inference, mapped to the avenue nav. Each surface highlights the
  // avenue it lives under: Attune + reading room → Receive; Kindle →
  // Carry; Rituals → Give; Journal + Nook + digest → Yours. Settings has
  // no tab (reached via the menu), so it highlights nothing.
  const tab =
      route === 'home' ? 'today'
    : route === 'kindle' ? 'carry'
    : (route === 'give' || route === 'rituals' || route.startsWith('ritual')) ? 'give'
    : (route === 'receive' || route === 'attune' || route === 'attune-history' || route === 'reading' || route === 'article' || route === 'discover') ? 'receive'
    : (route === 'yours' || route === 'meaning' || route === 'meaning-log' || route.startsWith('journal') || route === 'entry-detail' || route === 'bookmarks' || route === 'weekly-digest') ? 'yours'
    : route.startsWith('settings') ? 'settings'
    : 'today';

  const isFullBleed = FULLBLEED_ROUTES.has(route);
  const D = HEARTH_DATA;
  const playerSong = values.miniPlayer ? D.attuneArchetypes[0].song : null;

  const screenContent = (
    <>
      {/* Landing, onboarding, auth */}
      {route === 'landing' && <LandingScreen go={go}/>}
      {route === 'onboarding' && <OnboardingScreen go={go} payload={payload} onAuthed={refreshUser}/>}
      {route === 'auth' && <AuthScreen go={go} onAuthed={refreshUser}/>}

      {/* Main */}
      {route === 'home' && <HomeScreen go={go} user={user}/>}
      {route === 'reading' && <ReadingRoomScreen go={go}/>}
      {route === 'give' && <GiveScreen go={go} user={user}/>}
      {route === 'receive' && <ReceiveScreen go={go}/>}
      {route === 'yours' && <YoursScreen go={go}/>}
      {route === 'meaning' && <MeaningScreen go={go}/>}
      {route === 'meaning-log' && <MeaningLogScreen go={go}/>}
      {route === 'journal' && <JournalScreen go={go} user={user}/>}
      {route === 'journal-write' && <JournalWriteScreen go={go} payload={payload}/>}
      {route === 'journal-archive' && <JournalArchiveScreen go={go}/>}
      {route === 'entry-detail' && <EntryDetailScreen go={go} payload={payload}/>}
      {route === 'discover' && <DiscoverScreen go={go}/>}
      {route === 'article' && <ArticleScreen go={go} payload={payload}/>}
      {route === 'bookmarks' && <BookmarksScreen go={go}/>}
      {route === 'attune' && <AttuneScreen go={go}/>}
      {route === 'attune-history' && <AttuneHistoryScreen go={go}/>}
      {route === 'kindle' && <KindleScreen go={go}/>}
      {route === 'rituals' && <RitualsScreen go={go}/>}
      {route === 'ritual-detail' && <RitualDetailScreen go={go} payload={payload}/>}
      {route === 'ritual-builder' && <RitualBuilderScreen go={go}/>}
      {route === 'weekly-digest' && <WeeklyDigestScreen go={go}/>}
      {route === 'streak-broken' && <StreakBrokenScreen go={go}/>}

      {/* Settings */}
      {route === 'settings' && <SettingsScreen go={go} user={user} refreshUser={refreshUser} onSignOut={user ? signOut : null}/>}
      {route === 'settings-notifications' && <NotificationsScreen go={go}/>}
      {route === 'settings-profile' && <ProfileScreen go={go} user={user} refreshUser={refreshUser}/>}
    </>
  );

  return (
    <>
      <div className="hearth-app">
        {!isFullBleed && (
          <aside className="hearth-sidebar">
            <div className="hearth-brand">
              <img src="/brand/lockup-h-paper.svg" alt="Hearth" style={{ display: 'block', height: 30, width: 'auto' }}/>
              <small>Tend your why</small>
            </div>
            <nav className="hearth-sidebar-nav">
              {TABS.map(t => (
                <button key={t.key} className={`hearth-sidebar-link ${tab === t.key ? 'active' : ''}`}
                  onClick={() => go(t.route)}>
                  {t.icon(tab === t.key)}
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>
            <div className="hearth-sidebar-foot">
              <button onClick={() => go('settings')}>
                {Icon.more(16, 'currentColor')}
                <span>Settings</span>
              </button>
              {user ? (
                <div className="hearth-sidebar-account">
                  <div className="hearth-sidebar-account-name">{user.name || 'Friend'}</div>
                  <div className="hearth-sidebar-account-email">{user.email}</div>
                  <button onClick={signOut} style={{ marginTop: 8, padding: '4px 0', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--paper-mute)' }}>
                    Sign out
                  </button>
                </div>
              ) : (
                <button onClick={() => go('auth')} style={{ color: 'var(--hh-green)' }}>
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </aside>
        )}

        <main className="hearth-main">
          {!isFullBleed && (
            <header className="hearth-mobile-topbar">
              <button onClick={() => go('settings')} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--paper-2)' }}>
                {Icon.more(20, 'var(--paper-2)')}
              </button>
              <img src="/brand/wordmark-paper.svg" alt="Hearth" style={{ display: 'block', height: 19, width: 'auto' }}/>
              <button onClick={() => go('journal-archive')} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--paper-2)' }}>
                {Icon.bookmark(18, 'var(--paper-2)')}
              </button>
            </header>
          )}

          {values.offline && !isFullBleed && <OfflineBanner/>}

          <div id="hearth-scroll" className={`hearth-scroll trans-${values.transition || 'lift'}`} key={route}>
            {route === 'landing' ? (
              screenContent
            ) : (
              <div className={isFullBleed ? 'hearth-fullbleed' : 'hearth-content'}>
                {screenContent}
              </div>
            )}
          </div>

          {!isFullBleed && playerSong && <MiniPlayer song={playerSong} onClose={() => setTweak('miniPlayer', false)} onOpen={() => go('attune-history')}/>}
          {toast && <Toast message={toast}/>}

          {!isFullBleed && (
            <div className="hearth-tabbar">
              {TABS.map(t => (
                <button key={t.key} className={`hearth-tab ${tab === t.key ? 'active' : ''}`}
                  onClick={() => go(t.route)}>
                  {t.icon(tab === t.key)}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {import.meta.env.DEV && <TweaksPanel title="Tweaks">
        <TweakSection label="Time of day"/>
        <TweakRadio label="Greeting" value={values.partOfDay}
          options={[{value:'morning',label:'Morning'},{value:'afternoon',label:'Afternoon'},{value:'evening',label:'Evening'}]}
          onChange={v => setTweak('partOfDay', v)}/>
        <TweakSection label="Atmosphere"/>
        <TweakToggle label="Paper grain" value={values.showGrain} onChange={v => setTweak('showGrain', v)}/>
        <TweakSelect label="Page transition" value={values.transition || 'lift'}
          options={[
            {value:'lift',label:'Lift, fade up (default)'},
            {value:'slide',label:'Slide, push from right'},
            {value:'reveal',label:'Reveal, paper unfold'},
            {value:'cross',label:'Cross, pure fade'},
            {value:'none',label:'None, instant'},
          ]}
          onChange={v => setTweak('transition', v)}/>
        <TweakToggle label="Show mini-player" value={values.miniPlayer} onChange={v => setTweak('miniPlayer', v)}/>
        <TweakToggle label="Offline banner" value={values.offline} onChange={v => setTweak('offline', v)}/>
        <TweakSection label="State"/>
        <TweakNumber label="Streak (days)" value={values.streak} min={0} max={999}
          onChange={v => setTweak('streak', v)}/>
        <TweakSelect label="Open to" value={values.startingScreen}
          options={[
            {value:'onboarding',label:'Onboarding'},
            {value:'auth',label:'Sign in'},
            {value:'home',label:'Today (home)'},
            {value:'receive',label:'Receive (hub)'},
            {value:'yours',label:'Yours (hub)'},
            {value:'reading',label:'Reading room (Receive)'},
            {value:'journal',label:'Journal'},
            {value:'journal-archive',label:'Journal · Archive'},
            {value:'entry-detail',label:'Entry detail'},
            {value:'discover',label:'Discover (legacy)'},
            {value:'article',label:'Article'},
            {value:'bookmarks',label:'Bookmarks'},
            {value:'attune',label:'Attune'},
            {value:'attune-history',label:'Attune · history'},
            {value:'kindle',label:'Kindle'},
            {value:'rituals',label:'Rituals'},
            {value:'ritual-builder',label:'Rituals · Build'},
            {value:'weekly-digest',label:'Weekly digest'},
            {value:'streak-broken',label:'Streak broken'},
            {value:'settings',label:'Settings'},
            {value:'settings-notifications',label:'Notifications'},
            {value:'settings-profile',label:'Profile'},
          ]}
          onChange={v => { setTweak('startingScreen', v); go(v); }}/>
        <TweakButton label="Reset to home" onClick={() => go('home')}/>
        <TweakButton label="Restart onboarding" onClick={() => go('onboarding', { step: 0 })}/>
      </TweaksPanel>}
    </>
  );
}

export default App;
