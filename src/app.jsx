// Hearth — main app: routing, tab bar, mounting

import React, { useState, useEffect } from 'react';
import { HearthMarkSmall, HearthTopbar, Icon } from './atoms.jsx';
import {
  useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect,
  TweakToggle, TweakNumber, TweakButton,
} from './tweaks-panel.jsx';
import { HEARTH_DATA } from './data.js';
import { HomeScreen, JournalScreen, JournalWriteScreen } from './screens-1.jsx';
import {
  DiscoverScreen, AttuneScreen, RitualsScreen,
  RitualDetailScreen, RitualBuilderScreen,
} from './screens-2.jsx';
import {
  OnboardingScreen, AuthScreen, SettingsScreen,
  NotificationsScreen, ProfileScreen,
} from './screens-3.jsx';
import {
  JournalArchiveScreen, EntryDetailScreen, ArticleScreen,
  BookmarksScreen, WeeklyDigestScreen, StreakBrokenScreen,
  AttuneHistoryScreen, MiniPlayer, OfflineBanner, Toast,
} from './screens-4.jsx';
import { api, getToken, clearToken } from './api.js';

const TABS = [
  { key: 'home',     label: 'Hearth',   icon: (a) => <HearthMarkSmall size={18}/>, route: 'home' },
  { key: 'journal',  label: 'Journal',  icon: (a) => Icon.pen(18, a ? 'var(--sig)' : 'currentColor'),     route: 'journal' },
  { key: 'attune',   label: 'Attune',   icon: (a) => Icon.leaf(18, a ? 'var(--sig)' : 'currentColor'),    route: 'attune' },
  { key: 'rituals',  label: 'Rituals',  icon: (a) => Icon.wave(18, a ? 'var(--sig)' : 'currentColor'),    route: 'rituals' },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "partOfDay": "morning",
  "streak": 23,
  "showGrain": true,
  "startingScreen": "home",
  "miniPlayer": false,
  "offline": false,
  "flower": "wisteria",
  "transition": "lift"
}/*EDITMODE-END*/;

// Flower → tone mapping (mirrors FLOWERS in screens-3.jsx)
const FLOWER_TONE = {
  wisteria: 'wisteria',
  rose: 'rose',
  poppy: 'ember',
  cornflower: 'bloom',
  fern: 'fern',
  mimosa: 'citron',
  sage: 'dew',
};

function applyFlower(flowerKey) {
  const tone = FLOWER_TONE[flowerKey] || 'wisteria';
  const root = document.documentElement;
  ['', '-soft', '-deep', '-bright', '-tint', '-line'].forEach(suf => {
    const v = getComputedStyle(root).getPropertyValue(`--${tone}${suf}`).trim();
    if (v) root.style.setProperty(`--sig${suf}`, v);
  });
  const onv = getComputedStyle(root).getPropertyValue(`--on-${tone}`).trim();
  if (onv) root.style.setProperty('--on-sig', onv);
}

const FULLBLEED_ROUTES = new Set(['onboarding', 'auth', 'streak-broken']);

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
    go('onboarding', { step: 0 });
  }

  // Restore session on mount
  useEffect(() => {
    (async () => {
      await refreshUser();
      setAuthChecked(true);
    })();
  }, []);

  // Repaint --sig* whenever flower changes
  useEffect(() => { applyFlower(values.flower); }, [values.flower]);

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

  // tab inference (Discover removed — Home is the editorial spread)
  const tab = ['home','journal','attune','rituals','settings'].includes(route)
    ? route
    : (route.startsWith('journal') || route === 'entry-detail' ? 'journal'
      : route.startsWith('ritual') || route === 'weekly-digest' ? 'rituals'
      : route === 'article' || route === 'discover' || route === 'bookmarks' ? 'home'
      : route === 'attune-history' ? 'attune'
      : route === 'settings-notifications' || route === 'settings-profile' ? 'settings'
      : 'home');

  const isFullBleed = FULLBLEED_ROUTES.has(route);
  const D = HEARTH_DATA;
  const playerSong = values.miniPlayer ? D.attuneArchetypes[0].song : null;

  const screenContent = (
    <>
      {/* Onboarding & auth */}
      {route === 'onboarding' && <OnboardingScreen go={go} payload={payload} onAuthed={refreshUser}/>}
      {route === 'auth' && <AuthScreen go={go} onAuthed={refreshUser}/>}

      {/* Main */}
      {route === 'home' && <HomeScreen go={go} user={user}/>}
      {route === 'journal' && <JournalScreen go={go}/>}
      {route === 'journal-write' && <JournalWriteScreen go={go} payload={payload}/>}
      {route === 'journal-archive' && <JournalArchiveScreen go={go}/>}
      {route === 'entry-detail' && <EntryDetailScreen go={go} payload={payload}/>}
      {route === 'discover' && <DiscoverScreen go={go}/>}
      {route === 'article' && <ArticleScreen go={go} payload={payload}/>}
      {route === 'bookmarks' && <BookmarksScreen go={go}/>}
      {route === 'attune' && <AttuneScreen go={go}/>}
      {route === 'attune-history' && <AttuneHistoryScreen go={go}/>}
      {route === 'rituals' && <RitualsScreen go={go}/>}
      {route === 'ritual-detail' && <RitualDetailScreen go={go} payload={payload}/>}
      {route === 'ritual-builder' && <RitualBuilderScreen go={go}/>}
      {route === 'weekly-digest' && <WeeklyDigestScreen go={go}/>}
      {route === 'streak-broken' && <StreakBrokenScreen go={go}/>}

      {/* Settings */}
      {route === 'settings' && <SettingsScreen go={go} onSignOut={user ? signOut : null}/>}
      {route === 'settings-notifications' && <NotificationsScreen go={go}/>}
      {route === 'settings-profile' && <ProfileScreen go={go}/>}
    </>
  );

  return (
    <>
      <div className="hearth-app">
        {!isFullBleed && (
          <aside className="hearth-sidebar">
            <div className="hearth-brand">
              hearth
              <small>Tend the fire</small>
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
              <button onClick={() => go('journal-archive')}>
                {Icon.bookmark(16, 'currentColor')}
                <span>Bookmarks</span>
              </button>
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
              <span className="hearth-mobile-topbar-title">Hearth</span>
              <button onClick={() => go('journal-archive')} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--paper-2)' }}>
                {Icon.bookmark(18, 'var(--paper-2)')}
              </button>
            </header>
          )}

          {values.offline && !isFullBleed && <OfflineBanner/>}

          <div id="hearth-scroll" className={`hearth-scroll trans-${values.transition || 'lift'}`} key={route}>
            <div className={isFullBleed ? 'hearth-fullbleed' : 'hearth-content'}>
              {screenContent}
            </div>
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
        <TweakSelect label="Signature sprig" value={values.flower}
          options={[
            {value:'wisteria',label:'Oak · endurance, deep roots'},
            {value:'poppy',label:'Birch · beginnings, light'},
            {value:'cornflower',label:'Pine · steadiness through cold'},
          ]}
          onChange={v => setTweak('flower', v)}/>
        <TweakToggle label="Paper grain" value={values.showGrain} onChange={v => setTweak('showGrain', v)}/>
        <TweakSelect label="Page transition" value={values.transition || 'lift'}
          options={[
            {value:'lift',label:'Lift — fade up (default)'},
            {value:'slide',label:'Slide — push from right'},
            {value:'reveal',label:'Reveal — paper unfold'},
            {value:'cross',label:'Cross — pure fade'},
            {value:'none',label:'None — instant'},
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
            {value:'home',label:'Home'},
            {value:'journal',label:'Journal'},
            {value:'journal-archive',label:'Journal · Archive'},
            {value:'entry-detail',label:'Entry detail'},
            {value:'discover',label:'Discover (legacy)'},
            {value:'article',label:'Article'},
            {value:'bookmarks',label:'Bookmarks'},
            {value:'attune',label:'Attune'},
            {value:'attune-history',label:'Attune · history'},
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
