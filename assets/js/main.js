/* Casa Fróes: interações do site (sem dependências) */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Configuração
  // ---------------------------------------------------------------------------
  var WHATSAPP = '5521988817503'; // WhatsApp oficial (site atual)
  // Opcional: endpoint para também registrar o lead (CRM, planilha, e-mail).
  // Deixe vazio para usar somente o WhatsApp. Recebe POST JSON com os campos do formulário.
  var FORM_ENDPOINT = '';

  var MESSAGES = {
    visita: 'Olá! Vim pelo site e gostaria de agendar uma visita à Casa Fróes.',
    info: 'Olá! Vim pelo site da Casa Fróes e gostaria de mais informações.'
  };

  var doc = document.documentElement;
  doc.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDesktop = window.matchMedia('(min-width: 900px)');

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function waLink(text) { return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text); }
  function track(event, data) {
    // Pronto para GA4 / Meta Pixel / GTM: basta instalar a tag. Não envia nada por conta própria.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, data || {}));
  }

  // ---------------------------------------------------------------------------
  // Links de WhatsApp com mensagem pronta
  // ---------------------------------------------------------------------------
  $$('[data-wa]').forEach(function (a) {
    a.href = waLink(MESSAGES[a.getAttribute('data-wa')] || MESSAGES.info);
    a.addEventListener('click', function () { track('whatsapp_click', { origem: a.getAttribute('data-wa') }); });
  });

  var year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // ---------------------------------------------------------------------------
  // Hero: entrada
  // ---------------------------------------------------------------------------
  var hero = $('.hero');
  function heroIn() { if (hero) hero.classList.add('is-loaded'); }
  var heroImg = hero && $('img', hero);
  if (heroImg && !heroImg.complete) {
    heroImg.addEventListener('load', heroIn, { once: true });
    setTimeout(heroIn, 1200); // não segurar o texto se a imagem demorar
  } else {
    requestAnimationFrame(heroIn);
  }

  // ---------------------------------------------------------------------------
  // Header: estado ao rolar, esconder ao descer
  // ---------------------------------------------------------------------------
  var header = $('#siteHeader');
  var waFloat = $('.wa-float');
  var mobileBar = $('.mobile-bar');
  var contact = $('#contato');
  var lastY = window.scrollY;
  var contactVisible = false;

  if (contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      contactVisible = entries[0].isIntersecting;
      onScroll();
    }, { threshold: 0.15 }).observe(contact);
  }

  function onScroll() {
    var y = window.scrollY;
    var heroH = hero ? hero.offsetHeight : 600;
    header.classList.toggle('is-scrolled', y > 40);
    var goingDown = y > lastY + 4;
    var goingUp = y < lastY - 4;
    if (!document.body.classList.contains('menu-open')) {
      if (goingDown && y > heroH) header.classList.add('is-hidden');
      else if (goingUp || y < heroH) header.classList.remove('is-hidden');
    }
    var showCta = y > heroH * 0.75 && !contactVisible;
    if (waFloat) waFloat.classList.toggle('is-visible', showCta);
    if (mobileBar) {
      mobileBar.classList.toggle('is-visible', showCta);
      document.body.classList.add('has-mobile-bar');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------------------
  // Menu mobile
  // ---------------------------------------------------------------------------
  var toggle = $('.menu-toggle');
  var menu = $('#mobileMenu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      header.classList.remove('is-hidden');
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
    } else {
      menu.classList.remove('is-open');
      setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 450);
    }
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
    });
  }

  // ---------------------------------------------------------------------------
  // Navegação ativa
  // ---------------------------------------------------------------------------
  var navLinks = $$('.main-nav a');
  if ('IntersectionObserver' in window) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + entry.target.id));
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var s = $(a.getAttribute('href'));
      if (s) sectionObs.observe(s);
    });
  }

  // ---------------------------------------------------------------------------
  // Revelação ao rolar + contadores
  // ---------------------------------------------------------------------------
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion || !target) return;
    var start = null, dur = 1600;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  var revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        $$('[data-count]', entry.target).forEach(countUp);
        revealObs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------------------------------------------------------------------------
  // Parallax muito sutil (somente desktop, respeita reduced motion)
  // ---------------------------------------------------------------------------
  var parallaxEls = $$('[data-parallax]');
  var ticking = false;
  function parallax() {
    ticking = false;
    if (!isDesktop.matches || reduceMotion) return;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
      var offset = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
  }
  if (parallaxEls.length && !reduceMotion) {
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }, { passive: true });
    isDesktop.addEventListener && isDesktop.addEventListener('change', function () {
      if (!isDesktop.matches) parallaxEls.forEach(function (el) { el.style.transform = ''; });
      parallax();
    });
    parallax();
  }

  // ---------------------------------------------------------------------------
  // Galeria horizontal (swipe nativo + arrastar no desktop + setas)
  // ---------------------------------------------------------------------------
  var gallery = $('[data-gallery]');
  if (gallery) {
    var galleryTrack = $('[data-track]', gallery);
    var slides = $$('.gallery__slide', galleryTrack);
    var section = gallery.closest('section');
    var cur = $('[data-current]', section);
    var total = $('[data-total]', section);
    var bar = $('[data-progress]', gallery);
    var prev = $('[data-prev]', section);
    var next = $('[data-next]', section);
    if (total) total.textContent = String(slides.length).padStart(2, '0');

    function currentIndex() {
      var left = galleryTrack.scrollLeft;
      var best = 0, min = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(s.offsetLeft - galleryTrack.offsetLeft - parseFloat(getComputedStyle(galleryTrack).paddingLeft) - left);
        if (d < min) { min = d; best = i; }
      });
      return best;
    }
    function update() {
      var max = galleryTrack.scrollWidth - galleryTrack.clientWidth;
      var p = max > 0 ? galleryTrack.scrollLeft / max : 0;
      if (bar) bar.style.width = (8 + p * 92) + '%';
      var i = currentIndex();
      if (cur) cur.textContent = String(i + 1).padStart(2, '0');
      if (prev) prev.disabled = galleryTrack.scrollLeft < 8;
      if (next) next.disabled = galleryTrack.scrollLeft > max - 8;
    }
    function go(dir) {
      var i = Math.max(0, Math.min(slides.length - 1, currentIndex() + dir));
      galleryTrack.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    galleryTrack.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    galleryTrack.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    // Arrastar com mouse
    var down = false, moved = false, startX = 0, startLeft = 0;
    galleryTrack.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = galleryTrack.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; galleryTrack.classList.add('is-dragging'); }
      if (moved) galleryTrack.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (moved) {
        galleryTrack.classList.remove('is-dragging');
        var i = currentIndex();
        galleryTrack.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });
      }
    });
    galleryTrack.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
    update();
  }

  // ---------------------------------------------------------------------------
  // Lightbox (galeria do espaço + álbuns dos casamentos)
  // ---------------------------------------------------------------------------
  var lb = $('#lightbox');
  var lbImg = $('[data-lb-img]', lb);
  var lbCap = $('[data-lb-cap]', lb);
  var lbTitle = $('[data-lb-title]', lb);
  var lbCount = $('[data-lb-count]', lb);
  var lbItems = [], lbIndex = 0, lbReturn = null;

  function lbShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    var item = lbItems[lbIndex];
    lbImg.classList.add('is-loading');
    var img = new Image();
    img.onload = img.onerror = function () {
      lbImg.src = item.src;
      lbImg.alt = item.alt || '';
      lbImg.classList.remove('is-loading');
    };
    img.src = item.src;
    lbCap.textContent = item.caption || '';
    lbCount.textContent = String(lbIndex + 1).padStart(2, '0') + ' / ' + String(lbItems.length).padStart(2, '0');
    // pré-carrega a próxima
    var n = lbItems[(lbIndex + 1) % lbItems.length];
    if (n) { var pre = new Image(); pre.src = n.src; }
  }
  function lbOpen(items, index, title, trigger) {
    lbItems = items; lbReturn = trigger;
    lbTitle.textContent = title || '';
    lb.hidden = false;
    document.body.classList.add('lb-open');
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    lbShow(index || 0);
    $('[data-lb-close]', lb).focus();
  }
  function lbClose() {
    lb.classList.remove('is-open');
    document.body.classList.remove('lb-open');
    setTimeout(function () { lb.hidden = true; lbImg.removeAttribute('src'); }, 350);
    if (lbReturn) lbReturn.focus({ preventScroll: true });
  }

  $$('[data-lb-close]', lb).forEach(function (b) { b.addEventListener('click', lbClose); });
  $('[data-lb-prev]', lb).addEventListener('click', function () { lbShow(lbIndex - 1); });
  $('[data-lb-next]', lb).addEventListener('click', function () { lbShow(lbIndex + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__stage')) lbClose(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
    if (e.key === 'Tab') { // mantém o foco dentro do lightbox
      var f = $$('button, a[href]', lb).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  // swipe
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
    tx = null;
  });

  // Galeria do espaço
  var spaceButtons = $$('[data-lightbox="espaco"]');
  var spaceItems = spaceButtons.map(function (b) {
    var img = $('img', b);
    var cap = $('.gallery__cap', b);
    return { src: img.getAttribute('src'), alt: img.alt, caption: cap ? cap.textContent.replace(/\s+/g, ' ').trim() : '' };
  });
  spaceButtons.forEach(function (b, i) {
    b.addEventListener('click', function () { lbOpen(spaceItems, i, 'O espaço', b); });
  });

  // Álbuns dos casamentos
  $$('[data-story]').forEach(function (b) {
    b.addEventListener('click', function () {
      var slug = b.getAttribute('data-story');
      var count = parseInt(b.getAttribute('data-count'), 10) || 1;
      var title = b.getAttribute('data-title');
      var items = [];
      for (var i = 1; i <= count; i++) {
        items.push({ src: 'assets/img/historias/' + slug + '/' + String(i).padStart(2, '0') + '.jpg', alt: title + ': foto ' + i + ' do casamento na Casa Fróes' });
      }
      lbOpen(items, 0, title, b);
      track('story_open', { casal: title });
    });
  });

  // Ver mais histórias
  var moreBtn = $('[data-more-stories]');
  if (moreBtn) {
    moreBtn.addEventListener('click', function () {
      var extras = $$('.story.is-extra');
      extras.forEach(function (s, i) {
        s.hidden = false;
        s.setAttribute('data-reveal', 'img');
        s.style.setProperty('--d', (i % 3) * 0.1 + 's');
        requestAnimationFrame(function () { requestAnimationFrame(function () { s.classList.add('is-in'); }); });
      });
      moreBtn.setAttribute('aria-expanded', 'true');
      moreBtn.hidden = true;
      var ig = $('[data-instagram]');
      if (ig) ig.hidden = false;
      var first = extras[0] && $('button', extras[0]);
      if (first) first.focus({ preventScroll: true });
    });
  }

  // ---------------------------------------------------------------------------
  // Depoimentos
  // ---------------------------------------------------------------------------
  var quotesWrap = $('[data-quotes]');
  if (quotesWrap) {
    var quotes = $$('.quote', quotesWrap);
    var dots = $$('.quotes__dots button');
    var qi = 0, timer = null;
    quotes.forEach(function (q) { q.hidden = false; });
    function showQuote(i) {
      qi = (i + quotes.length) % quotes.length;
      quotes.forEach(function (q, k) {
        q.classList.toggle('is-active', k === qi);
        q.setAttribute('aria-hidden', String(k !== qi));
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', String(k === qi)); d.tabIndex = k === qi ? 0 : -1; });
    }
    function play() { if (reduceMotion) return; stop(); timer = setInterval(function () { showQuote(qi + 1); }, 9000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { showQuote(k); play(); }); });
    $('[data-quote-prev]').addEventListener('click', function () { showQuote(qi - 1); play(); });
    $('[data-quote-next]').addEventListener('click', function () { showQuote(qi + 1); play(); });
    var tsec = quotesWrap.closest('section');
    tsec.addEventListener('mouseenter', stop);
    tsec.addEventListener('mouseleave', play);
    tsec.addEventListener('focusin', stop);
    var qx = null;
    quotesWrap.addEventListener('touchstart', function (e) { qx = e.touches[0].clientX; }, { passive: true });
    quotesWrap.addEventListener('touchend', function (e) {
      if (qx === null) return;
      var dx = e.changedTouches[0].clientX - qx;
      if (Math.abs(dx) > 50) { showQuote(qi + (dx < 0 ? 1 : -1)); play(); }
      qx = null;
    });
    showQuote(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? play() : stop(); }, { threshold: 0.3 }).observe(tsec);
    }
  }

  // ---------------------------------------------------------------------------
  // FAQ: abrir/fechar suave
  // ---------------------------------------------------------------------------
  $$('.faq__item').forEach(function (d) {
    var summary = $('summary', d);
    var body = $('.faq__answer', d);
    summary.addEventListener('click', function (e) {
      if (reduceMotion || !body.animate) return;
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight;
        body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.22,.61,.36,1)' })
          .onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        var h2 = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h2 + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
        track('faq_open', { pergunta: summary.textContent.trim() });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // CTAs que levam ao formulário (com tipo de evento pré-selecionado)
  // ---------------------------------------------------------------------------
  var form = $('#leadForm');
  $$('[data-focus-form]').forEach(function (a) {
    a.addEventListener('click', function () {
      var ev = a.getAttribute('data-event');
      if (ev && form) form.tipo.value = ev;
      track('cta_form_click', { cta: a.textContent.trim(), tipo: ev || '' });
      setTimeout(function () { if (form) form.nome.focus({ preventScroll: true }); }, reduceMotion ? 0 : 900);
    });
  });

  // ---------------------------------------------------------------------------
  // Formulário → WhatsApp
  // ---------------------------------------------------------------------------
  if (form) {
    var phone = form.whatsapp;
    phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '').slice(0, 11);
      var out = d;
      if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length > 7) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(d.length - 4);
      phone.value = out;
    });

    var dateInput = form.data;
    var today = new Date();
    dateInput.min = today.toISOString().slice(0, 10);
    form.semData.addEventListener('change', function () {
      dateInput.disabled = form.semData.checked;
      if (form.semData.checked) dateInput.value = '';
    });

    function setError(field, msg) {
      var wrap = field.closest('.field');
      wrap.classList.toggle('is-invalid', !!msg);
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      var err = $('.field__error', wrap);
      if (err) err.textContent = msg || '';
    }
    function validate() {
      var ok = true, first = null;
      function check(field, cond, msg) {
        if (!cond) { setError(field, msg); ok = false; first = first || field; }
        else setError(field, '');
      }
      check(form.nome, form.nome.value.trim().length >= 2, 'Conte pra gente seu nome.');
      check(phone, phone.value.replace(/\D/g, '').length >= 10, 'Informe um WhatsApp com DDD.');
      check(form.tipo, !!form.tipo.value, 'Selecione o tipo de evento.');
      if (first) first.focus();
      return ok;
    }
    [form.nome, phone, form.tipo].forEach(function (f) {
      f.addEventListener('blur', function () { if (f.closest('.field').classList.contains('is-invalid')) validate(); });
    });

    function formatDate(v) {
      if (!v) return '';
      var p = v.split('-');
      return p[2] + '/' + p[1] + '/' + p[0];
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var data = {
        nome: form.nome.value.trim(),
        whatsapp: phone.value.trim(),
        tipo: form.tipo.value,
        data: form.semData.checked ? 'Ainda não definida' : (formatDate(dateInput.value) || 'Ainda não definida'),
        convidados: form.convidados.value || 'Ainda não sei'
      };
      var msg = 'Olá, Casa Fróes! Vim pelo site e quero conhecer o espaço.\n\n' +
        '• Nome: ' + data.nome + '\n' +
        '• WhatsApp: ' + data.whatsapp + '\n' +
        '• Tipo de evento: ' + data.tipo + '\n' +
        '• Data prevista: ' + data.data + '\n' +
        '• Convidados: ' + data.convidados;
      var url = waLink(msg);

      if (FORM_ENDPOINT) {
        try {
          fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive: true });
        } catch (err) { /* o WhatsApp continua sendo o canal principal */ }
      }
      track('generate_lead', { tipo: data.tipo, convidados: data.convidados });

      var success = $('.lead-form__success', form);
      $('[data-wa-result]', form).href = url;
      success.hidden = false;
      var win = window.open(url, '_blank');
      if (win) win.opener = null;
      else window.location.href = url; // pop-up bloqueado: abre na mesma aba
    });
  }
})();
