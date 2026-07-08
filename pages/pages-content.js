/* ═══════════════════════════════════════════════════════════════════════════
   EVENTU — content pages (About / How it works / FAQ), UA/EN.

   Rendered by pages.js into the thin shells pro-nas.html / jak-to-funguje.html /
   faq.html. FAQ is a structured array so the same data renders the accordion AND
   a FAQPage JSON-LD (rich result in Google).
═══════════════════════════════════════════════════════════════════════════ */
window.PAGES = (function () {
    'use strict';

    const M = {
        brand:   'Eventu',
        op:      'ФОП Бокова Юлія Василівна',
        phone:   '+380 800 105 105',
        email:   'example111@gmail.com',
        address: 'м. Ужгород, Україна',
    };

    const pages = {

        /* ───────────────────────────── ABOUT ─────────────────────────────── */
        about: {
            title: { ua: 'Про нас', en: 'About Us' },
            body: {
                ua: `
<p class="lead">${M.brand} — платформа онлайн-бронювання квитків на університетські заходи: лекції, концерти, конференції, спортивні події, театральні постановки та воркшопи.</p>

<h2>Що ми робимо</h2>
<p>Ми зібрали всі студентські заходи в одному місці: зручна афіша з фільтром за категоріями, бронювання квитка у кілька кліків і персональний код квитка прямо на екрані чи в Telegram — без паперових списків і черг.</p>

<h2>Чому Eventu</h2>
<ul>
<li><strong>Місця неможливо перепродати</strong> — атомарна резервація гарантує, що одне місце дістанеться лише одному гостю.</li>
<li><strong>Один квиток на акаунт</strong> — захист від скуповування місць: кожен користувач бронює максимум один квиток на подію.</li>
<li><strong>Дві мови</strong> — інтерфейс і документи українською та англійською.</li>
<li><strong>Швидкий вхід</strong> — email і пароль або обліковий запис Google.</li>
<li><strong>Telegram-бот</strong> — перегляд подій, бронювання та сповіщення просто в месенджері.</li>
</ul>

<h2>Для організаторів</h2>
<p>Організатори мають живу панель (CRM) із дошкою бронювань у реальному часі, керуванням власними подіями, перевіркою присутності за кодом квитка та сповіщеннями про кожне нове бронювання в Telegram-групу події.</p>

<p>Маєте питання? Напишіть на <a href="mailto:${M.email}">${M.email}</a> або зателефонуйте ${M.phone}.</p>
`,
                en: `
<p class="lead">${M.brand} is a platform for online ticket booking to university events: lectures, concerts, conferences, sport, theatre and workshops.</p>

<h2>What we do</h2>
<p>We bring every campus event into one place: a convenient poster with category filters, ticket booking in a few clicks, and a personal ticket code right on your screen or in Telegram — no paper lists, no queues.</p>

<h2>Why Eventu</h2>
<ul>
<li><strong>Seats can never be oversold</strong> — atomic reservation guarantees a seat goes to exactly one guest.</li>
<li><strong>One ticket per account</strong> — anti-hoarding: each user books at most one ticket per event.</li>
<li><strong>Two languages</strong> — interface and documents in Ukrainian and English.</li>
<li><strong>Fast sign-in</strong> — email and password or a Google account.</li>
<li><strong>Telegram bot</strong> — browse events, book and get notifications right in the messenger.</li>
</ul>

<h2>For organizers</h2>
<p>Organizers get a live panel (CRM) with a real-time booking board, management of their own events, attendance check-in by ticket code, and a notification to the event's Telegram group for every new booking.</p>

<p>Have a question? Email <a href="mailto:${M.email}">${M.email}</a> or call ${M.phone}.</p>
`,
            },
        },

        /* ──────────────────────── HOW IT WORKS ────────────────────────────── */
        how: {
            title: { ua: 'Як це працює', en: 'How It Works' },
            body: {
                ua: `
<p class="lead">Від вибору заходу до квитка — у кілька простих кроків.</p>
<ol class="steps">
<li><strong>Оберіть захід.</strong> Перегляньте афішу, скористайтеся фільтром за категоріями та відкрийте потрібну подію.</li>
<li><strong>Забронюйте квиток.</strong> Натисніть «Забронювати», вкажіть ім'я, email і телефон, підтвердіть згоду.</li>
<li><strong>Отримайте код.</strong> Система видасть унікальний код квитка формату <code>EVT-XXXXXXXX</code> — збережіть його.</li>
<li><strong>Дочекайтеся підтвердження.</strong> Організатор підтвердить бронювання; статус зміниться на «Підтверджено».</li>
<li><strong>Приходьте на захід.</strong> На вході покажіть код квитка — організатор відмітить вашу присутність.</li>
</ol>
<p>Бронювати можна й через <strong>Telegram-бот</strong>. Діє правило: один акаунт — один квиток на подію. <a href="../index.html">До афіші →</a></p>
`,
                en: `
<p class="lead">From picking an event to a ticket — in a few simple steps.</p>
<ol class="steps">
<li><strong>Choose an event.</strong> Browse the poster, use the category filter and open the event you want.</li>
<li><strong>Book a ticket.</strong> Tap “Book”, enter your name, email and phone, and confirm consent.</li>
<li><strong>Get your code.</strong> The system issues a unique ticket code like <code>EVT-XXXXXXXX</code> — keep it.</li>
<li><strong>Wait for confirmation.</strong> The organizer confirms the booking; the status changes to “Confirmed”.</li>
<li><strong>Come to the event.</strong> Show your ticket code at the door — the organizer marks your attendance.</li>
</ol>
<p>You can also book via the <strong>Telegram bot</strong>. The rule: one account — one ticket per event. <a href="../index.html">Go to the poster →</a></p>
`,
            },
        },

        /* ───────────────────────────── FAQ ───────────────────────────────── */
        faq: {
            title: { ua: 'Часті запитання', en: 'FAQ' },
            items: {
                ua: [
                    { q: 'Скільки коштує квиток?', a: 'Залежить від заходу — ціна вказана біля кожної події. Багато університетських подій безкоштовні (вхід за бронюванням).' },
                    { q: 'Як забронювати квиток?', a: 'Оберіть подію, натисніть «Забронювати», вкажіть ім\'я, email і телефон, підтвердіть згоду — і отримаєте унікальний код квитка.' },
                    { q: 'Чи можна забронювати кілька квитків?', a: 'Один акаунт може забронювати лише один квиток на конкретну подію — так ми не даємо одному користувачеві скупити всі місця.' },
                    { q: 'Що таке код квитка?', a: 'Це унікальний код формату EVT-XXXXXXXX, який ви отримуєте після бронювання. Покажіть його на вході — організатор відмітить вашу присутність.' },
                    { q: 'Які бувають статуси бронювання?', a: 'Заброньовано → Підтверджено (організатором) → Відвідано. Окремо — Скасовано (місце повертається до події).' },
                    { q: 'Чи можна увійти через Google?', a: 'Так. Доступні вхід і реєстрація через обліковий запис Google, а також класичний вхід за email і паролем.' },
                    { q: 'Чи є Telegram-бот?', a: 'Так. У боті можна переглядати заходи, бронювати квитки та отримувати сповіщення про зміну статусу бронювання.' },
                    { q: 'Як скасувати бронювання?', a: 'Зверніться до організатора заходу — після скасування місце повертається й може бути заброньоване знову.' },
                    { q: 'Не приходять сповіщення на email?', a: 'Перевірте теку «Спам». Сповіщення надсилаються за принципом best-effort і не блокують роботу сайту.' },
                    { q: 'Як з вами зв\'язатися?', a: `Напишіть на ${M.email} або зателефонуйте ${M.phone}.` },
                ],
                en: [
                    { q: 'How much does a ticket cost?', a: 'It depends on the event — the price is shown next to each one. Many university events are free (entry by booking).' },
                    { q: 'How do I book a ticket?', a: 'Pick an event, tap “Book”, enter your name, email and phone, confirm consent — and you get a unique ticket code.' },
                    { q: 'Can I book several tickets?', a: 'One account may book only one ticket per event — this prevents a single user from grabbing all the seats.' },
                    { q: 'What is a ticket code?', a: 'A unique code like EVT-XXXXXXXX issued after booking. Show it at the door and the organizer marks your attendance.' },
                    { q: 'What booking statuses are there?', a: 'Reserved → Confirmed (by the organizer) → Attended. Separately — Cancelled (the seat returns to the event).' },
                    { q: 'Can I sign in with Google?', a: 'Yes. Sign-in and registration via a Google account are available, as well as classic email-and-password login.' },
                    { q: 'Is there a Telegram bot?', a: 'Yes. In the bot you can browse events, book tickets and receive booking-status notifications.' },
                    { q: 'How do I cancel a booking?', a: 'Contact the event organizer — once cancelled, the seat returns and can be booked again.' },
                    { q: 'I don’t receive email notifications?', a: 'Check your Spam folder. Notifications are best-effort and never block the website.' },
                    { q: 'How can I contact you?', a: `Email ${M.email} or call ${M.phone}.` },
                ],
            },
        },
    };

    return { meta: M, pages };
})();
