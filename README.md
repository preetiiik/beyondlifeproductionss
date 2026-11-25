# Beyond Life Productions: Home page

A static, responsive home page built from the Figma frame **Photography › Page 4 › Flow1**.
Plain HTML, CSS and JavaScript. There's no build step and nothing to install.

## Open it

Double-click `index.html`, or serve the folder:

```bash
npx serve .
```

## Deploy

Upload the whole folder to any static host: Netlify (drag and drop), Vercel, GitHub Pages, cPanel / Hostinger `public_html`, and so on.

## Folder structure

```
index.html            page markup
assets/css/style.css  all styles (colours and fonts are variables at the top)
assets/js/main.js     smooth scroll, pinned sections, scroll animations, testimonials, lightbox
assets/vendor/        Lenis smooth-scroll library (MIT licence, bundled locally)
assets/img/           photos exported from Figma (web-optimised JPEG) + logo.png
assets/video/         optimized hero video
assets/fonts/         supplied Le Jour Serif font
```

## Before going live

1. **Hero video.** The Figma hero is a video. Export it as `assets/video/hero.mp4`
   (H.264, about 1920×1080, muted, under 8 MB). Until then the page shows `hero-poster.jpg`.
2. **Font licence.** The supplied Le Jour Serif font is labelled personal use only. Check its licence before commercial use.
3. **Contact details.** The phone number in the footer is a placeholder (`+91 00000 00000`).
   Update it in `index.html`, along with the YouTube and Facebook links (`href="#"`).
4. **Testimonials.** The quotes are in `assets/js/main.js` (`notes` array) and the first one is also in `index.html`.
5. **Enquiry/Contact page.** "Contact Us" scrolls to the footer. Point it at your contact page once that page is built.

## Editing tips

- **Colours.** Change the variables at the top of `style.css` (`--gold`, `--ink`, `--cream`…).
- **Films slider.** Each `<article class="reel__slide">` in `index.html` is one film. Copy one to add more,
  and link the card's `href` to the YouTube/Vimeo film.
- **Gallery.** 20 square tiles; swap the files `gallery-01.jpg` to `gallery-20.jpg`, keeping them square (720×720 or larger).

## Motion & scrolling

- **Smooth, slow scrolling** uses Lenis. To make it faster or slower, change `lerp` in `main.js`
  (section 1): lower is slower and silkier (`0.065` now), higher is snappier (`0.1`).
- **"Every frame tells a story"** pins to the screen and scrolls the films sideways as you scroll down,
  then releases to the next section. Adding or removing film slides adjusts the scroll length automatically.
- **The Route** pins while a gold line draws across the five stations and each one lights up in turn.
  On phones (and short laptop screens) it isn't pinned; the line draws down the page as you scroll instead.
- **Gallery** photos sit dimmed and brighten on hover. On phones the row in the middle of the screen brightens.
  The dim level is `brightness(.38)` in `style.css` (search for "GALLERY — dark until hover").
- **Instagram strip** scrolls sideways on its own and pauses on hover. Change `70s` in the `.marquee__track` rule to adjust speed.
- Visitors who have "reduce motion" switched on in their device settings get a calm version with no animations.
"# beyondlifeproductionss" 
