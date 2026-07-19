import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// Lock the public landing page to the light "archival" theme. The legacy
// marketing CSS is light-only; the tokens seam (data-theme="light" disables the
// prefers-color-scheme dark block) keeps new components consistent. Full
// dark-mode retheme of the legacy page is a follow-up.
document.documentElement.setAttribute('data-theme', 'light')

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
