# DevAcademy – HTML5 + CSS3 Practice Project

A clean, single-page website built with **pure HTML5 and CSS3** — no frameworks, no libraries, no JavaScript. The goal is to demonstrate core HTML5 semantic elements alongside CSS3 fundamentals including the Box Model, Grid, Flexbox, Media Queries, and Animations.

---

## File Structure

```
html tags practice/
├── index.html    ← Full HTML5 semantic page (structure & content)
├── style.css     ← Complete CSS3 stylesheet (layout, style, animations)
└── README.md     ← Project documentation (this file)
```

---

## HTML5 — Elements Covered

| Element | Usage in Project |
|---|---|
| `<header>` | Site branding (`<h1>`) and primary navigation (`<nav>`) |
| `<nav>` | Anchor links — Home, Articles, Join Us, Contact |
| `<main>` | Wraps all primary page content |
| `<section>` | Two sections: Featured Articles and Student Registration |
| `<article>` | Self-contained blog post with heading, image, and lists |
| `<aside>` | Sidebar with mission statement and quick links |
| `<footer>` | Copyright notice and policy navigation links |
| `<form>` | Registration form with `text`, `email`, `password` inputs + `<textarea>` |
| `<div>` / `<span>` | Layout grouping and inline keyword highlight |
| `<time>` | Semantic publish date on the article |
| `<code>` | Inline code snippets inside article body |
| `<strong>` | Important/bold inline text |
| `<ul>` / `<ol>` | Unordered benefits list and ordered learning-path list |
| `<label>` | Accessible form labels tied to inputs via `for`/`id` |
| `<button>` | Form submit button (`type="submit"`) |

---
ScreenShots
<img width="940" height="431" alt="image" src="https://github.com/user-attachments/assets/e217cd69-f3ab-4dcb-8422-6fcd99cf47ba" />
<img width="941" height="438" alt="image" src="https://github.com/user-attachments/assets/4355fe9a-40a1-40fb-b5c1-5fc38a1e9cd5" />
<img width="941" height="440" alt="image" src="https://github.com/user-attachments/assets/d87fcf1c-9e0c-4b7d-b9b0-2164d77ae2f2" />

---
## CSS3 — Concepts Covered

### 1. CSS Basics & Box Model
- CSS custom properties (variables) defined in `:root` for colors and reusable values
- `box-sizing: border-box` universal reset so padding never breaks layouts
- `font-family`, `font-size`, `line-height` for clean typography
- `padding`, `margin`, `border`, `border-radius` applied to sections, inputs, cards, and buttons
- `box-shadow` for depth on cards and surfaces

### 2. CSS Grid (Multi-Column Layout)
- `.page-wrapper` uses `grid-template-columns: 3fr 1fr` — main content (3 parts) + sidebar (1 part)
- `.cards-grid` uses `grid-template-columns: repeat(3, 1fr)` — three equal columns with `gap`
- Ready-to-use grid for Services / Testimonials sections if added later

### 3. CSS Flexbox (Navigation & Form Alignment)
- `header` — `display: flex; justify-content: space-between` to push logo and nav apart
- `nav ul` — `display: flex; gap: 1.5rem` for horizontal navigation row
- `form` — `display: flex; flex-direction: column` to stack fields vertically
- `.form-group` — `display: flex; flex-direction: column` for label-above-input layout
- `button[type="submit"]` — `align-self: flex-end` to push button to the right
- `footer` — `display: flex; justify-content: space-between` for copyright + policy links

### 4. Media Queries (Responsive Design)
- Breakpoint: `@media (max-width: 768px)`
  - Grid collapses from 2 columns → **1 column** on mobile
  - Cards grid collapses from 3 columns → **1 column** on mobile
  - Header stacks vertically (`flex-direction: column`)
  - Padding and margins reduced for small screens
  - Submit button stretches to full width on mobile

### 5. CSS Animations & Transitions
| Effect | Trigger | Property Used |
|---|---|---|
| Header title slides down on load | Page load | `@keyframes fadeSlideIn` + `animation` |
| Input border turns blue + glow | `:focus` | `transition: border-color, box-shadow 0.3s ease` |
| Submit button turns gold + scales up | `:hover` | `transition: background-color, transform 0.3s ease` |
| Submit button presses down | `:active` | `transform: scale(0.97)` |
| `.highlight` span pulses softly | Continuous | `@keyframes pulse` + `animation` |
| Card lifts on hover | `:hover` | `transform: translateY(-4px)` + `transition` |

---

## How to Run

No build step needed. Open directly in any browser:

```
double-click index.html
```

Or right-click → *Open with* → your preferred browser.

> **Note:** Both `index.html` and `style.css` must be in the **same folder** for styles to load correctly.

---

## HTML Tags Quick Reference

`header` `nav` `main` `section` `article` `aside` `footer`
`h1` `h2` `h3` `p` `ul` `ol` `li`
`a` `img` `form` `label` `input` `textarea` `button`
`div` `span` `time` `code` `strong`

## CSS Properties Quick Reference

`display: grid` `display: flex` `grid-template-columns` `gap`
`justify-content` `align-items` `flex-direction` `align-self`
`padding` `margin` `border` `border-radius` `box-shadow`
`transition` `transform` `animation` `@keyframes`
`@media` `box-sizing` `font-family` `line-height`
