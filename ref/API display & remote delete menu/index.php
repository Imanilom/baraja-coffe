<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Display — Baraja Coffee Amphitheater</title>

    <!-- ═══ GOOGLE FONTS ═══ -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500&family=Manrope:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">

    <!-- ═══ BOOTSTRAP 5 ═══ -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">

    <!-- ═══ FONT AWESOME 6 ═══ -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer">

    <!-- ═══ ANIMATE.CSS ═══ -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">

    <style>
        :root {
            --cream: #F5F8EE;
            --cream2: #E8EFDA;
            --espresso: #24311E;
            --roast: #33452A;
            --caramel: #C08A3A;
            --caramel-l: #DDAC63;
            --gold: #AD7B25;
            --milk: #FFFFFF;
            --muted: #63765A;
            --border: rgba(36, 49, 30, 0.08);
            --ok: #2E7D42;
            --ok-bg: #E9F6EA;
            --warn-bg: #FBF3E1;
            --warn: #8C5E12;
            --overlay: rgba(24, 34, 18, 0.68);
            --sage: #8FAE78;
            --sage-deep: #435C31;
            --sage-light: #E1EBD2;
            --forest: #16220E;

            /* Light theme surfaces */
            --bg-page: #F7F9F0;
            --bg-panel: rgba(255, 255, 255, 0.84);
            --bg-glass: rgba(255, 255, 255, 0.74);
            --bg-footer: rgba(255, 255, 255, 0.86);
            --shadow-soft: 0 4px 20px rgba(28, 40, 20, 0.05);
            --shadow-card: 0 14px 38px rgba(28, 40, 20, 0.08);
            --text-primary: #24311E;
            --text-secondary: #3B5030;
            --text-muted: #63765A;
            --text-placeholder: #A6BC96;
            --accent: #C08A3A;
            --accent-hover: #9E6F2A;
            --accent-light: #FBF1DF;
        }

        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0
        }

        html,
        body {
            width: 100%;
            height: 100%;
            overflow: hidden
        }

        body {
            font-family: 'Manrope', sans-serif;
            background: var(--bg-page);
            display: flex;
            align-items: center;
            justify-content: center
        }

        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background:
                radial-gradient(circle at 10% 20%, rgba(225, 235, 210, 0.6) 0%, transparent 60%),
                radial-gradient(circle at 90% 80%, rgba(232, 239, 218, 0.5) 0%, transparent 60%);
            pointer-events: none
        }

        .shell {
            width: 100vw;
            height: 100vh;
            display: grid;
            grid-template-rows: auto 1fr auto;
            padding: 18px;
            gap: 10px;
            position: relative
        }

        .main-area {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 18px;
            min-height: 0
        }

        /* ── PROMO PANEL ── */
        .promo-panel {
            border-radius: 24px;
            overflow: hidden;
            position: relative;
            background: var(--roast);
            box-shadow: var(--shadow-card);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .slide {
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity .8s ease
        }

        .slide.active {
            opacity: 1
        }

        .slide-img {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center
        }

        .slide-img::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, transparent 35%, rgba(22, 34, 14, .92) 100%)
        }

        .slide-caption {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 32px 28px 24px;
            z-index: 2
        }

        .slide-tag {
            display: inline-block;
            background: var(--caramel);
            color: #fff;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: .12em;
            text-transform: uppercase;
            padding: 3px 10px;
            border-radius: 40px;
            margin-bottom: 8px
        }

        .slide-caption h2 {
            font-family: 'Fraunces', serif;
            color: #fff;
            font-size: clamp(20px, 2.2vw, 30px);
            font-weight: 700;
            line-height: 1.25;
            margin-bottom: 6px
        }

        .slide-caption p {
            color: rgba(255, 255, 255, .65);
            font-size: 13px;
            font-weight: 300;
            line-height: 1.6
        }

        .slide-dots {
            position: absolute;
            bottom: 22px;
            right: 24px;
            display: flex;
            gap: 6px;
            z-index: 10
        }

        .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(255, 255, 255, .28);
            transition: all .4s;
            cursor: pointer;
            border: none
        }

        .dot.active {
            background: var(--caramel-l);
            width: 18px;
            border-radius: 3px
        }

        .slide-progress {
            position: absolute;
            top: 0;
            left: 0;
            height: 3px;
            background: var(--caramel);
            border-radius: 0 2px 2px 0;
            z-index: 10;
            animation: prog 5s linear infinite
        }

        @keyframes prog {
            from {
                width: 0
            }

            to {
                width: 100%
            }
        }

        /* EVENT BADGE on promo */
        .event-badge {
            position: absolute;
            top: 18px;
            right: 18px;
            z-index: 10;
            background: var(--gold);
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: 40px;
            cursor: pointer;
            transition: transform .2s;
            animation: badgePop 1s ease .5s both
        }

        .event-badge:hover {
            transform: scale(1.07)
        }

        @keyframes badgePop {
            from {
                opacity: 0;
                transform: scale(.7)
            }

            to {
                opacity: 1;
                transform: scale(1)
            }
        }

        /* ── ORDER PANEL ── */
        .order-panel {
            background: var(--bg-panel);
            border-radius: 24px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: var(--shadow-card);
            border: 1px solid rgba(255, 255, 255, 0.45);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
        }

        .order-header {
            padding: 20px 22px 14px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(135deg, #F6F9EF 0%, #ffffff 100%)
        }

        .order-header h3 {
            font-family: 'Fraunces', serif;
            font-size: 19px;
            color: var(--text-primary);
            font-weight: 600
        }

        .order-header p {
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 2px
        }

        .order-num-badge {
            background: var(--accent-light);
            border: 1px solid rgba(67, 92, 49, 0.20);
            border-radius: 10px;
            padding: 5px 12px;
            text-align: center
        }

        .order-num-badge span {
            display: block;
            font-size: 9px;
            color: var(--text-muted);
            letter-spacing: .08em;
            text-transform: uppercase
        }

        .order-num-badge strong {
            font-family: 'DM Mono', monospace;
            font-size: 17px;
            color: var(--accent)
        }

        .order-items {
            flex: 1;
            overflow-y: auto;
            padding: 8px 0
        }

        .order-items::-webkit-scrollbar {
            width: 4px
        }

        .order-items::-webkit-scrollbar-thumb {
            background: var(--cream2);
            border-radius: 4px
        }

        .order-item {
            display: flex;
            align-items: center;
            padding: 10px 20px;
            gap: 12px;
            border-bottom: 1px solid rgba(36, 49, 30, .05);
            animation: itemIn .3s ease both
        }

        @keyframes itemIn {
            from {
                opacity: 0;
                transform: translateX(10px)
            }

            to {
                opacity: 1;
                transform: translateX(0)
            }
        }

        .item-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: var(--accent-light);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0
        }

        .item-info {
            flex: 1;
            min-width: 0
        }

        .item-name {
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis
        }

        .item-note {
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 1px
        }

        .item-qty {
            background: var(--accent-light);
            border-radius: 7px;
            padding: 2px 9px;
            font-size: 12px;
            font-weight: 600;
            color: var(--accent);
            flex-shrink: 0
        }

        .item-price {
            font-family: 'DM Mono', monospace;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
            flex-shrink: 0;
            text-align: right;
            min-width: 75px
        }

        .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            gap: 8px;
            padding: 40px;
            text-align: center
        }

        .empty-state .ei {
            font-size: 38px;
            opacity: .25
        }

        .empty-state p {
            font-size: 12px;
            opacity: .55
        }

        /* Summary */
        .summary-box {
            background: rgba(245, 248, 238, 0.5);
            border-top: 1px solid var(--border);
            padding: 16px 22px
        }

        .sum-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 5px
        }

        .sum-row span:last-child {
            font-family: 'DM Mono', monospace
        }

        .sum-row.disc {
            color: var(--ok);
            font-weight: 500
        }

        .sum-div {
            height: 1px;
            background: var(--border);
            margin: 9px 0
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 14px
        }

        .total-lbl {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-muted);
            letter-spacing: .05em;
            text-transform: uppercase
        }

        .total-amt {
            font-family: 'Fraunces', serif;
            font-size: 26px;
            font-weight: 700;
            color: var(--text-primary)
        }

        .pay-status {
            border-radius: 12px;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 9px;
            font-weight: 500;
            font-size: 12px;
            transition: all .4s
        }

        .pay-status.waiting {
            background: var(--warn-bg);
            color: var(--warn);
            border: 1px solid rgba(140, 94, 18, .15)
        }

        .pay-status.processing {
            background: #E8F5EE;
            color: #2D6A4F;
            border: 1px solid rgba(46, 125, 66, .15)
        }

        .pay-status.paid {
            background: var(--ok-bg);
            color: var(--ok);
            border: 1px solid rgba(58, 125, 68, .15)
        }

        .sdot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            animation: pulse 2s infinite;
            flex-shrink: 0
        }

        .waiting .sdot {
            background: var(--warn)
        }

        .processing .sdot {
            background: #2D6A4F
        }

        .paid .sdot {
            background: var(--ok)
        }

        @keyframes pulse {

            0%,
            100% {
                opacity: 1
            }

            50% {
                opacity: .25
            }
        }

        /* QR Area */
        .qr-area {
            display: none;
            align-items: center;
            gap: 14px;
            padding: 10px 22px;
            background: var(--accent-light);
            border-top: 1px solid var(--border)
        }

        .qr-area.vis {
            display: flex
        }

        .qr-box {
            width: 60px;
            height: 60px;
            border: 2px solid rgba(67, 92, 49, 0.2);
            border-radius: 10px;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0
        }

        .qr-box svg {
            width: 50px;
            height: 50px
        }

        .qr-info p {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-primary)
        }

        .qr-info small {
            font-size: 10px;
            color: var(--text-muted)
        }

        /* Footer */
        .footer-bar {
            background: var(--bg-footer);
            border: 1px solid rgba(67, 92, 49, 0.18);
            border-radius: 14px;
            padding: 9px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: var(--shadow-soft)
        }

        .brand-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--accent);
            font-family: 'Fraunces', serif;
            font-size: 15px;
            font-weight: 700
        }

        .brand-logo img {
            height: 32px;
            width: auto;
            filter: none;
        }

        .brand-tag {
            font-size: 10px;
            color: var(--text-muted);
            letter-spacing: .05em;
            text-transform: uppercase
        }

        .f-center {
            display: flex;
            align-items: center;
            gap: 22px
        }

        .f-stat .val {
            font-family: 'DM Mono', monospace;
            font-size: 14px;
            color: var(--text-primary);
            display: block;
            text-align: center
        }

        .f-stat .lbl {
            font-size: 9px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: .07em;
            display: block;
            text-align: center
        }

        .conn-ind {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            color: var(--text-muted)
        }

        .cdot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #4ADE80;
            animation: cpulse 2.5s ease-in-out infinite
        }

        @keyframes cpulse {

            0%,
            100% {
                box-shadow: 0 0 0 0 rgba(74, 222, 128, .4)
            }

            50% {
                box-shadow: 0 0 0 5px rgba(74, 222, 128, 0)
            }
        }

        .dev-id {
            font-family: 'DM Mono', monospace;
            font-size: 9px;
            color: var(--text-muted);
            border: 1px solid rgba(67, 92, 49, 0.18);
            border-radius: 5px;
            padding: 2px 7px
        }

        /* ════ OVERLAY BASE ════ */
        .overlay {
            position: fixed;
            inset: 0;
            background: var(--overlay);
            z-index: 200;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity .35s
        }

        .overlay.show {
            opacity: 1;
            pointer-events: all
        }

        .modal {
            display: block !important; /* Override Bootstrap's display: none */
            position: relative !important; /* Override Bootstrap's position: fixed */
            background: #FFFFFF;
            border-radius: 24px;
            padding: 0;
            overflow: hidden;
            width: min(520px, 92vw);
            transform: translateY(20px) scale(.97);
            transition: transform .35s cubic-bezier(.34, 1.4, .64, 1);
            box-shadow: 0 20px 60px rgba(28, 40, 20, 0.18), 0 4px 20px rgba(28, 40, 20, 0.10)
        }

        .overlay.show .modal {
            transform: translateY(0) scale(1)
        }

        /* ════ RECEIPT MODAL ════ */
        .receipt-header {
            background: linear-gradient(135deg, var(--roast) 0%, var(--sage-deep) 100%);
            padding: 28px 28px 20px;
            text-align: center
        }

        .receipt-header .rh-logo {
            font-family: 'Fraunces', serif;
            color: #ffffff;
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .receipt-header .rh-logo img {
            height: 38px;
            width: auto;
            filter: brightness(2) saturate(0.5);
        }

        .receipt-header .rh-sub {
            font-size: 11px;
            color: rgba(255, 255, 255, .55);
            letter-spacing: .06em;
            margin-top: 2px
        }

        .receipt-header .rh-txn {
            font-family: 'DM Mono', monospace;
            font-size: 12px;
            color: rgba(255, 255, 255, .65);
            margin-top: 12px;
            border-top: 1px dashed rgba(255, 255, 255, .20);
            padding-top: 10px
        }

        .receipt-body {
            padding: 20px 28px
        }

        .r-item-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: var(--text-primary);
            padding: 5px 0;
            border-bottom: 1px dotted rgba(36, 49, 30, .12)
        }

        .r-item-row:last-child {
            border-bottom: none
        }

        .r-item-name {
            font-weight: 500
        }

        .r-item-qty {
            color: var(--text-muted);
            font-size: 12px
        }

        .r-item-price {
            font-family: 'DM Mono', monospace
        }

        .r-summary {
            background: var(--cream);
            border-radius: 12px;
            padding: 14px 16px;
            margin-top: 14px
        }

        .r-sum-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 4px
        }

        .r-sum-row span:last-child {
            font-family: 'DM Mono', monospace
        }

        .r-sum-row.total {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary);
            border-top: 1px solid var(--border);
            padding-top: 8px;
            margin-top: 8px
        }

        .r-sum-row.disc {
            color: var(--ok)
        }

        .r-footer-note {
            text-align: center;
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 14px;
            line-height: 1.7
        }

        .email-area {
            padding: 0 28px 20px;
            display: flex;
            gap: 8px
        }

        .email-input {
            flex: 1;
            border: 1.5px solid var(--border);
            border-radius: 12px;
            padding: 10px 14px;
            font-family: 'Manrope', sans-serif;
            font-size: 13px;
            color: var(--text-primary);
            background: #fff;
            outline: none;
            transition: border-color .2s
        }

        .email-input:focus {
            border-color: var(--accent)
        }

        .btn-send {
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 12px;
            padding: 10px 18px;
            font-family: 'Manrope', sans-serif;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background .2s;
            white-space: nowrap
        }

        .btn-send:hover {
            background: var(--accent-hover)
        }

        .btn-send:disabled {
            opacity: .55;
            cursor: not-allowed
        }

        .email-sent-msg {
            text-align: center;
            font-size: 13px;
            color: var(--ok);
            font-weight: 500;
            padding: 0 28px 16px;
            display: none
        }

        .modal-actions {
            padding: 0 28px 24px;
            display: flex;
            gap: 10px
        }

        .btn-outline {
            flex: 1;
            border: 1.5px solid var(--border);
            background: transparent;
            border-radius: 12px;
            padding: 10px;
            font-family: 'Manrope', sans-serif;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            cursor: pointer;
            transition: background .2s
        }

        .btn-outline:hover {
            background: var(--cream)
        }

        .btn-primary {
            flex: 1;
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 12px;
            padding: 10px;
            font-family: 'Manrope', sans-serif;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background .2s
        }

        .btn-primary:hover {
            background: var(--accent-hover)
        }

        /* ════ RATING MODAL ════ */
        .rating-header {
            padding: 28px 28px 16px;
            text-align: center;
            border-bottom: 1px solid var(--border)
        }

        .rating-header h2 {
            font-family: 'Fraunces', serif;
            font-size: 22px;
            color: var(--text-primary);
            margin-bottom: 4px
        }

        .rating-header p {
            font-size: 13px;
            color: var(--text-muted)
        }

        .rating-section {
            padding: 20px 28px;
            border-bottom: 1px solid var(--border)
        }

        .rating-section h4 {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: .07em;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 12px
        }

        .stars-row {
            display: flex;
            gap: 8px;
            justify-content: center
        }

        .star {
            font-size: 32px;
            cursor: pointer;
            transition: transform .15s;
            line-height: 1;
            color: #ddd;
            user-select: none
        }

        .star.lit {
            color: #F59E0B
        }

        .star:hover {
            transform: scale(1.2)
        }

        .rating-note {
            margin-top: 12px
        }

        .rating-note textarea {
            width: 100%;
            border: 1.5px solid var(--border);
            border-radius: 12px;
            padding: 10px 14px;
            font-family: 'Manrope', sans-serif;
            font-size: 13px;
            color: var(--text-primary);
            resize: none;
            height: 68px;
            outline: none;
            background: #fff;
            transition: border-color .2s
        }

        .rating-note textarea:focus {
            border-color: var(--accent)
        }

        .rating-thankyou {
            padding: 28px;
            text-align: center;
            display: none
        }

        .rating-thankyou .ty-icon {
            font-size: 48px;
            margin-bottom: 12px
        }

        .rating-thankyou h3 {
            font-family: 'Fraunces', serif;
            font-size: 20px;
            color: var(--text-primary);
            margin-bottom: 6px
        }

        .rating-thankyou p {
            font-size: 13px;
            color: var(--text-muted)
        }

        /* ════ SPIN MODAL ════ */
        .spin-header {
            padding: 24px 28px 16px;
            text-align: center
        }

        .spin-header .spin-title-tag {
            display: inline-block;
            background: var(--accent);
            color: #fff;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: .1em;
            text-transform: uppercase;
            padding: 3px 12px;
            border-radius: 40px;
            margin-bottom: 10px
        }

        .spin-header h2 {
            font-family: 'Fraunces', serif;
            font-size: 22px;
            color: var(--text-primary);
            margin-bottom: 4px
        }

        .spin-header p {
            font-size: 13px;
            color: var(--text-muted)
        }

        .spin-arena {
            padding: 16px 28px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 18px
        }

        .spin-drum-wrap {
            width: 260px;
            height: 160px;
            border-radius: 16px;
            background: var(--roast);
            overflow: hidden;
            position: relative;
            border: 3px solid var(--sage-deep)
        }

        .drum-window {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            transform: translateY(-50%);
            height: 48px;
            background: rgba(143, 174, 120, .15);
            border-top: 2px solid var(--caramel-l);
            border-bottom: 2px solid var(--caramel-l);
            z-index: 2;
            pointer-events: none
        }

        .drum-fade-top {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 48px;
            background: linear-gradient(to bottom, var(--roast), transparent);
            z-index: 3;
            pointer-events: none
        }

        .drum-fade-bot {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 48px;
            background: linear-gradient(to top, var(--roast), transparent);
            z-index: 3;
            pointer-events: none
        }

        .drum-strip {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform .05s linear
        }

        .drum-cell {
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            font-weight: 600;
            color: rgba(255, 255, 255, .7);
            letter-spacing: .04em;
            flex-shrink: 0;
            width: 100%
        }

        .drum-cell.winner {
            color: var(--caramel-l)
        }

        .btn-spin {
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 14px;
            padding: 12px 32px;
            font-family: 'Manrope', sans-serif;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all .2s;
            letter-spacing: .03em
        }

        .btn-spin:hover:not(:disabled) {
            background: var(--accent-hover);
            transform: scale(1.04)
        }

        .btn-spin:disabled {
            opacity: .5;
            cursor: not-allowed;
            transform: none
        }

        .spin-result {
            text-align: center;
            font-size: 14px;
            color: var(--text-primary);
            font-weight: 500;
            min-height: 20px
        }

        .spin-result.won {
            color: var(--ok);
            font-weight: 600
        }

        /* ════ TOAST ════ */
        .toast-area {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center
        }

        .toast {
            background: #fff;
            border: 1px solid rgba(67, 92, 49, 0.25);
            border-radius: 12px;
            padding: 10px 18px;
            color: var(--text-primary);
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 9px;
            white-space: nowrap;
            animation: toastIn .4s cubic-bezier(.34, 1.56, .64, 1) both;
            box-shadow: 0 8px 32px rgba(36, 49, 30, .15)
        }

        .toast.out {
            animation: toastOut .3s ease forwards
        }

        @keyframes toastIn {
            from {
                opacity: 0;
                transform: translateY(-12px) scale(.95)
            }

            to {
                opacity: 1;
                transform: none
            }
        }

        @keyframes toastOut {
            to {
                opacity: 0;
                transform: translateY(-8px) scale(.97)
            }
        }

        /* ════ FLOATING LEAF PARTICLES ════ */
        .particles {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            overflow: hidden
        }

        .leaf {
            position: absolute;
            font-size: 16px;
            opacity: 0;
            animation: leafFloat linear infinite;
            filter: blur(0.5px)
        }

        @keyframes leafFloat {
            0% {
                transform: translateY(105vh) rotate(0deg);
                opacity: 0
            }

            10% {
                opacity: .15
            }

            90% {
                opacity: .15
            }

            100% {
                transform: translateY(-10vh) rotate(360deg);
                opacity: 0
            }
        }

        /* ════ RUNNING TICKER ════ */
        .ticker-bar {
            background: linear-gradient(90deg, var(--roast), var(--sage-deep), var(--roast));
            border-radius: 10px;
            padding: 7px 0;
            overflow: hidden;
            position: relative;
            margin-bottom: -4px
        }

        .ticker-track {
            display: flex;
            white-space: nowrap;
            animation: tickerScroll 30s linear infinite
        }

        .ticker-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: rgba(255, 255, 255, .7);
            padding: 0 28px;
            letter-spacing: .03em
        }

        .ticker-item .ti-dot {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--sage-light);
            flex-shrink: 0
        }

        @keyframes tickerScroll {
            0% {
                transform: translateX(0)
            }

            100% {
                transform: translateX(-50%)
            }
        }

        /* ════ ORDER PROGRESS TRACKER ════ */
        .order-progress {
            padding: 12px 22px 8px;
            border-bottom: 1px solid var(--border)
        }

        .progress-steps {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative
        }

        .progress-steps::before {
            content: '';
            position: absolute;
            top: 13px;
            left: 28px;
            right: 28px;
            height: 2px;
            background: var(--cream2);
            z-index: 0
        }

        .progress-fill {
            position: absolute;
            top: 13px;
            left: 28px;
            height: 2px;
            background: linear-gradient(90deg, var(--caramel), var(--ok));
            z-index: 1;
            transition: width .8s cubic-bezier(.4, 0, .2, 1);
            border-radius: 2px
        }

        .p-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            z-index: 2;
            position: relative
        }

        .p-step-circle {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: var(--cream2);
            border: 2px solid var(--cream2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            transition: all .4s;
            color: var(--muted)
        }

        .p-step.active .p-step-circle {
            background: var(--caramel);
            border-color: var(--caramel);
            color: #fff;
            box-shadow: 0 0 0 4px rgba(99, 118, 90, .2)
        }

        .p-step.done .p-step-circle {
            background: var(--ok);
            border-color: var(--ok);
            color: #fff
        }

        .p-step-label {
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .06em;
            color: var(--muted);
            opacity: .5;
            transition: all .3s
        }

        .p-step.active .p-step-label,
        .p-step.done .p-step-label {
            opacity: 1;
            color: var(--espresso)
        }

        /* ════ IDLE / WELCOME SCREEN ════ */
        .idle-screen {
            position: fixed;
            inset: 0;
            z-index: 100;
            background: linear-gradient(160deg, #F7F9F0 0%, #EDF2E0 50%, #E1EBD2 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            transition: opacity .6s, visibility .6s;
        }

        .idle-screen.hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none
        }

        .idle-logo {
            animation: idleFloat 4s ease-in-out infinite
        }

        .idle-logo img {
            height: 120px;
            width: auto;
            filter: drop-shadow(0 16px 40px rgba(192, 138, 58, 0.2))
        }

        .idle-name {
            font-family: 'Fraunces', serif;
            font-size: 32px;
            font-weight: 700;
            color: var(--roast);
            text-align: center;
            animation: idleFadeUp 1s ease .3s both
        }

        .idle-tagline {
            font-size: 13px;
            color: var(--text-muted);
            letter-spacing: .15em;
            text-transform: uppercase;
            animation: idleFadeUp 1s ease .6s both
        }

        .idle-time {
            font-family: 'DM Mono', monospace;
            font-size: 48px;
            color: rgba(59, 80, 48, 0.18);
            font-weight: 400;
            margin-top: 20px;
            animation: idleFadeUp 1s ease .9s both
        }

        .idle-cta {
            font-size: 12px;
            color: var(--text-muted);
            opacity: .6;
            margin-top: 10px;
            animation: idlePulse 3s ease-in-out infinite
        }

        @keyframes idleFloat {

            0%,
            100% {
                transform: translateY(0)
            }

            50% {
                transform: translateY(-12px)
            }
        }

        @keyframes idleFadeUp {
            from {
                opacity: 0;
                transform: translateY(15px)
            }

            to {
                opacity: 1;
                transform: translateY(0)
            }
        }

        @keyframes idlePulse {

            0%,
            100% {
                opacity: .2
            }

            50% {
                opacity: .5
            }
        }

        /* ════ GLASSMORPHISM ORDER PANEL ════ */
        .order-panel {
            background: rgba(247, 249, 240, .92);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(143, 174, 120, .15)
        }

        /* ════ PROMO PANEL GLOW BORDER ════ */
        .promo-panel {
            border: 1px solid rgba(143, 174, 120, .2);
            box-shadow: 0 0 40px rgba(99, 118, 90, .08), inset 0 0 30px rgba(0, 0, 0, .1)
        }

        /* ════ ORDER ITEM HOVER ════ */
        .order-item {
            transition: background .2s, transform .15s;
            border-radius: 8px;
            margin: 0 8px
        }

        .order-item:hover {
            background: rgba(67, 92, 49, .06);
            transform: translateX(4px)
        }

        /* ════ FOOTER DATE ════ */
        .f-date {
            font-size: 10px;
            color: var(--text-muted);
            margin-top: 1px
        }

        /* ════ WIFI INFO ════ */
        .wifi-badge {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 10px;
            color: var(--text-muted);
            background: var(--accent-light);
            border: 1px solid rgba(67, 92, 49, 0.18);
            border-radius: 8px;
            padding: 4px 10px
        }

        /* ════ ENHANCED FOOTER ════ */
        .footer-bar {
            background: var(--bg-footer);
            border: 1px solid rgba(67, 92, 49, 0.18);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px)
        }

        /* ════ SUMMARY TOTAL GLOW ════ */
        .total-amt {
            background: linear-gradient(135deg, var(--roast), var(--sage-deep));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text
        }        /* ════ DEVICE SELECTOR ════ */
        .device-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: var(--accent);
            color: #fff;
            padding: 12px 20px;
            border-radius: 30px;
            font-family: 'Manrope', sans-serif;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(46, 125, 66, .18);
            z-index: 1000;
            display: none;
            align-items: center;
            gap: 8px;
            transition: all .2s;
        }
        .device-btn:hover {
            background: var(--accent-hover);
            transform: translateY(-2px);
        }
        .device-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 20px;
        }
        .device-option {
            padding: 16px;
            background: var(--cream);
            border: 1px solid var(--border);
            border-radius: 12px;
            font-family: 'Manrope', sans-serif;
            font-size: 1.1rem;
            font-weight: 500;
            color: var(--text-primary);
            cursor: pointer;
            transition: all .2s;
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .device-option:hover {
            background: var(--cream2);
            border-color: var(--accent);
        }
        .device-option.active {
            background: var(--accent);
            color: #fff;
            border-color: var(--accent);
        }

        /* ════ CUSTOMER INFO CARD ════ */
        .customer-card {
            background: linear-gradient(135deg, rgba(192, 138, 58, 0.9) 0%, rgba(51, 69, 42, 0.9) 100%);
            padding: 14px 22px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border-bottom: 1px solid var(--border);
        }

        .customer-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.22);
            border: 2px solid rgba(255,255,255,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: #fff;
            flex-shrink: 0;
        }

        .customer-details {
            flex: 1;
            min-width: 0;
        }

        .customer-name-text {
            font-family: 'Fraunces', serif;
            font-size: 15px;
            font-weight: 600;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
        }

        .customer-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 4px;
            flex-wrap: wrap;
        }

        .customer-meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: rgba(255,255,255,0.80);
        }

        .customer-meta-item i {
            font-size: 10px;
            opacity: 0.85;
        }

        .queue-badge-pill {
            background: rgba(255,255,255,0.18);
            border: 1px solid rgba(255,255,255,0.30);
            border-radius: 10px;
            padding: 6px 14px;
            text-align: center;
            flex-shrink: 0;
        }

        .queue-badge-pill .qbp-label {
            display: block;
            font-size: 8.5px;
            color: rgba(255,255,255,0.65);
            letter-spacing: .09em;
            text-transform: uppercase;
        }

        .queue-badge-pill .qbp-num {
            font-family: 'DM Mono', monospace;
            font-size: 18px;
            font-weight: 700;
            color: #fff;
            line-height: 1.1;
            display: block;
        }

        /* ════ REDESIGNED ORDER HEADER TOP ════ */
        .order-header-top {
            padding: 14px 22px 10px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: transparent;
        }

        .order-header-top h3 {
            font-family: 'Fraunces', serif;
            font-size: 17px;
            color: var(--text-primary);
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 7px;
        }

        .order-header-top h3 i {
            color: var(--accent);
            font-size: 15px;
        }

        .item-count-chip {
            background: var(--accent-light);
            color: var(--accent);
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            padding: 3px 10px;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .item-count-chip i { font-size: 10px; }

        /* ════ ENHANCED PROGRESS STEPS ════ */
        .p-step-circle i { font-size: 11px; }

        /* ════ SUMMARY ICONS ════ */
        .sum-row i {
            color: var(--text-muted);
            width: 14px;
            margin-right: 4px;
            font-size: 11px;
            opacity: 0.75;
        }
        .sum-row.disc i { color: var(--ok); opacity: 1; }

        /* ════ PAY STATUS ════ */
        .pay-status .ps-icon { font-size: 15px; flex-shrink: 0; }

        /* ════ FOOTER ICONS ════ */
        .brand-logo i { font-size: 18px; color: var(--accent); }
        .wifi-badge i { color: var(--accent); }
        .conn-ind i { color: #4ADE80; }
        .f-stat i { color: var(--accent); font-size: 11px; margin-bottom: 1px; display: block; text-align: center; }

        /* ════ IDLE ICONS ════ */
        .idle-tagline i { color: var(--accent); margin: 0 6px; }

        /* ════ MODAL ICONS ════ */
        .rating-section h4 i { color: var(--accent); margin-right: 5px; }
        .modal-actions .btn-outline i,
        .modal-actions .btn-primary i { margin-right: 5px; }
        .btn-send i { margin-right: 4px; }
        .btn-spin i { margin-right: 5px; }

        /* ════ ITEM ICON FA (replaces emoji) ════ */
        .item-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: var(--accent-light);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: var(--accent);
            flex-shrink: 0;
        }

        /* ════ RECEIPT HEADER ICONS ════ */
        .rh-txn i { opacity: 0.7; margin-right: 3px; }

        /* ════ SLIDE TAG ICONS ════ */
        .slide-tag i { margin-right: 3px; }
        .event-badge i { margin-right: 4px; }

        /* ════ DEVICE OPTION ICONS ════ */
        .device-option i { color: var(--accent); }
        .device-option.active i { color: rgba(255,255,255,0.85); }

        /* ════ QR INFO ICONS ════ */
        .qr-info p i { color: var(--accent); margin-right: 4px; }

        /* ════ TICKER ICONS ════ */
        .ticker-item i { color: rgba(255,255,255,0.55); font-size: 10px; }
    </style>
</head>

<body>

    <!-- ═══ IDLE / WELCOME SCREEN ═══ -->
    <!-- <div class="idle-screen" id="idleScreen">
        <div class="idle-logo" onclick="handleLogoClick()" style="cursor:pointer"><img src="icon.png" alt="Baraja Coffee Amphitheater"></div>
        <div class="idle-name" onclick="handleLogoClick()" style="cursor:pointer">Baraja Coffee Amphitheater</div>
        <div class="idle-tagline">
            <i class="fa-solid fa-mug-hot"></i> Coffee
            <i class="fa-solid fa-utensils"></i> Eatery
            <i class="fa-solid fa-masks-theater"></i> Amphitheater
        </div>
        <div class="idle-time" id="idleClock">--:--</div>
        <div class="idle-cta"><i class="fa-regular fa-clock"></i> Menunggu pesanan berikutnya…</div>
    </div> -->

    <!-- ═══ FLOATING PARTICLES ═══ -->
    <div class="particles" id="particles"></div>

    <!-- ═══ MAIN SHELL ═══ -->
    <div class="shell">
        <!-- Running Ticker -->
        <div class="ticker-bar">
            <div class="ticker-track" id="tickerTrack"></div>
        </div>

        <div class="main-area">

            <!-- LEFT: Promo -->
            <div class="promo-panel">
                <div class="slide-progress" id="progressBar"></div>
                <div id="promoSlides" style="position:relative;width:100%;height:100%">

                    <div class="slide active">
                        <div class="slide-img"
                            style="background-image:url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1400&auto=format&fit=crop')">
                            <div class="slide-caption">
                                <span class="slide-tag">✦ Promo Minggu Ini</span>
                                <h2>Graduation Package Special</h2>
                                <p>Diskon 20% untuk pemesanan grup min. 10 orang.<br>Berlaku hingga 30 Juni 2025.</p>
                            </div>
                        </div>
                    </div>

                    <div class="slide">
                        <div class="slide-img"
                            style="background-image:url('https://images.unsplash.com/photo-1495474472201-3ce36f428904?q=80&w=1400&auto=format&fit=crop')">
                            <div class="slide-caption">
                                <span class="slide-tag">✦ Menu Baru</span>
                                <h2>New Signature Series</h2>
                                <p>Racikan spesial single origin Ethiopia &amp; Colombia.<br>Tersedia mulai hari ini.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="slide">
                        <div class="slide-img"
                            style="background-image:url('https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=1400&auto=format&fit=crop')">
                            <div class="slide-caption">
                                <span class="slide-tag">✦ Loyalty</span>
                                <h2>Kumpulkan Poin, Raih Hadiah</h2>
                                <p>Setiap transaksi memberi Anda poin eksklusif.<br>Tukar dengan minuman gratis atau
                                    merchandise.</p>
                            </div>
                        </div>
                    </div>

                    <div class="slide">
                        <div class="slide-img"
                            style="background-image:url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1400&auto=format&fit=crop')">
                            <div class="slide-caption">
                                <span class="slide-tag">✦ Happy Hour</span>
                                <h2>Happy Hour 14:00 – 17:00</h2>
                                <p>Beli 2 gratis 1 untuk semua cold brew<br>setiap hari kerja.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Event Spin Badge -->
                <button class="event-badge" onclick="openSpin()"><i class="fa-solid fa-dice"></i> Event Berhadiah — SPIN!</button>
                <div class="slide-dots" id="slideDots"></div>
            </div>

            <!-- RIGHT: Order -->
            <div class="order-panel">
                <!-- Order Title Bar -->
                <div class="order-header-top">
                    <h3><i class="fa-solid fa-receipt"></i> Pesanan Anda</h3>
                    <div class="item-count-chip">
                        <i class="fa-solid fa-basket-shopping"></i>
                        <span id="itemCountLabel">0 item</span>
                    </div>
                </div>

                <!-- Customer Info Card -->
                <div class="customer-card">
                    <div class="customer-avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div class="customer-details">
                        <div class="customer-name-text" id="customerNameText">Menunggu Pelanggan…</div>
                        <div class="customer-meta">
                            <div class="customer-meta-item">
                                <i class="fa-solid fa-table-cells-large"></i>
                                <span id="customerTableMeta">Meja: —</span>
                            </div>
                            <div class="customer-meta-item">
                                <i class="fa-solid fa-cash-register"></i>
                                <span id="customerKasirMeta">Kasir: —</span>
                            </div>
                        </div>
                    </div>
                    <div class="queue-badge-pill">
                        <span class="qbp-label"><i class="fa-solid fa-ticket"></i> Antrian</span>
                        <strong class="qbp-num" id="orderNumber">—</strong>
                    </div>
                </div>
                <!-- Order Progress Tracker -->
                <div class="order-progress" id="orderProgress">
                    <div class="progress-steps">
                        <div class="progress-fill" id="progressFill" style="width:0"></div>
                        <div class="p-step active" id="pStep0">
                            <div class="p-step-circle"><i class="fa-solid fa-pen-to-square"></i></div>
                            <span class="p-step-label">Diterima</span>
                        </div>
                        <div class="p-step" id="pStep1">
                            <div class="p-step-circle"><i class="fa-solid fa-fire-burner"></i></div>
                            <span class="p-step-label">Diproses</span>
                        </div>
                        <div class="p-step" id="pStep2">
                            <div class="p-step-circle"><i class="fa-solid fa-mug-hot"></i></div>
                            <span class="p-step-label">Siap</span>
                        </div>
                    </div>
                </div>
                <div class="order-items" id="orderItems"></div>
                <div class="summary-box">
                    <div class="sum-row"><span><i class="fa-solid fa-layer-group"></i>Subtotal</span><span id="subtotalVal">Rp 0</span></div>
                    <div class="sum-row disc" id="discountRow" style="display:none"><span><i class="fa-solid fa-tag"></i>Diskon Member 10%</span><span id="discountVal">– Rp 0</span></div>
                    <div class="sum-row"><span><i class="fa-solid fa-percent"></i>PB1 10%</span><span id="taxVal">Rp 0</span></div>
                    <div class="sum-div"></div>
                    <div class="total-row">
                        <span class="total-lbl"><i class="fa-solid fa-wallet" style="margin-right:5px;color:var(--accent)"></i>Total Bayar</span>
                        <span class="total-amt" id="totalAmount">Rp 0</span>
                    </div>
                    <div class="pay-status waiting" id="paymentStatus">
                        <div class="sdot"></div><span id="statusText">Menunggu Pembayaran</span>
                    </div>
                </div>
                <div class="qr-area" id="qrArea">
                    <div class="qr-box">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <rect x="5" y="5" width="38" height="38" rx="3" fill="none" stroke="#24311E"
                                stroke-width="4" />
                            <rect x="13" y="13" width="22" height="22" rx="1" fill="#24311E" />
                            <rect x="57" y="5" width="38" height="38" rx="3" fill="none" stroke="#24311E"
                                stroke-width="4" />
                            <rect x="65" y="13" width="22" height="22" rx="1" fill="#24311E" />
                            <rect x="5" y="57" width="38" height="38" rx="3" fill="none" stroke="#24311E"
                                stroke-width="4" />
                            <rect x="13" y="65" width="22" height="22" rx="1" fill="#24311E" />
                            <rect x="57" y="57" width="10" height="10" rx="1" fill="#24311E" />
                            <rect x="71" y="57" width="10" height="10" rx="1" fill="#24311E" />
                            <rect x="85" y="57" width="10" height="10" rx="1" fill="#24311E" />
                            <rect x="57" y="71" width="10" height="10" rx="1" fill="#24311E" />
                            <rect x="57" y="85" width="10" height="10" rx="1" fill="#24311E" />
                            <rect x="85" y="85" width="10" height="10" rx="1" fill="#24311E" />
                        </svg>
                    </div>
                    <div class="qr-info">
                        <p>Scan QRIS untuk membayar</p>
                        <small>Berlaku 15 menit · Merchant: BRJ-0041</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer-bar">
            <div>
                <div class="brand-logo" onclick="handleLogoClick()" style="cursor:pointer"><img src="icon.png" alt="Baraja">Baraja Coffee Amphitheater</div>
                <div class="brand-tag">Coffee · Eatery · Amphitheater</div>
            </div>
            <div class="f-center">
                <div class="f-stat"><span class="val" id="clockVal">--:--</span><span class="lbl">Waktu</span><span
                        class="f-date" id="dateVal"></span></div>
                <!-- <div class="f-stat"><span class="val" id="queueAhead">3</span><span class="lbl">Antrian</span></div> -->
            </div>
            <div style="display:flex;align-items:center;gap:10px">
                <div class="wifi-badge">📶 Baraja-Guest</div>
                <div class="conn-ind">
                    <div class="cdot"></div><span>Terhubung</span>
                </div>
                <div class="dev-id">BRJ-DISP-01</div>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <div class="toast-area" id="toastArea"></div>

    <!-- ═══ RECEIPT MODAL ═══ -->
    <div class="overlay" id="receiptOverlay">
        <div class="modal" style="max-height:92vh;overflow-y:auto">
            <div class="receipt-header">
                <div class="rh-logo"><img src="icon.png" alt="Baraja">Baraja Coffee Amphitheater</div>
                <div class="rh-sub">Coffee · Eatery · Amphitheater</div>
                <div class="rh-sub" style="margin-top:4px">Baraja Coffee Amphitheater</div>
                <div class="rh-txn">
                    TXN: <span id="r-txn-id">BRJ-2025-0124</span> &nbsp;|&nbsp; <span id="r-date"></span><br>
                    Kasir: <span id="r-kasir">Rania</span> &nbsp;|&nbsp; Meja: <span id="r-meja">-</span> &nbsp;|&nbsp; Antrian: <span id="r-queue">-</span>
                </div>
            </div>
            <div class="receipt-body">
                <div id="r-items-list"></div>
                <div class="r-summary">
                    <div class="r-sum-row"><span>Subtotal</span><span id="r-subtotal">Rp 0</span></div>
                    <div class="r-sum-row disc" id="r-disc-row" style="display:none"><span>Diskon Member 10%</span><span
                            id="r-disc">– Rp 0</span></div>
                    <div class="r-sum-row"><span>PB1 10%</span><span id="r-tax">Rp 0</span></div>
                    <div class="r-sum-row total"><span>Total Bayar</span><span id="r-total">Rp 0</span></div>
                    <div class="r-sum-row" style="margin-top:6px"><span>Metode Bayar</span><span
                            id="r-method">QRIS</span></div>
                    <div class="r-sum-row" id="r-pay-row" style="display:none"><span>Uang Diterima</span><span
                            id="r-pay">Rp 0</span></div>
                    <div class="r-sum-row" id="r-change-row" style="display:none;font-weight:600"><span>Kembalian</span><span
                            id="r-change">Rp 0</span></div>
                </div>
                <div class="r-footer-note">
                    Terima kasih telah mengunjungi Baraja Coffee Amphitheater ☕<br>
                    Simpan struk ini sebagai bukti transaksi Anda.<br>
                    <strong>barajacoffee.id</strong> · @barajacoffee
                </div>
            </div>

            <!-- Email Send -->
            <div class="email-area">
                <input class="email-input" type="email" id="emailInput" placeholder="Kirim struk ke email Anda…">
                <button class="btn-send" id="btnSendEmail" onclick="sendEmail()">Kirim</button>
            </div>
            <div class="email-sent-msg" id="emailSentMsg">✅ Struk berhasil dikirim ke <strong
                    id="emailSentAddr"></strong></div>

            <div class="modal-actions">
                <button class="btn-outline" onclick="closeReceipt()">Tutup</button>
                <button class="btn-primary" onclick="closeReceiptAndRate()">Lanjut Beri Rating ›</button>
            </div>
        </div>
    </div>

    <!-- ═══ RATING MODAL ═══ -->
    <div class="overlay" id="ratingOverlay">
        <div class="modal">
            <div id="ratingForm">
                <div class="rating-header">
                    <h2>Bagaimana pengalaman Anda?</h2>
                    <p>Bantu kami meningkatkan layanan untuk kunjungan berikutnya</p>
                </div>
                <div class="rating-section">
                    <h4>Rating Menu</h4>
                    <div class="stars-row" id="starsMenu"></div>
                </div>
                <div class="rating-section">
                    <h4>Rating Kasir / Pelayanan</h4>
                    <div class="stars-row" id="starsKasir"></div>
                </div>
                <div class="rating-section" style="border-bottom:none">
                    <h4>Komentar (opsional)</h4>
                    <div class="rating-note">
                        <textarea id="ratingComment" placeholder="Ceritakan pengalaman Anda…"></textarea>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-outline" onclick="closeRating()">Lewati</button>
                    <button class="btn-primary" onclick="submitRating()">Kirim Rating</button>
                </div>
            </div>
            <div class="rating-thankyou" id="ratingThankyou">
                <div class="ty-icon">🌟</div>
                <h3>Terima kasih!</h3>
                <p>Rating Anda sangat berarti bagi kami.<br>Sampai jumpa di kunjungan berikutnya!</p>
            </div>
        </div>
    </div>

    <!-- ═══ SPIN MODAL ═══ -->
    <div class="overlay" id="spinOverlay" onclick="closeSpin(event)">
        <div class="modal" onclick="event.stopPropagation()">
            <div class="spin-header">
                <div class="spin-title-tag">✦ Event Spesial Hari Ini</div>
                <h2>Lucky Spin Baraja</h2>
                <p>Putar sekali setiap transaksi — menangkan hadiah menarik!</p>
            </div>
            <div class="spin-arena">
                <div class="spin-drum-wrap">
                    <div class="drum-fade-top"></div>
                    <div class="drum-window"></div>
                    <div class="drum-fade-bot"></div>
                    <div class="drum-strip" id="drumStrip"></div>
                </div>
                <button class="btn-spin" id="btnSpin" onclick="doSpin()">🎰 Putar Sekarang!</button>
                <div class="spin-result" id="spinResult"></div>
            </div>
            <div class="modal-actions">
                <button class="btn-outline" onclick="closeSpin()">Tutup</button>
            </div>
        </div>
    </div>

    <script>
        /* ═══════════════════════════
           DATA
        ═══════════════════════════ */
        const ITEMS = [
            { id: 1, icon: '☕', name: 'Caffe Latte', note: 'Ice, Less Sugar', qty: 2, price: 28000 },
            { id: 2, icon: '🥐', name: 'Almond Croissant', note: 'Fresh baked', qty: 1, price: 32000 },
            { id: 3, icon: '🍫', name: 'Dark Choco Frappe', note: 'Extra thick, No whip', qty: 1, price: 35000 },
        ];
        const DISC_RATE = 0;
        const TAX = 0.10;

        const PRIZES = [
            '☕ Kopi Gratis', '🥐 Croissant Gratis', '💸 Diskon 15%', '🎁 Merchandise',
            '❌ Coba Lagi', '🍫 Cokelat Gratis', '💸 Diskon 10%', '🧃 Minuman Gratis',
            '❌ Lebih Beruntung', '🎟 Voucher 20k', '☕ Kopi Gratis', '💸 Diskon 5%',
        ];

        let currentOrder = { items: ITEMS, disc: DISC_RATE };
        let spinDone = false;

        /* ═══════════════════════════
           HELPERS
        ═══════════════════════════ */
        function fmt(n) { return 'Rp ' + Math.round(n).toLocaleString('id-ID') }
        function calcTotals(items, disc) {
            const sub = items.reduce((s, i) => s + i.qty * i.price, 0);
            const discAmt = Math.round(sub * disc);
            const taxable = sub - discAmt;
            const tax = Math.round(taxable * TAX);
            return { sub, discAmt, taxable, tax, total: taxable + tax };
        }

        /* ═══════════════════════════
           RENDER ORDERS
        ═══════════════════════════ */
        function renderItems(items) {
            const c = document.getElementById('orderItems');
            if (!items.length) {
                c.innerHTML = '<div class="empty-state"><div class="ei">☕</div><p>Belum ada pesanan.</p></div>'; return;
            }
            c.innerHTML = items.map((it, i) => `
    <div class="order-item" style="animation-delay:${i * 60}ms">
      <div class="item-icon">${it.icon}</div>
      <div class="item-info"><div class="item-name">${it.name}</div><div class="item-note">${it.note || '—'}</div></div>
      <div class="item-qty">${it.qty}×</div>
      <div class="item-price">${fmt(it.qty * it.price)}</div>
    </div>`).join('');
        }

        function updateSummary(items, disc = 0) {
            const { sub, discAmt, tax, total } = calcTotals(items, disc);
            document.getElementById('subtotalVal').textContent = fmt(sub);
            document.getElementById('taxVal').textContent = fmt(tax);
            document.getElementById('totalAmount').textContent = fmt(total);
            document.getElementById('itemCountLabel').textContent = `${items.reduce((s, i) => s + i.qty, 0)} item · Kasir 01`;
            const dr = document.getElementById('discountRow');
            if (disc > 0) { dr.style.display = ''; document.getElementById('discountVal').textContent = '– ' + fmt(discAmt) }
            else dr.style.display = 'none';
        }

        /* ═══════════════════════════
           PAYMENT STATUS
        ═══════════════════════════ */
        const STATUSES = [
            { cls: 'waiting', text: 'Menunggu Pembayaran', qr: false },
            { cls: 'processing', text: 'Memproses Pembayaran…', qr: true },
            { cls: 'paid', text: 'Pembayaran Berhasil ✓', qr: false },
        ];
        function setStatus(i, method) {
            const s = STATUSES[i];
            const el = document.getElementById('paymentStatus');
            el.className = 'pay-status ' + s.cls;
            
            let text = s.text;
            if (method) {
                if (i === 1) text = 'Memproses ' + method + '...';
                else if (i === 0) text = 'Menunggu Pembayaran (' + method + ')';
            }
            document.getElementById('statusText').textContent = text;
            
            // Only show QR if status allows QR AND (no method specified OR method contains QRIS)
            const isQris = !method || method.toLowerCase().includes('qris');
            document.getElementById('qrArea').classList.toggle('vis', s.qr && isQris);
        }

        /* ═══════════════════════════
           SLIDER
        ═══════════════════════════ */
        const slides = document.querySelectorAll('.slide');
        const dotsW = document.getElementById('slideDots');
        let cur = 0;
        slides.forEach((_, i) => {
            const b = document.createElement('button');
            b.className = 'dot' + (i === 0 ? ' active' : '');
            b.onclick = () => goSlide(i);
            dotsW.appendChild(b);
        });
        function goSlide(n) {
            slides[cur].classList.remove('active');
            dotsW.children[cur].classList.remove('active');
            cur = (n + slides.length) % slides.length;
            slides[cur].classList.add('active');
            dotsW.children[cur].classList.add('active');
            restartProg();
        }
        function restartProg() {
            const b = document.getElementById('progressBar');
            b.style.animation = 'none'; b.offsetWidth;
            b.style.animation = 'prog 5s linear';
        }
        restartProg();
        setInterval(() => goSlide(cur + 1), 5000);

        /* ═══════════════════════════
           TOAST
        ═══════════════════════════ */
        function showToast(icon, msg) {
            const a = document.getElementById('toastArea');
            const t = document.createElement('div');
            t.className = 'toast';
            t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
            a.appendChild(t);
            setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400) }, 3200);
        }

        /* ═══════════════════════════
           RECEIPT
        ═══════════════════════════ */
        function openReceipt(items, disc, method, table, customer, paymentAmount, changeAmount) {
            const { sub, discAmt, tax, total } = calcTotals(items, disc);
            const now = new Date();
            document.getElementById('r-txn-id').textContent = 'BRJ-2025-0' + Math.floor(100 + Math.random() * 900);
            document.getElementById('r-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('r-queue').textContent = document.getElementById('orderNumber').textContent;
            document.getElementById('r-meja').textContent = table || '-';
            // We use customer name if Kasir isn't sent, or keep Kasir 01. Actually, it's just 'Kasir 01'
            document.getElementById('r-kasir').textContent = 'Kasir 01';
            
            document.getElementById('r-items-list').innerHTML = items.map(it => `
    <div class="r-item-row">
      <span><span class="r-item-name">${it.name}</span><br><span class="r-item-qty">${it.qty}× @ ${fmt(it.price)}</span></span>
      <span class="r-item-price">${fmt(it.qty * it.price)}</span>
    </div>`).join('');
            document.getElementById('r-subtotal').textContent = fmt(sub);
            document.getElementById('r-tax').textContent = fmt(tax);
            document.getElementById('r-total').textContent = fmt(total);
            document.getElementById('r-method').textContent = method || 'Cash';
            const dr = document.getElementById('r-disc-row');
            if (disc > 0) { dr.style.display = ''; document.getElementById('r-disc').textContent = '– ' + fmt(discAmt) }
            else dr.style.display = 'none';
            
            // Handle Payment Amount and Change
            const pr = document.getElementById('r-pay-row');
            const cr = document.getElementById('r-change-row');
            if (paymentAmount != null && paymentAmount > 0) {
                pr.style.display = '';
                document.getElementById('r-pay').textContent = fmt(paymentAmount);
                if (changeAmount != null && changeAmount > 0) {
                    cr.style.display = '';
                    document.getElementById('r-change').textContent = fmt(changeAmount);
                } else {
                    cr.style.display = 'none';
                }
            } else {
                pr.style.display = 'none';
                cr.style.display = 'none';
            }

            document.getElementById('emailSentMsg').style.display = 'none';
            document.getElementById('emailInput').value = '';
            document.getElementById('btnSendEmail').disabled = false;
            document.getElementById('receiptOverlay').classList.add('show');
        }
        function closeReceipt() { document.getElementById('receiptOverlay').classList.remove('show') }
        function closeReceiptAndRate() { closeReceipt(); setTimeout(openRating, 300); }
        function sendEmail() {
            const inp = document.getElementById('emailInput');
            const addr = inp.value.trim();
            if (!addr || !addr.includes('@')) { showToast('⚠️', 'Masukkan alamat email yang valid'); return }
            const btn = document.getElementById('btnSendEmail');
            btn.textContent = 'Mengirim…'; btn.disabled = true;
            setTimeout(() => {
                document.getElementById('emailSentMsg').style.display = 'block';
                document.getElementById('emailSentAddr').textContent = addr;
                btn.textContent = 'Terkirim ✓';
                showToast('📧', 'Struk dikirim ke ' + addr);
            }, 1600);
        }

        /* ═══════════════════════════
           RATING
        ═══════════════════════════ */
        function makeStars(containerId) {
            const c = document.getElementById(containerId);
            let val = 0;
            const stars = [];
            for (let i = 1; i <= 5; i++) {
                const s = document.createElement('span');
                s.className = 'star'; s.textContent = '★'; s.dataset.v = i;
                s.onmouseenter = () => stars.forEach((x, j) => x.classList.toggle('lit', j < i));
                s.onmouseleave = () => stars.forEach((x, j) => x.classList.toggle('lit', j < val));
                s.onclick = () => { val = i; stars.forEach((x, j) => x.classList.toggle('lit', j < i)) };
                c.appendChild(s); stars.push(s);
            }
            return () => val;
        }
        let getMenuRating, getKasirRating;
        function openRating() {
            document.getElementById('ratingForm').style.display = '';
            document.getElementById('ratingThankyou').style.display = 'none';
            document.getElementById('starsMenu').innerHTML = '';
            document.getElementById('starsKasir').innerHTML = '';
            getMenuRating = makeStars('starsMenu');
            getKasirRating = makeStars('starsKasir');
            document.getElementById('ratingComment').value = '';
            document.getElementById('ratingOverlay').classList.add('show');
        }
        function closeRating() { document.getElementById('ratingOverlay').classList.remove('show') }
        function submitRating() {
            const m = getMenuRating(), k = getKasirRating();
            if (!m || !k) { showToast('⚠️', 'Pilih rating bintang terlebih dahulu'); return }
            document.getElementById('ratingForm').style.display = 'none';
            document.getElementById('ratingThankyou').style.display = 'block';
            showToast('🌟', 'Rating Anda telah tersimpan. Terima kasih!');
            setTimeout(closeRating, 3500);
        }

        /* ═══════════════════════════
           SPIN WHEEL (DRUM ROLLER)
        ═══════════════════════════ */
        const CELL_H = 48;
        let spinning = false;
        let prizeIdx = null;

        function buildDrum() {
            const strip = document.getElementById('drumStrip');
            strip.innerHTML = '';
            const loop = [...PRIZES, ...PRIZES, ...PRIZES];
            loop.forEach(p => {
                const d = document.createElement('div');
                d.className = 'drum-cell'; d.textContent = p;
                strip.appendChild(d);
            });
            strip.style.transform = 'translateY(0px)';
        }
        function openSpin() {
            buildDrum(); spinDone = false;
            document.getElementById('btnSpin').disabled = false;
            document.getElementById('btnSpin').textContent = '🎰 Putar Sekarang!';
            document.getElementById('spinResult').textContent = '';
            document.getElementById('spinResult').className = 'spin-result';
            document.getElementById('spinOverlay').classList.add('show');
        }
        function closeSpin(e) {
            if (e && e.target !== document.getElementById('spinOverlay')) return;
            document.getElementById('spinOverlay').classList.remove('show');
        }
        function doSpin() {
            if (spinning || spinDone) return;
            spinning = true;
            document.getElementById('btnSpin').disabled = true;
            document.getElementById('btnSpin').textContent = 'Berputar…';
            document.getElementById('spinResult').textContent = '';
            const strip = document.getElementById('drumStrip');
            const winIndex = Math.floor(Math.random() * PRIZES.length) + PRIZES.length;
            prizeIdx = winIndex % PRIZES.length;
            const VISIBLE_ROWS = Math.floor(160 / CELL_H);
            const centerOffset = Math.floor(VISIBLE_ROWS / 2);
            const targetPx = -(winIndex - centerOffset) * CELL_H;
            const totalSpinCells = PRIZES.length * 4 + winIndex - centerOffset;
            const totalPx = -totalSpinCells * CELL_H;
            const DURATION = 3200;
            let start = null;
            function easeOut(t) { return 1 - Math.pow(1 - t, 4) }
            function animate(ts) {
                if (!start) start = ts;
                const elapsed = ts - start;
                const progress = Math.min(elapsed / DURATION, 1);
                const eased = easeOut(progress);
                strip.style.transform = `translateY(${eased * totalPx}px)`;
                if (progress < 1) { requestAnimationFrame(animate) }
                else { strip.style.transform = `translateY(${targetPx}px)`; finishSpin(); }
            }
            requestAnimationFrame(animate);
        }
        function finishSpin() {
            spinning = false; spinDone = true;
            const prize = PRIZES[prizeIdx];
            const isWin = !prize.includes('❌');
            const res = document.getElementById('spinResult');
            res.textContent = isWin ? `🎉 Selamat! Anda mendapat: ${prize}` : `😅 ${prize} — Semoga lebih beruntung!`;
            res.className = 'spin-result' + (isWin ? ' won' : '');
            document.getElementById('btnSpin').textContent = 'Sudah Diputar';
            if (isWin) showToast('🎉', 'Selamat! Hadiah: ' + prize);
            else showToast('😅', 'Coba lagi di transaksi berikutnya');
        }

        /* ═══════════════════════════
           CLOCK + DATE
        ═══════════════════════════ */
        function tick() {
            const now = new Date();
            document.getElementById('clockVal').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            document.getElementById('dateVal').textContent = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
            const idleClock = document.getElementById('idleClock');
            if (idleClock) idleClock.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }
        tick(); setInterval(tick, 1000);

        /* ═══════════════════════════
           FLOATING PARTICLES
        ═══════════════════════════ */
        function createParticles() {
            const container = document.getElementById('particles');
            const leaves = ['🍃', '🌿', '☘️', '✦', '·'];
            for (let i = 0; i < 12; i++) {
                const leaf = document.createElement('div');
                leaf.className = 'leaf';
                leaf.textContent = leaves[Math.floor(Math.random() * leaves.length)];
                leaf.style.left = Math.random() * 100 + '%';
                leaf.style.fontSize = (10 + Math.random() * 12) + 'px';
                leaf.style.animationDuration = (18 + Math.random() * 25) + 's';
                leaf.style.animationDelay = (Math.random() * 20) + 's';
                container.appendChild(leaf);
            }
        }
        createParticles();

        /* ═══════════════════════════
           RUNNING TICKER
        ═══════════════════════════ */
        function buildTicker() {
            const msgs = [
                '<i class="fa-solid fa-mug-hot"></i> Selamat datang di Baraja Coffee Amphitheater',
                '<i class="fa-solid fa-leaf"></i> Nikmati kopi pilihan dari biji terbaik Nusantara',
                '<i class="fa-solid fa-wifi"></i> WiFi: acaradibaraja',
                '<i class="fa-solid fa-music"></i> Baraja event GRATIS setiap hari',
                '<i class="fa-regular fa-clock"></i> Jam Buka: 08:00 — 23:00 WIB',
                '<i class="fa-solid fa-gift"></i> Spin berhadiah setiap transaksi min. Rp 500.000',
                '<i class="fa-brands fa-instagram"></i> Follow @barajacoffee untuk info promo terkini',
            ];
            const track = document.getElementById('tickerTrack');
            const allMsgs = [...msgs, ...msgs];
            track.innerHTML = allMsgs.map(m => `<span class="ticker-item"><span class="ti-dot"></span>${m}</span>`).join('');
        }
        buildTicker();

        /* ═══════════════════════════
           ORDER PROGRESS TRACKER
        ═══════════════════════════ */
        function setProgress(step) {
            const steps = [0, 1, 2];
            const fillWidths = ['0%', '50%', '100%'];
            document.getElementById('progressFill').style.width = fillWidths[step] || '0%';
            steps.forEach(i => {
                const el = document.getElementById('pStep' + i);
                if (el) {
                    el.classList.remove('active', 'done');
                    if (i < step) el.classList.add('done');
                    else if (i === step) el.classList.add('active');
                }
            });
        }

        /* ═══════════════════════════
           IDLE SCREEN
        ═══════════════════════════ */
        function hideIdle() {
            document.getElementById('idleScreen').classList.add('hidden');
        }
        function showIdle() {
            document.getElementById('idleScreen').classList.remove('hidden');
        }

        /* ═══════════════════════════
           API POLLING
        ═══════════════════════════ */
        let lastTimestamp = 0;
        let isReceiptOpen = false;
        
        const urlParams = new URLSearchParams(window.location.search);
        const deviceParam = urlParams.get('device') || 'default';

        async function fetchState() {
            try {
                const response = await fetch('api.php?device=' + deviceParam);
                const data = await response.json();
                
                // Jika timestamp baru, atau keranjang kosong
                if (data.timestamp > lastTimestamp || data.items.length === 0) {
                    lastTimestamp = data.timestamp;

                    if (!data.items || data.items.length === 0) {
                        showIdle();
                        isReceiptOpen = false;
                        closeReceipt();
                    } else {
                        hideIdle();
                        renderItems(data.items);
                        updateSummary(data.items, data.discount_rate || 0);
                        
                        const customerName = data.customer_name || '-';
                        const tableName = data.table_name || '-';
                        const customerLabel = document.getElementById('customerInfoLabel');
                        if (customerLabel) {
                            customerLabel.textContent = 'Atas Nama: ' + customerName + ' · Meja: ' + tableName;
                        }

                        setStatus(data.status || 0, data.payment_method);
                        setProgress(data.status || 0);
                        
                        const badgeStr = document.querySelector('.order-num-badge strong');
                        if (badgeStr) badgeStr.textContent = data.order_number || '-';

                        if (data.status === 2 && !isReceiptOpen) {
                            isReceiptOpen = true;
                            showToast('✅', 'Pembayaran berhasil! Pesanan sedang disiapkan.');
                            setTimeout(() => openReceipt(data.items, data.discount_rate || 0, data.payment_method, data.table_name, data.customer_name, data.payment_amount, data.change_amount), 2000);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching state:", error);
            }
        }

        setInterval(fetchState, 1000);
        fetchState();
    </script>
    <!-- Device Selector Button -->
    <div class="device-btn" onclick="openDeviceSelector()">
        ⚙️ <span id="currentDeviceLabel">Device</span>
    </div>

    <!-- Device Selector Modal -->
    <div class="overlay" id="deviceOverlay">
        <div class="modal" style="max-width:400px; text-align:center;">
            <h2 style="margin:0 0 10px 0; color:var(--text-primary); font-family:'Fraunces'">Pilih Tablet Kasir</h2>
            <p style="color:var(--text-secondary); font-size:0.95rem; margin-bottom:20px;">
                Pilih device kasir mana yang ingin ditampilkan pada layar monitor ini.
            </p>
            <div class="device-list" id="deviceList">
                Memuat daftar device...
            </div>
            <div class="modal-buttons" style="margin-top:20px">
                <button class="btn btn-outline" style="width:100%" onclick="closeDeviceSelector()">Batal</button>
            </div>
        </div>
    </div>

    <script>
        let logoClickCount = 0;
        let logoClickTimeout;
        function handleLogoClick() {
            logoClickCount++;
            clearTimeout(logoClickTimeout);
            if (logoClickCount >= 5) {
                logoClickCount = 0;
                openDeviceSelector();
            } else {
                logoClickTimeout = setTimeout(() => { logoClickCount = 0; }, 2000);
            }
        }

        document.getElementById('currentDeviceLabel').textContent = deviceParam;

        function openDeviceSelector() {
            document.getElementById('deviceOverlay').classList.add('show');
            loadDevices();
        }

        function closeDeviceSelector() {
            document.getElementById('deviceOverlay').classList.remove('show');
        }

        async function loadDevices() {
            const list = document.getElementById('deviceList');
            try {
                const response = await fetch('api.php?action=list_devices');
                const data = await response.json();
                if (data.status === 'success') {
                    if (data.devices.length === 0) {
                        list.innerHTML = '<div style="padding:20px; color:var(--caramel)">Belum ada device aktif.<br>Silakan lakukan transaksi pertama dari aplikasi kasir.</div>';
                    } else {
                        list.innerHTML = data.devices.map(d => `
                            <div class="device-option ${d === deviceParam ? 'active' : ''}" onclick="selectDevice('${d}')">
                                <span>📱 ${d}</span>
                                ${d === deviceParam ? '<span>✓</span>' : ''}
                            </div>
                        `).join('');
                    }
                } else {
                    list.innerHTML = '<div style="color:red">Gagal memuat daftar device</div>';
                }
            } catch (e) {
                list.innerHTML = '<div style="color:red">Koneksi terputus</div>';
            }
        }

        function selectDevice(dev) {
            window.location.href = '?device=' + dev;
        }

        // Auto-open device selector removed because api.php now auto-resolves 'default'
    </script>

    <!-- ═══ BOOTSTRAP 5 JS + POPPER ═══ -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>

    <!-- ═══ SWEETALERT2 ═══ -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <!-- ═══ GSAP (animasi lanjutan) ═══ -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>

    <!-- ═══ LUXON (date/time handling) ═══ -->
    <script src="https://cdn.jsdelivr.net/npm/luxon@3.5.0/build/global/luxon.min.js"></script>

    <!-- ═══ NUMERAL.JS (format angka/mata uang) ═══ -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js"></script>

    <script>
        /* ═══════════════════════════════════════
           INISIALISASI LIBRARY TAMBAHAN
        ═══════════════════════════════════════ */

        // Bootstrap Tooltips — aktifkan semua tooltip di halaman
        document.addEventListener('DOMContentLoaded', function () {
            const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            tooltipEls.forEach(el => new bootstrap.Tooltip(el));

            // Bootstrap Popovers
            const popoverEls = document.querySelectorAll('[data-bs-toggle="popover"]');
            popoverEls.forEach(el => new bootstrap.Popover(el));
        });

        // GSAP entrance animation untuk shell utama
        document.addEventListener('DOMContentLoaded', function () {
            gsap.from('.shell', { opacity: 0, y: 16, duration: 0.7, ease: 'power2.out' });
            gsap.from('.ticker-bar', { opacity: 0, y: -10, duration: 0.5, delay: 0.2, ease: 'power2.out' });
            gsap.from('.promo-panel', { opacity: 0, x: -20, duration: 0.6, delay: 0.35, ease: 'power2.out' });
            gsap.from('.order-panel', { opacity: 0, x: 20, duration: 0.6, delay: 0.35, ease: 'power2.out' });
            gsap.from('.footer-bar', { opacity: 0, y: 10, duration: 0.5, delay: 0.5, ease: 'power2.out' });
        });

        // Luxon — update jam dengan format lebih kaya jika dibutuhkan
        // Contoh penggunaan: const dt = luxon.DateTime.now().setLocale('id').toFormat('cccc, d MMMM yyyy');

        // Numeral.js — helper format rupiah yang bisa digunakan sebagai alternatif
        // Contoh: numeral(28000).format('0,0') → "28,000"
    </script>
</body>

</html>