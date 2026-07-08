/* ═══════════════════════════════════════════════════════════════════════════
   EVENTU — legal documents content, UA/EN.

   Operator is a Ukrainian sole proprietor (ФОП). Four documents rendered by
   legal.js: Terms of Use, Privacy Policy (ЗУ «Про захист персональних даних»),
   Cookie Policy, and a Complaints / Appeals channel.
═══════════════════════════════════════════════════════════════════════════ */
window.LEGAL = (function () {
    'use strict';

    const M = {
        brand:   'Eventu',
        url:     'https://nikaaaxs.github.io/Eventu/',
        phone:   '+380 800 105 105',
        email:   'example111@gmail.com',
        op: {
            ua: 'Фізична особа-підприємець Бокова Юлія Василівна',
            en: 'Yuliia Bokova — sole proprietor (FOP), Ukraine',
        },
        addr: {
            ua: '88000, Україна, м. Ужгород',
            en: '88000, Uzhhorod, Ukraine',
        },
        updated: { ua: '4 липня 2026 р.', en: 'July 4, 2026' },
    };

    const docs = {

        /* ───────────────────────────── 1. TERMS OF USE ───────────────────────── */
        podminky: {
            title: { ua: 'Умови користування сайтом', en: 'Terms of Use' },
            body: {
                ua: `
<h2>1. Загальні положення</h2>
<p>Ці умови регулюють користування вебсайтом ${M.url} (далі — «сайт»), власником якого є ${M.op.ua}, ${M.addr.ua} (далі — «оператор»). Користуючись сайтом, ви погоджуєтеся з цими умовами.</p>

<h2>2. Характер сервісу</h2>
<p>${M.brand} — платформа онлайн-бронювання квитків на університетські та студентські заходи. Оператор надає технічну можливість перегляду афіші та бронювання місць; безпосереднім організатором конкретного заходу є відповідний організатор (кафедра, студентська організація тощо). Бронювання квитка не є придбанням товару в оператора.</p>

<h2>3. Обліковий запис</h2>
<p>Окремі функції (перегляд «Моїх квитків», відгуки) потребують входу — за email і паролем або через обліковий запис Google. Зазначені дані мають бути правдивими. За збереження конфіденційності даних для входу відповідає користувач.</p>

<h2>4. Правила користування</h2>
<ul>
<li>не зазначати неправдиві, неповні або чужі персональні дані;</li>
<li>не розміщувати протиправний, образливий, оманливий чи спам-контент;</li>
<li>не втручатися в роботу сайту й не збирати дані автоматизовано;</li>
<li>використовувати сайт лише за призначенням.</li>
</ul>

<h2>5. Бронювання квитків</h2>
<ul>
<li>один акаунт може забронювати <strong>не більше одного квитка</strong> на конкретну подію;</li>
<li>після бронювання видається унікальний <strong>код квитка</strong>, який пред'являється на вході;</li>
<li>бронювання підтверджує організатор заходу; статус відображається в розділі «Мої квитки»;</li>
<li>участь у заході може бути безкоштовною або платною — умови вказано біля кожної події;</li>
<li>перепродаж або передача заброньованих квитків третім особам не допускається.</li>
</ul>

<h2>6. Інтелектуальна власність</h2>
<p>Вміст сайту (тексти, графіка, логотип, структура) належить оператору або його партнерам і охороняється авторським правом. Копіювання чи комерційне використання без згоди заборонено.</p>

<h2>7. Посилання третіх сторін</h2>
<p>Сайт може містити посилання на сторонні ресурси (соцмережі, Telegram). Оператор не відповідає за їхній вміст і доступність.</p>

<h2>8. Обмеження відповідальності</h2>
<p>Оператор докладає розумних зусиль для точності інформації, але не гарантує її повноти чи безперебійної роботи сайту й не відповідає за проведення, зміст чи скасування заходів організаторами в межах, дозволених законом.</p>

<h2>9. Зміни умов</h2>
<p>Оператор може змінювати ці умови; нова редакція діє з моменту публікації на сайті.</p>

<h2>10. Застосовне право</h2>
<p>Ці умови регулюються правом України. Спори підлягають розгляду судами України.</p>

<h2>11. Контакти</h2>
<p>${M.op.ua}<br>${M.addr.ua}<br>E-mail: ${M.email} · Тел.: ${M.phone}</p>
<p class="legal-meta">Чинні з ${M.updated.ua}</p>
`,
                en: `
<h2>1. Introduction</h2>
<p>These Terms govern the use of the website ${M.url} (the “Website”), owned by ${M.op.en}, ${M.addr.en} (the “Operator”). By using the Website you agree to these Terms.</p>

<h2>2. Nature of the service</h2>
<p>${M.brand} is a platform for online ticket booking to university and student events. The Operator provides the technical means to browse the poster and reserve seats; the event itself is run by its respective organizer (a department, a student body, etc.). Booking a ticket is not a purchase of goods from the Operator.</p>

<h2>3. User account</h2>
<p>Some features (“My tickets”, reviews) require signing in — by email and password or via a Google account. The data provided must be true. The user is responsible for keeping login credentials confidential.</p>

<h2>4. Rules of use</h2>
<ul>
<li>do not provide false, incomplete or third-party personal data;</li>
<li>do not post unlawful, offensive, misleading or spam content;</li>
<li>do not interfere with the Website or scrape data;</li>
<li>use the Website only as intended.</li>
</ul>

<h2>5. Ticket booking</h2>
<ul>
<li>one account may book <strong>no more than one ticket</strong> per event;</li>
<li>after booking, a unique <strong>ticket code</strong> is issued and shown at the door;</li>
<li>the booking is confirmed by the event organizer; the status is shown under “My tickets”;</li>
<li>attendance may be free or paid — the terms are shown next to each event;</li>
<li>reselling or transferring booked tickets to third parties is not allowed.</li>
</ul>

<h2>6. Intellectual property</h2>
<p>The Website content (text, graphics, logo, structure) belongs to the Operator or its partners and is protected by copyright. Copying or commercial use without consent is prohibited.</p>

<h2>7. Third-party links</h2>
<p>The Website may link to third-party sites (social networks, Telegram). The Operator is not responsible for their content or availability.</p>

<h2>8. Disclaimer</h2>
<p>The Operator strives for accuracy but does not warrant completeness or uninterrupted availability, and is not liable for the running, content or cancellation of events by organizers, to the extent permitted by law.</p>

<h2>9. Changes</h2>
<p>The Operator may amend these Terms; the new version applies from publication on the Website.</p>

<h2>10. Governing law</h2>
<p>These Terms are governed by the law of Ukraine. Disputes are resolved by the courts of Ukraine.</p>

<h2>11. Contact</h2>
<p>${M.op.en}<br>${M.addr.en}<br>Email: ${M.email} · Phone: ${M.phone}</p>
<p class="legal-meta">Effective from ${M.updated.en}.</p>
`,
            },
        },

        /* ─────────────────── 2. PRIVACY POLICY ───────────────────────────────── */
        ochranaUdaju: {
            title: { ua: 'Політика конфіденційності', en: 'Privacy Policy' },
            body: {
                ua: `
<p>Ця політика описує, як ${M.op.ua} обробляє персональні дані відповідно до Закону України «Про захист персональних даних» № 2297-VI.</p>

<h2>1. Володілець персональних даних</h2>
<p>${M.op.ua}, ${M.addr.ua}. Контакт із питань даних: ${M.email}, тел. ${M.phone}.</p>

<h2>2. Які дані ми обробляємо</h2>
<ul>
<li><strong>Ідентифікаційні та контактні:</strong> ім'я та прізвище, e-mail, телефон;</li>
<li><strong>Дані бронювання:</strong> обраний захід, код квитка, статус, коментар;</li>
<li><strong>Надісланий вами контент:</strong> відгуки;</li>
<li><strong>Технічні:</strong> IP-адреса, cookies (див. <a href="cookies.html">Політику cookies</a>).</li>
</ul>

<h2>3. Мета та правові підстави</h2>
<ul>
<li><strong>Оброблення бронювань</strong> та надсилання сповіщень про їх статус — для надання послуги та на підставі вашої згоди;</li>
<li><strong>Ведення облікового запису</strong> й перегляд власних бронювань;</li>
<li><strong>Виконання обов'язків</strong>, передбачених законом.</li>
</ul>
<p>Згоду можна відкликати будь-коли, написавши на ${M.email}.</p>

<h2>4. Кому передаються дані</h2>
<p>Дані бронювання передаються <strong>організаторові відповідного заходу</strong> для обліку та підтвердження присутності, а також постачальникам послуг як розпорядникам: хостинг застосунку та бази даних, надсилання e-mail, месенджер Telegram, вхід через Google, зберігання зображень. Органам влади — лише у випадках, передбачених законом.</p>

<h2>5. Постачальники за межами України</h2>
<p>Окремі технічні постачальники (хостинг, e-mail, Google, Telegram) можуть опрацьовувати дані на серверах за кордоном. Ми обираємо провайдерів, що вживають належних заходів захисту, і передаємо лише дані, потрібні для надання послуги.</p>

<h2>6. Строк зберігання</h2>
<p>Дані зберігаються протягом часу, потрібного для мети обробки (як правило, до 1 року від останньої активності), або довше, якщо цього вимагає закон. Після цього вони видаляються або знеособлюються.</p>

<h2>7. Ваші права</h2>
<p>Ви маєте право знати про обробку, отримати доступ до своїх даних, вимагати їх зміни чи видалення, відкликати згоду та подати скаргу до <strong>Уповноваженого Верховної Ради України з прав людини</strong> (ombudsman.gov.ua). Запити надсилайте на ${M.email}.</p>

<h2>8. Безпека</h2>
<p>Ми застосовуємо розумні технічні та організаційні заходи (шифрування HTTPS, хешування паролів, контроль доступу) для захисту даних від несанкціонованого доступу, втрати чи зловживання.</p>

<p class="legal-meta">Чинна з ${M.updated.ua}</p>
`,
                en: `
<p>This policy describes how ${M.op.en} processes personal data under Ukraine's Law “On Personal Data Protection” No. 2297-VI.</p>

<h2>1. Data controller</h2>
<p>${M.op.en}, ${M.addr.en}. Data contact: ${M.email}, phone ${M.phone}.</p>

<h2>2. What data we process</h2>
<ul>
<li><strong>Identification and contact:</strong> name, email, phone;</li>
<li><strong>Booking data:</strong> chosen event, ticket code, status, comment;</li>
<li><strong>Content you send:</strong> reviews;</li>
<li><strong>Technical:</strong> IP address, cookies (see <a href="cookies.html">Cookie Policy</a>).</li>
</ul>

<h2>3. Purposes and legal basis</h2>
<ul>
<li><strong>Processing bookings</strong> and sending status notifications — to provide the service and based on your consent;</li>
<li><strong>Account management</strong> and viewing your own bookings;</li>
<li><strong>Compliance</strong> with legal obligations.</li>
</ul>
<p>Consent may be withdrawn at any time by writing to ${M.email}.</p>

<h2>4. Who we share data with</h2>
<p>Booking data is shared with the <strong>organizer of the relevant event</strong> for attendance and confirmation, and with service providers acting as processors: application and database hosting, email delivery, the Telegram messenger, Google sign-in, and image storage. With authorities — only where required by law.</p>

<h2>5. Providers outside Ukraine</h2>
<p>Some technical providers (hosting, email, Google, Telegram) may process data on servers abroad. We choose providers with appropriate safeguards and transfer only the data needed to provide the service.</p>

<h2>6. Retention</h2>
<p>We keep data for as long as necessary for the purpose (typically up to 1 year from the last activity) or longer if required by law, after which it is deleted or anonymised.</p>

<h2>7. Your rights</h2>
<p>You have the right to be informed, to access, rectify or erase your data, to withdraw consent, and to lodge a complaint with the <strong>Ukrainian Parliament Commissioner for Human Rights</strong> (ombudsman.gov.ua). Send requests to ${M.email}.</p>

<h2>8. Security</h2>
<p>We apply reasonable technical and organisational measures (HTTPS encryption, password hashing, access control) to protect data.</p>

<p class="legal-meta">Effective from ${M.updated.en}.</p>
`,
            },
        },

        /* ───────────────────────────── 3. COOKIE POLICY ──────────────────────── */
        cookies: {
            title: { ua: 'Політика щодо cookies', en: 'Cookie Policy' },
            body: {
                ua: `
<h2>1. Що таке cookies</h2>
<p>Cookies та подібні технології (наприклад, local storage) — невеликі файли у вашому браузері. Сайт ${M.url} використовує їх для роботи та запам'ятовування ваших налаштувань.</p>

<h2>2. Які cookies ми використовуємо</h2>
<ul>
<li><strong>Необхідні (технічні):</strong> мова, тема, згода на cookies, токен входу користувача. Без них сайт працює некоректно.</li>
<li><strong>Функціональні / третіх сторін:</strong> вхід через Google, який може зберігати власні cookies згідно з <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">політикою Google</a>.</li>
</ul>

<h2>3. Згода та відкликання</h2>
<p>Під час першого візиту ми просимо згоду. Її можна відкликати, видаливши cookies у браузері або знову викликавши панель згоди.</p>

<h2>4. Налаштування браузера</h2>
<p>Зберігання cookies можна обмежити чи заборонити в налаштуваннях браузера; це може вплинути на роботу сайту.</p>

<h2>5. Докладніше</h2>
<p>Обробка даних, отриманих через cookies, регулюється <a href="ochrana-udaju.html">Політикою конфіденційності</a>.</p>

<p class="legal-meta">Чинна з ${M.updated.ua}</p>
`,
                en: `
<h2>1. What cookies are</h2>
<p>Cookies and similar technologies (e.g. local storage) are small files in your browser. The website ${M.url} uses them to operate and remember your settings.</p>

<h2>2. Cookies we use</h2>
<ul>
<li><strong>Necessary (technical):</strong> language, theme, cookie consent, the user's sign-in token. The site does not work correctly without them.</li>
<li><strong>Functional / third-party:</strong> Google sign-in may set its own cookies under <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google's policy</a>.</li>
</ul>

<h2>3. Consent and withdrawal</h2>
<p>We ask for consent on your first visit. You can withdraw it by deleting cookies in your browser or re-opening the consent bar.</p>

<h2>4. Browser settings</h2>
<p>You can restrict or block cookies in your browser; this may affect the site's functionality.</p>

<h2>5. More information</h2>
<p>Processing of data from cookies is governed by the <a href="ochrana-udaju.html">Privacy Policy</a>.</p>

<p class="legal-meta">Effective from ${M.updated.en}.</p>
`,
            },
        },

        /* ──────────────────────── 4. COMPLAINTS / APPEALS ────────────────────── */
        oznamovatele: {
            title: { ua: 'Канал звернень та скарг', en: 'Complaints & Appeals' },
            body: {
                ua: `
<h2>1. Призначення</h2>
<p>Ми цінуємо зворотний зв'язок. Цей канал дозволяє користувачам та організаторам подати звернення, скаргу чи повідомлення про можливе порушення в роботі платформи.</p>

<h2>2. Як подати звернення</h2>
<ul>
<li><strong>E-mail:</strong> ${M.email} (тема «Звернення / скарга»);</li>
<li><strong>Телефон:</strong> ${M.phone};</li>
<li><strong>Особисто</strong> за попередньою домовленістю: ${M.addr.ua}.</li>
</ul>
<p>За бажанням звернення можна подати анонімно.</p>

<h2>3. Розгляд</h2>
<p>Ми підтверджуємо отримання та розглядаємо звернення в розумний строк, як правило до 30 днів (відповідно до Закону України «Про звернення громадян»). За потреби строк може бути обґрунтовано продовжено.</p>

<h2>4. Конфіденційність і захист</h2>
<p>Особу заявника ми зберігаємо в конфіденційності та не допускаємо переслідування за добросовісне звернення. Персональні дані в межах звернення обробляються лише для його розгляду згідно з <a href="ochrana-udaju.html">Політикою конфіденційності</a>.</p>

<p class="legal-meta">Чинний з ${M.updated.ua}</p>
`,
                en: `
<h2>1. Purpose</h2>
<p>We value feedback. This channel lets users and organizers submit a suggestion, complaint or report of a possible breach in the platform's operation.</p>

<h2>2. How to submit</h2>
<ul>
<li><strong>Email:</strong> ${M.email} (subject “Appeal / complaint”);</li>
<li><strong>Phone:</strong> ${M.phone};</li>
<li><strong>In person</strong> by prior arrangement: ${M.addr.en}.</li>
</ul>
<p>Submissions may be anonymous.</p>

<h2>3. Handling</h2>
<p>We acknowledge receipt and handle submissions within a reasonable time, normally up to 30 days (under Ukraine's Law “On Citizens' Appeals”). The period may be reasonably extended where justified.</p>

<h2>4. Confidentiality and protection</h2>
<p>We keep the submitter's identity confidential and allow no retaliation for a good-faith submission. Personal data within a submission is processed only to handle it, per the <a href="ochrana-udaju.html">Privacy Policy</a>.</p>

<p class="legal-meta">Effective from ${M.updated.en}.</p>
`,
            },
        },
    };

    return { meta: M, docs };
})();
