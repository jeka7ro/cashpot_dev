<script>
  export let config = {};

  const svgIcons = {
    google: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#4caf50" d="M3.7,2.1L3.7,21.9L16.2,12L3.7,2.1Z"/><path fill="#fbc02d" d="M16.2,12L21.4,15.1L18.8,17.7L16.2,12Z"/><path fill="#e53935" d="M3.7,2.1L16.2,12L18.8,9.4L21.4,6.8L3.7,2.1Z"/><path fill="#1e88e5" d="M3.7,21.9L21.4,15.1L18.8,17.7L3.7,21.9Z"/></svg>',
    
    apple: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M16.3,13.7c0-2.3,1.9-3.4,2-3.4c-1.1-1.6-2.8-1.8-3.4-1.8c-1.4-0.1-2.8,0.8-3.6,0.8c-0.8,0-1.9-0.8-3.1-0.8C6.5,8.5,5,9.6,4.1,11c-1.7,2.9-0.4,7.2,1.3,9.5C6.1,21.5,7,22.5,8.1,22.5c1.1,0,1.5-0.7,2.9-0.7c1.4,0,1.8,0.7,2.9,0.7c1.1,0,1.9-0.9,2.7-2c0.9-1.3,1.3-2.6,1.3-2.6C17.9,17.8,16.3,16,16.3,13.7z M14.1,6.5c0.6-0.8,1-1.8,1-2.9c0-0.1,0-0.2,0-0.3c-1,0-2.2,0.6-2.9,1.4c-0.6,0.7-1,1.7-1,2.8c0,0.1,0,0.2,0,0.3C12.3,7.9,13.4,7.2,14.1,6.5z"/></svg>',
    
    huawei: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#e60012" d="M12 1L22 6V18L12 23L2 18V6L12 1ZM12 4.2L5.2 7.6V16.4L12 19.8L18.8 16.4V7.6L12 4.2Z"/></svg>',
    
    cash: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#10b981" d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18ZM12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8ZM12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12C14 13.1 13.1 14 12 14Z"/></svg>',
    
    bank: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#3b82f6" d="M11.5 1L2 6V8H21V6L11.5 1ZM11.5 3.3L16.2 5.8H6.8L11.5 3.3ZM4 10H7V17H4V10ZM10 10H13V17H10V10ZM16 10H19V17H16V10ZM2 19H21V21H2V19Z"/></svg>',
    
    visa: '<svg viewBox="0 0 400 130" width="40" height="24"><path fill="#1434CB" d="M166.4 125.7l25.6-121.2h41.2l-25.6 121.2h-41.2zm172.9-118.4c-11.4-4.5-30-8.8-52.6-8.8-57.9 0-98.7 30.1-98.9 73.1-.2 31.8 29.1 49.5 51.3 60.1 22.7 10.9 30.3 17.9 30.3 27.6 0 14.8-18.1 21.6-34.9 21.6-23.4 0-35.9-3.5-51-10.2l-7.2-3.3-7.3 44.5c12.7 5.8 36.1 10.7 60.6 10.9 61.5 0 101.9-29.6 102.1-75.3.2-24.9-14.8-43.8-49.3-59.9-20.4-10-32.5-16.7-32.5-26.9 0-9.2 10.5-19 32.7-19 18.2-.2 31.7 3.9 42.6 8.8l5.1 2.4 7-45.5zm88.7 118.4h37.7l-32.7-121.2h-29.1c-9.2 0-16.9 5.4-20.7 13.9l-58.6 107.3h43.1s7-19.1 8.5-23.4h52.8c1.3 6.3 5 23.4 5 23.4zm-48.4-53.1c3.1-8.3 15-40.4 15-40.4s3.1 8.7 5.4 15.3l12.4 34.2h-36.8l4-9.1zm-258.4 53.1l-40.5-83c-4.4-11.6-12-16.6-22-17.7l-69.6-1.5-.7 3.3c14.2 2.9 30.1 7.8 40.2 13 6.1 3.1 7.8 5.7 11.4 19.3l38 103.9h43.5l65.8-121.2h-43.4l-22.7 83.9z"/></svg>',
    
    mastercard: '<svg viewBox="0 0 40 24" width="40" height="24"><circle cx="14" cy="12" r="10" fill="#EB001B"/><circle cx="26" cy="12" r="10" fill="#F79E1B"/><path d="M20 18A9.9 9.9 0 0024 12A9.9 9.9 0 0020 6A9.9 9.9 0 0016 12A9.9 9.9 0 0020 18Z" fill="#FF5F00"/></svg>',
    
    paysafe: '<svg viewBox="0 0 100 30" width="50" height="24"><rect width="100" height="30" rx="15" fill="#0071CE"/><text x="50" y="20" fill="#FFF" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle">paysafecard</text></svg>',
    
    revolut: '<svg viewBox="0 0 100 30" width="50" height="24"><rect width="100" height="30" rx="4" fill="#fff"/><text x="50" y="20" fill="#000" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle">Revolut</text></svg>',
    
    applepay: '<svg viewBox="0 0 80 30" width="50" height="24"><rect width="80" height="30" rx="4" fill="#000"/><path fill="#fff" d="M22 17c0-2 1.6-3.1 1.7-3.2-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.7 0-1.7-.7-2.6-.7-1.3 0-2.6 1-3.3 2.2-1.5 2.5-.4 6.2 1.1 8.2.7 1 1.6 2 2.6 2 .9 0 1.3-.6 2.4-.6s1.6.6 2.4.6c1 0 1.7-.9 2.4-1.9.8-1.2 1.1-2.3 1.1-2.3-.1 0-1.9-.7-1.9-3.4zM20 5.6c.5-.7.9-1.6.9-2.5 0-.1 0-.2 0-.3-.9 0-2.1.6-2.7 1.3-.5.6-1 1.5-1 2.5 0 .1 0 .2 0 .3.9-.1 1.9-.7 2.8-1.3z"/><text x="45" y="21" fill="#fff" font-family="Arial" font-size="14" font-weight="bold">Pay</text></svg>',
    
    facebook: '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    
    instagram: '<svg viewBox="0 0 24 24" width="24" height="24" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.905a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
    
    youtube: '<svg viewBox="0 0 24 24" width="24" height="24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
  };

  const getIcon = (type) => svgIcons[type] || '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="8" fill="#555"/></svg>';
</script>

<footer class="cashpot-footer">
  <div class="footer-container">
    <div class="footer-grid-5">
      <!-- 1. DESPRE CASHPOT -->
      <div class="footer-col">
        <h3>DESPRE CASHPOT</h3>
        <ul>
          {#if config.aboutLinks}
            {#each config.aboutLinks as link}
              <li><a href={link.url}>{link.label}</a></li>
            {/each}
          {/if}
        </ul>
      </div>

      <!-- 2. DISPONIBIL IN / METODE PLATA -->
      <div class="footer-col info-col">
        <h3>DISPONIBIL ÎN</h3>
        <ul class="apps-list">
          {#if config.apps}
            {#each config.apps as app}
              <li>
                <div class="icon-wrap app-icon">
                  {@html getIcon(app.iconType)}
                </div>
                <span>{app.label}</span>
              </li>
            {/each}
          {/if}
        </ul>

        <h3 class="mt-4">METODE DE PLATĂ</h3>
        <ul class="payments-list">
          {#if config.paymentMethods}
            {#each config.paymentMethods as method}
              <li>
                <div class="icon-wrap pay-icon">
                  {@html getIcon(method.iconType)}
                </div>
                <span>{method.label}</span>
              </li>
            {/each}
          {/if}
        </ul>
      </div>

      <!-- 3. OFERTA -->
      <div class="footer-col">
        <h3>OFERTĂ</h3>
        <ul>
          {#if config.offerLinks}
            {#each config.offerLinks as link}
              <li><a href={link.url}>{link.label}</a></li>
            {/each}
          {/if}
        </ul>
      </div>

      <!-- 4. AJUTOR -->
      <div class="footer-col">
        <h3>AJUTOR</h3>
        <ul>
          {#if config.helpLinks}
            {#each config.helpLinks as link}
              <li><a href={link.url}>{link.label}</a></li>
            {/each}
          {/if}
        </ul>
      </div>

      <!-- 5. JOACA RESPONSABIL -->
      <div class="footer-col resp-col">
        <h3>JOACĂ RESPONSABIL</h3>
        <p class="resp-text">{config.responsibleGaming?.text}</p>
        <div class="resp-logos">
          {#if config.responsibleGaming?.logos}
            {#each config.responsibleGaming.logos as logo}
              <img src={logo.url} alt="Logo" />
            {/each}
          {/if}
        </div>
      </div>
    </div>

    <!-- Bottom Sections -->
    <div class="footer-bottom-wrapper">
      {#if config.sponsors && config.sponsors.length > 0}
        <div class="footer-sponsors">
          <h3>SPONSORIZĂRI</h3>
          <p>Susținem cu mândrie:</p>
          <div class="sponsors-grid">
            {#each config.sponsors as sponsor}
              <img src={sponsor.image} alt="Sponsor" />
            {/each}
          </div>
        </div>
      {/if}

      <div class="footer-legal-social">
        <div class="legal-text">
          {config.legalText}
          <a href="#admin" class="admin-cms-link" title="Panou de Administrare Smart CMS">⚙️ Admin CMS</a>
        </div>
        <div class="social-links">
          {#if config.social}
            {#each config.social as s}
              <a href={s.url} target="_blank" rel="noopener noreferrer">{@html getIcon(s.iconType)}</a>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  </div>
</footer>

<style>
  .cashpot-footer {
    background: #111;
    color: #9ca3af;
    font-family: 'Inter', sans-serif;
    padding: 60px 0 30px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 0.75rem;
  }

  .footer-container {
    max-width: 1440px;
    margin: 0 auto;
    padding: 0 40px;
  }

  .footer-grid-5 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1.5fr;
    gap: 40px;
    margin-bottom: 60px;
  }

  .footer-col h3 {
    color: #fff;
    font-size: 0.85rem;
    font-weight: 700;
    margin-bottom: 24px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .footer-col ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .footer-col li {
    margin-bottom: 14px;
  }

  .footer-col a {
    color: #9ca3af;
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-col a:hover {
    color: #fff;
  }

  /* Info Column (Apps / Payments) */
  .apps-list li, .payments-list li {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #d1d5db;
    font-size: 0.8rem;
  }

  .icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: transparent;
  }

  .icon-wrap.pay-icon {
    width: 44px;
    height: 28px;
    background: #fff; /* White bg for logos like Visa/Mastercard/Revolut */
    padding: 2px 4px;
    border-radius: 4px;
  }

  .icon-wrap.app-icon {
    width: 24px;
    height: 24px;
  }

  .mt-4 { margin-top: 36px; }

  /* Responsible column */
  .resp-text {
    line-height: 1.6;
    margin-bottom: 24px;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .resp-logos {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
  }

  .resp-logos img {
    height: 24px;
    opacity: 0.8;
  }

  /* Bottom wrappers */
  .footer-bottom-wrapper {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 40px;
  }

  .footer-sponsors {
    margin-bottom: 40px;
  }

  .footer-sponsors h3 {
    color: #fff;
    font-size: 0.85rem;
    font-weight: 700;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .footer-sponsors p {
    margin-bottom: 20px;
  }

  .sponsors-grid {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }

  .sponsors-grid img {
    height: 30px;
    filter: grayscale(100%);
    opacity: 0.5;
    transition: all 0.3s;
  }

  .sponsors-grid img:hover {
    filter: grayscale(0%);
    opacity: 1;
  }

  .footer-legal-social {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
  }

  .legal-text {
    flex: 1;
    font-size: 0.7rem;
    line-height: 1.6;
    color: #6b7280;
  }

  .social-links {
    display: flex;
    gap: 16px;
  }

  .social-links a {
    color: #9ca3af;
    transition: all 0.2s;
    display: flex;
    opacity: 0.6;
  }

  .social-links a:hover {
    color: #fff;
    opacity: 1;
  }

  .admin-cms-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 10px;
    color: #6b7280;
    text-decoration: none;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
  }
  .admin-cms-link:hover {
    color: #facc15;
    background: rgba(250, 204, 21, 0.1);
    border-color: rgba(250, 204, 21, 0.3);
  }

  @media (max-width: 1024px) {
    .footer-grid-5 {
      grid-template-columns: 1fr 1fr;
    }
    .footer-col.resp-col {
      grid-column: span 2;
    }
  }

  @media (max-width: 640px) {
    .footer-grid-5 {
      grid-template-columns: 1fr;
    }
    .footer-col.resp-col {
      grid-column: span 1;
    }
    .footer-legal-social {
      flex-direction: column;
      align-items: flex-start;
      gap: 24px;
    }
  }
</style>
