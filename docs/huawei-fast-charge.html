<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Huawei Fast Charge Water Drop</title>
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <style>
    :root {
      color-scheme: dark;
      --phone-width: min(100vw, 470px);
      --orb-size: clamp(285px, 72vw, 390px);
      --aqua: #9df8ff;
      --aqua-strong: #49ecff;
      --blue-rim: #6aa9ff;
      --ink: #020506;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      min-height: 100%;
      margin: 0;
      background: #050605;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
    }

    body {
      display: grid;
      place-items: center;
    }

    .phone {
      position: relative;
      width: var(--phone-width);
      min-height: 100dvh;
      overflow: hidden;
      isolation: isolate;
      background:
        radial-gradient(circle at 70% 24%, rgba(238, 226, 208, 0.42) 0 6%, transparent 24%),
        radial-gradient(circle at 67% 32%, rgba(134, 96, 72, 0.26) 0 7%, transparent 18%),
        linear-gradient(110deg, rgba(244, 238, 218, 0.58), rgba(170, 184, 176, 0.38) 42%, rgba(242, 236, 214, 0.54)),
        #cfcdb7;
    }

    .phone::before {
      position: absolute;
      inset: 0;
      z-index: 4;
      content: "";
      background:
        radial-gradient(circle at 52% 50%, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7) 55%, rgba(0, 0, 0, 0.9) 100%),
        rgba(0, 0, 0, 0.58);
      pointer-events: none;
    }

    .phone::after {
      position: absolute;
      inset: 0;
      z-index: 9;
      content: "";
      background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.035), transparent 18% 82%, rgba(255, 255, 255, 0.025)),
        radial-gradient(circle at 50% 100%, rgba(178, 255, 228, 0.13), transparent 24%);
      pointer-events: none;
      mix-blend-mode: screen;
    }

    .status-bar {
      position: absolute;
      top: max(18px, env(safe-area-inset-top));
      left: 26px;
      right: 24px;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: rgba(0, 0, 0, 0.74);
      font-size: 22px;
      font-weight: 520;
      line-height: 1;
      letter-spacing: 0;
    }

    .status-icons {
      display: flex;
      align-items: center;
      gap: 7px;
      color: rgba(0, 0, 0, 0.7);
    }

    .signal {
      display: inline-grid;
      grid-auto-flow: column;
      align-items: end;
      gap: 2px;
      width: 22px;
      height: 14px;
    }

    .signal i {
      display: block;
      width: 3px;
      border-radius: 2px;
      background: currentColor;
    }

    .signal i:nth-child(1) { height: 4px; }
    .signal i:nth-child(2) { height: 7px; }
    .signal i:nth-child(3) { height: 10px; }
    .signal i:nth-child(4) { height: 13px; }

    .battery-mini {
      position: relative;
      width: 36px;
      height: 18px;
      border: 2px solid currentColor;
      border-radius: 5px;
    }

    .battery-mini::before {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 42%;
      height: 8px;
      content: "";
      border-radius: 2px;
      background: currentColor;
    }

    .battery-mini::after {
      position: absolute;
      top: 5px;
      right: -5px;
      width: 3px;
      height: 6px;
      content: "";
      border-radius: 0 2px 2px 0;
      background: currentColor;
    }

    .home-grid {
      position: absolute;
      inset: 108px 28px 160px;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(4, minmax(58px, 1fr));
      align-content: start;
      gap: 34px 22px;
      color: rgba(16, 18, 18, 0.76);
    }

    .app {
      display: grid;
      justify-items: center;
      gap: 9px;
      min-width: 0;
      font-size: clamp(12px, 3vw, 16px);
      line-height: 1.1;
      text-align: center;
    }

    .icon {
      position: relative;
      width: clamp(58px, 15vw, 74px);
      aspect-ratio: 1;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
    }

    .icon::before,
    .icon::after {
      position: absolute;
      content: "";
    }

    .icon.blue { background: linear-gradient(155deg, #103783, #2c96e6); }
    .icon.green { background: linear-gradient(155deg, #004c3e, #08ae85); }
    .icon.navy { background: linear-gradient(155deg, #020911, #123b6d); }
    .icon.red { background: linear-gradient(155deg, #8d1018, #e33c40); }
    .icon.black { background: linear-gradient(155deg, #020202, #151515); }
    .icon.purple { background: linear-gradient(155deg, #25185e, #7683ff); }
    .icon.cyan { background: linear-gradient(155deg, #0c4956, #55d4ff); }
    .icon.gold { background: linear-gradient(155deg, #40320f, #d7a923); }

    .icon.check::before {
      left: 17%;
      top: 26%;
      width: 58%;
      height: 30%;
      border-bottom: 9px solid rgba(255, 255, 255, 0.78);
      border-left: 9px solid rgba(255, 255, 255, 0.78);
      border-radius: 4px;
      transform: rotate(-45deg);
    }

    .icon.plus::before,
    .icon.plus::after {
      inset: 31% 22%;
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.58);
    }

    .icon.plus::after {
      inset: 22% 31%;
    }

    .icon.market::before {
      left: 25%;
      top: 17%;
      width: 48%;
      height: 32%;
      border: 5px solid rgba(255, 255, 255, 0.45);
      border-bottom: 0;
      border-radius: 50% 50% 0 0;
    }

    .icon.market::after {
      left: 20%;
      right: 20%;
      bottom: 19%;
      height: 34%;
      border-radius: 0 0 16px 16px;
      background: rgba(255, 255, 255, 0.32);
    }

    .icon.git::before {
      inset: 19%;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.86);
    }

    .icon.git::after {
      left: 32%;
      top: 34%;
      width: 36%;
      height: 34%;
      border-radius: 50% 50% 46% 46%;
      box-shadow: 0 -11px 0 -6px #050505, -11px -6px 0 -7px #050505, 11px -6px 0 -7px #050505;
      background: #050505;
    }

    .icon.graph::before {
      inset: 22%;
      border-left: 4px solid rgba(92, 255, 167, 0.72);
      border-bottom: 4px solid rgba(92, 255, 167, 0.72);
      transform: skew(-16deg);
    }

    .icon.graph::after {
      left: 25%;
      top: 58%;
      width: 48%;
      height: 3px;
      background: rgba(92, 255, 167, 0.82);
      box-shadow: 16px -18px 0 rgba(92, 255, 167, 0.82), 30px -30px 0 rgba(92, 255, 167, 0.82);
      transform: rotate(-33deg);
    }

    .icon.chat::before {
      inset: 22% 17% 27%;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.68);
    }

    .icon.chat::after {
      right: 19%;
      bottom: 24%;
      border: 8px solid transparent;
      border-left-color: rgba(255, 255, 255, 0.68);
      transform: rotate(34deg);
    }

    .dock {
      position: absolute;
      left: 30px;
      right: 30px;
      bottom: max(28px, env(safe-area-inset-bottom));
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 18px;
      padding: 0 2px;
    }

    .dock .icon {
      width: 100%;
      max-width: 74px;
      margin: 0 auto;
      border-radius: 19px;
    }

    .charge-stage {
      position: absolute;
      inset: 0;
      z-index: 6;
      pointer-events: none;
    }

    .liquid-field {
      position: absolute;
      top: 56.5%;
      left: 50%;
      width: min(92vw, 520px);
      height: min(68dvh, 640px);
      transform: translate(-50%, -50%);
    }

    .goo-shapes {
      position: absolute;
      inset: 0;
      z-index: 1;
      filter: url("#liquid-goo");
    }

    .main-goo {
      position: absolute;
      top: 11%;
      left: 50%;
      width: var(--orb-size);
      aspect-ratio: 1;
      border-radius: 50% 50% 48% 48% / 49% 49% 54% 51%;
      background: rgba(120, 245, 255, 0.33);
      transform: translateX(-50%);
      box-shadow: 0 0 30px rgba(105, 234, 255, 0.32);
    }

    .main-goo::before {
      position: absolute;
      right: 16%;
      bottom: -8%;
      width: 24%;
      height: 26%;
      content: "";
      border-radius: 46% 50% 56% 50%;
      background: rgba(121, 246, 255, 0.34);
    }

    .main-goo::after {
      position: absolute;
      left: 36%;
      bottom: -3.5%;
      width: 30%;
      height: 12%;
      content: "";
      border-radius: 999px;
      background: rgba(128, 246, 255, 0.34);
    }

    .drop {
      position: absolute;
      left: calc(50% + var(--x));
      top: var(--top);
      width: var(--size);
      aspect-ratio: 1;
      border-radius: 50%;
      background: rgba(116, 242, 255, 0.38);
      transform: translate(-50%, 0) scale(var(--scale, 1));
      opacity: 0;
      animation: rise-into-orb var(--duration) cubic-bezier(0.4, 0, 0.13, 1) infinite;
      animation-delay: var(--delay);
    }

    .drop.merge {
      --top: 76%;
      --size: calc(var(--orb-size) * 0.23);
      --x: -19%;
      --end-x: 13%;
      --end-y: -286%;
      --scale: 1;
      --duration: 4.8s;
      --delay: -1.1s;
    }

    .drop.mid {
      --top: 91%;
      --size: calc(var(--orb-size) * 0.15);
      --x: -8%;
      --end-x: 20%;
      --end-y: -432%;
      --scale: 0.95;
      --duration: 5.6s;
      --delay: -2.9s;
    }

    .drop.right {
      --top: 97%;
      --size: calc(var(--orb-size) * 0.16);
      --x: 18%;
      --end-x: 3%;
      --end-y: -478%;
      --scale: 0.92;
      --duration: 6.1s;
      --delay: -0.4s;
    }

    .drop.low {
      --top: 112%;
      --size: calc(var(--orb-size) * 0.17);
      --x: 12%;
      --end-x: 21%;
      --end-y: -565%;
      --scale: 0.9;
      --duration: 6.8s;
      --delay: -4.3s;
    }

    .drop.tiny {
      --top: 104%;
      --size: calc(var(--orb-size) * 0.11);
      --x: -1%;
      --end-x: 16%;
      --end-y: -566%;
      --scale: 0.9;
      --duration: 4.2s;
      --delay: -3.3s;
    }

    .orb {
      position: absolute;
      top: 11%;
      left: 50%;
      z-index: 3;
      width: var(--orb-size);
      aspect-ratio: 1;
      overflow: visible;
      border-radius: 50% 50% 48% 48% / 49% 49% 54% 51%;
      transform: translateX(-50%);
      background:
        radial-gradient(circle at 42% 18%, rgba(146, 223, 255, 0.58), rgba(117, 201, 255, 0.14) 15%, transparent 29%),
        radial-gradient(circle at 18% 40%, rgba(104, 244, 213, 0.28), transparent 33%),
        radial-gradient(circle at 62% 80%, rgba(70, 255, 246, 0.26), transparent 25%),
        radial-gradient(circle at 72% 18%, rgba(24, 54, 88, 0.75), rgba(7, 20, 31, 0.86) 48%, rgba(4, 8, 13, 0.96) 78%),
        linear-gradient(155deg, rgba(91, 245, 224, 0.48), rgba(12, 35, 39, 0.72) 44%, rgba(4, 8, 16, 0.96));
      box-shadow:
        inset 16px 20px 42px rgba(161, 238, 255, 0.46),
        inset -38px -42px 72px rgba(0, 8, 20, 0.78),
        inset 0 -20px 28px rgba(93, 255, 242, 0.18),
        0 0 8px rgba(186, 247, 255, 0.96),
        0 0 24px rgba(68, 212, 255, 0.34);
      animation: orb-breathe 3.6s ease-in-out infinite;
    }

    .orb::before {
      position: absolute;
      inset: 0;
      content: "";
      border-radius: inherit;
      background:
        radial-gradient(ellipse at 52% 103%, rgba(157, 255, 245, 0.95) 0 11%, rgba(85, 247, 255, 0.5) 15%, transparent 31%),
        radial-gradient(ellipse at 53% 92%, rgba(209, 255, 248, 0.62), transparent 24%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.09), transparent 34%);
      mix-blend-mode: screen;
      opacity: 0.86;
      pointer-events: none;
    }

    .orb::after {
      position: absolute;
      left: 19%;
      right: 17%;
      bottom: -3%;
      height: 19%;
      content: "";
      border-radius: 50%;
      background:
        radial-gradient(ellipse at 42% 38%, rgba(185, 255, 246, 0.86), rgba(64, 239, 255, 0.42) 44%, transparent 76%);
      filter: blur(3px);
      opacity: 0.95;
      transform: rotate(1deg);
    }

    .orb-neck {
      position: absolute;
      right: 16%;
      bottom: -16%;
      z-index: -1;
      width: 23%;
      height: 29%;
      border-radius: 42% 50% 55% 52%;
      background:
        radial-gradient(circle at 50% 82%, rgba(124, 229, 255, 0.58), rgba(11, 40, 45, 0.82) 49%, rgba(2, 8, 14, 0.92) 78%),
        linear-gradient(180deg, rgba(118, 251, 255, 0.78), rgba(6, 27, 31, 0.95));
      box-shadow:
        inset 9px -7px 18px rgba(8, 11, 20, 0.78),
        inset -8px 7px 19px rgba(147, 255, 240, 0.28),
        0 0 13px rgba(127, 245, 255, 0.62);
      transform: rotate(1deg);
    }

    .orb-neck::after {
      position: absolute;
      left: 50%;
      bottom: -4%;
      width: 86%;
      height: 46%;
      content: "";
      border-radius: 50%;
      background: radial-gradient(circle, rgba(146, 239, 255, 0.38), rgba(6, 15, 22, 0.9) 70%);
      transform: translateX(-50%);
      box-shadow: 0 0 14px rgba(99, 223, 255, 0.52);
    }

    .orb-sheen {
      position: absolute;
      inset: 4% 3% auto 6%;
      height: 42%;
      border-radius: 50%;
      background:
        radial-gradient(ellipse at 45% 9%, rgba(255, 255, 255, 0.58), transparent 12%),
        linear-gradient(180deg, rgba(138, 218, 255, 0.33), transparent);
      filter: blur(0.6px);
      opacity: 0.38;
      transform: rotate(-7deg);
      pointer-events: none;
    }

    .orb-ripple {
      position: absolute;
      left: 12%;
      right: 9%;
      bottom: 8%;
      height: 21%;
      border-radius: 48%;
      background:
        radial-gradient(ellipse at 54% 20%, rgba(179, 255, 248, 0.54), rgba(64, 244, 255, 0.2) 40%, transparent 71%);
      opacity: 0.64;
      filter: blur(4px);
      transform-origin: center;
      animation: rim-shimmer 2.7s ease-in-out infinite;
      pointer-events: none;
    }

    .readout {
      position: absolute;
      inset: 0;
      z-index: 4;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(16px, 4vw, 22px);
      color: rgba(255, 255, 255, 0.96);
      text-shadow: 0 0 20px rgba(164, 255, 255, 0.32);
      transform: translateY(3%);
    }

    .bolt {
      width: clamp(42px, 11vw, 58px);
      height: clamp(42px, 11vw, 58px);
      fill: currentColor;
      filter: drop-shadow(0 0 8px rgba(196, 255, 255, 0.24));
    }

    .charge-value {
      display: flex;
      align-items: baseline;
      gap: 7px;
      font-size: clamp(64px, 17vw, 92px);
      font-weight: 320;
      letter-spacing: 0;
      line-height: 0.9;
    }

    .charge-value span {
      font-size: 0.52em;
      font-weight: 360;
    }

    .glass-drop {
      position: absolute;
      z-index: 4;
      left: calc(50% + var(--x));
      top: var(--top);
      width: var(--size);
      aspect-ratio: 1;
      border-radius: 50%;
      background:
        radial-gradient(circle at 36% 20%, rgba(179, 242, 255, 0.74), transparent 19%),
        radial-gradient(circle at 35% 34%, rgba(102, 245, 217, 0.31), transparent 42%),
        radial-gradient(circle at 72% 82%, rgba(32, 55, 100, 0.92), rgba(4, 11, 20, 0.84) 58%, rgba(1, 4, 9, 0.96) 79%),
        linear-gradient(135deg, rgba(132, 250, 236, 0.58), rgba(7, 24, 31, 0.88));
      box-shadow:
        inset 7px 8px 16px rgba(164, 241, 255, 0.34),
        inset -10px -12px 22px rgba(0, 7, 18, 0.78),
        0 0 7px rgba(190, 248, 255, 0.76),
        0 0 15px rgba(79, 177, 255, 0.34);
      transform: translate(-50%, 0) scale(var(--scale, 1));
      opacity: 0;
      animation: rise-glass var(--duration) cubic-bezier(0.4, 0, 0.13, 1) infinite;
      animation-delay: var(--delay);
    }

    .glass-drop::after {
      position: absolute;
      left: 16%;
      right: 14%;
      bottom: 4%;
      height: 18%;
      content: "";
      border-radius: 50%;
      background: radial-gradient(ellipse, rgba(181, 255, 249, 0.76), transparent 70%);
      filter: blur(1px);
      opacity: 0.72;
    }

    .glass-drop.one {
      --top: 75.5%;
      --size: calc(var(--orb-size) * 0.23);
      --x: -19%;
      --end-x: 13%;
      --end-y: -286%;
      --scale: 1;
      --duration: 4.8s;
      --delay: -1.1s;
    }

    .glass-drop.two {
      --top: 90%;
      --size: calc(var(--orb-size) * 0.15);
      --x: -8%;
      --end-x: 20%;
      --end-y: -432%;
      --scale: 0.95;
      --duration: 5.6s;
      --delay: -2.9s;
    }

    .glass-drop.three {
      --top: 97%;
      --size: calc(var(--orb-size) * 0.16);
      --x: 18%;
      --end-x: 3%;
      --end-y: -478%;
      --scale: 0.92;
      --duration: 6.1s;
      --delay: -0.4s;
    }

    .glass-drop.four {
      --top: 111%;
      --size: calc(var(--orb-size) * 0.17);
      --x: 12%;
      --end-x: 21%;
      --end-y: -565%;
      --scale: 0.9;
      --duration: 6.8s;
      --delay: -4.3s;
    }

    .glass-drop.five {
      --top: 104%;
      --size: calc(var(--orb-size) * 0.11);
      --x: -1%;
      --end-x: 16%;
      --end-y: -566%;
      --scale: 0.9;
      --duration: 4.2s;
      --delay: -3.3s;
    }

    .bottom-glow {
      position: absolute;
      left: 50%;
      bottom: -11dvh;
      z-index: 5;
      width: min(118vw, 560px);
      height: 22dvh;
      border-radius: 50%;
      background:
        radial-gradient(ellipse at 50% 33%, rgba(215, 255, 224, 0.9), rgba(129, 255, 214, 0.32) 22%, rgba(31, 132, 105, 0.12) 40%, transparent 72%);
      filter: blur(6px);
      transform: translateX(-50%);
      opacity: 0.74;
      animation: base-pulse 2.8s ease-in-out infinite;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @keyframes rise-into-orb {
      0% {
        opacity: 0;
        transform: translate(-50%, 34%) scale(calc(var(--scale) * 0.62));
      }

      13% {
        opacity: 0.82;
      }

      72% {
        opacity: 0.86;
        transform: translate(calc(-50% + var(--end-x) * 0.3), calc(var(--end-y) * 0.72)) scale(var(--scale));
      }

      92% {
        opacity: 0.8;
        transform: translate(calc(-50% + var(--end-x)), var(--end-y)) scale(calc(var(--scale) * 0.64));
      }

      100% {
        opacity: 0;
        transform: translate(calc(-50% + var(--end-x)), calc(var(--end-y) - 22%)) scale(0.06);
      }
    }

    @keyframes rise-glass {
      0% {
        opacity: 0;
        transform: translate(-50%, 34%) scale(calc(var(--scale) * 0.62));
      }

      13% {
        opacity: 1;
      }

      72% {
        opacity: 0.92;
        transform: translate(calc(-50% + var(--end-x) * 0.3), calc(var(--end-y) * 0.72)) scale(var(--scale));
      }

      87% {
        opacity: 0.78;
      }

      100% {
        opacity: 0;
        transform: translate(calc(-50% + var(--end-x)), calc(var(--end-y) - 19%)) scale(0.08);
      }
    }

    @keyframes orb-breathe {
      0%,
      100% {
        transform: translateX(-50%) scale(1);
      }

      50% {
        transform: translateX(-50%) scale(1.018, 1.012);
      }
    }

    @keyframes rim-shimmer {
      0%,
      100% {
        opacity: 0.58;
        transform: translateY(0) scaleX(0.96);
      }

      50% {
        opacity: 0.82;
        transform: translateY(-4px) scaleX(1.03);
      }
    }

    @keyframes base-pulse {
      0%,
      100% {
        opacity: 0.55;
        transform: translateX(-50%) scaleX(0.96);
      }

      50% {
        opacity: 0.82;
        transform: translateX(-50%) scaleX(1.02);
      }
    }

    @media (min-width: 700px) {
      body {
        background:
          radial-gradient(circle at 50% 38%, rgba(57, 130, 117, 0.14), transparent 30%),
          #050605;
      }

      .phone {
        min-height: min(100dvh, 960px);
        box-shadow: 0 24px 72px rgba(0, 0, 0, 0.58);
      }
    }

    @media (max-height: 760px) {
      :root {
        --orb-size: clamp(250px, 61vh, 330px);
      }

      .liquid-field {
        top: 56%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
      }

      .drop,
      .glass-drop {
        opacity: 1;
      }
    }
  </style>
</head>
<body>
  <main class="phone" aria-label="Huawei fast charge water drop animation">
    <p class="sr-only">Charging animation with a glowing liquid drop, rising water bubbles and a 42 percent charge readout.</p>

    <div class="status-bar" aria-hidden="true">
      <span>13:36</span>
      <div class="status-icons">
        <span class="signal" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="battery-mini"></span>
      </div>
    </div>

    <section class="home-grid" aria-hidden="true">
      <div class="app"><span class="icon blue"></span><span>Video</span></div>
      <div class="app"><span class="icon green check"></span><span>Check in</span></div>
      <div class="app"><span class="icon blue plus"></span><span>APK</span></div>
      <div class="app"><span class="icon navy graph"></span><span>Invest</span></div>
      <div class="app"><span class="icon red market"></span><span>Market</span></div>
      <div class="app"><span class="icon gold"></span><span>Finance</span></div>
      <div class="app"><span class="icon black git"></span><span>GitHub</span></div>
      <div class="app"><span class="icon purple"></span><span>Tools</span></div>
      <div class="app"><span class="icon cyan"></span><span>Notes</span></div>
      <div class="app"><span class="icon green"></span><span>Files</span></div>
      <div class="app"><span class="icon black"></span><span>Camera</span></div>
      <div class="app"><span class="icon blue"></span><span>Cloud</span></div>
    </section>

    <div class="dock" aria-hidden="true">
      <span class="icon green"></span>
      <span class="icon green chat"></span>
      <span class="icon blue"></span>
      <span class="icon cyan chat"></span>
    </div>

    <section class="charge-stage" aria-hidden="true">
      <svg width="0" height="0" focusable="false" aria-hidden="true">
        <filter id="liquid-goo" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur"></feGaussianBlur>
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 23 -9" result="goo"></feColorMatrix>
          <feBlend in="SourceGraphic" in2="goo"></feBlend>
        </filter>
      </svg>

      <div class="liquid-field">
        <div class="goo-shapes">
          <div class="main-goo"></div>
          <div class="drop merge"></div>
          <div class="drop mid"></div>
          <div class="drop right"></div>
          <div class="drop low"></div>
          <div class="drop tiny"></div>
        </div>

        <div class="orb">
          <div class="orb-neck"></div>
          <div class="orb-sheen"></div>
          <div class="orb-ripple"></div>
          <div class="readout">
            <svg class="bolt" viewBox="0 0 48 64" aria-hidden="true">
              <path d="M29.5 2 6 35.5h15.5L17 62l25-35.5H26.5L29.5 2Z"></path>
            </svg>
            <div class="charge-value">42<span>%</span></div>
          </div>
        </div>

        <div class="glass-drop one"></div>
        <div class="glass-drop two"></div>
        <div class="glass-drop three"></div>
        <div class="glass-drop four"></div>
        <div class="glass-drop five"></div>
      </div>
    </section>

    <div class="bottom-glow" aria-hidden="true"></div>
  </main>
</body>
</html>
